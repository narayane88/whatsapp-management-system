import { Boom } from '@hapi/boom';
import * as Baileys from 'baileys';
const { 
  makeWASocket,
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  isJidBroadcast,
  isJidNewsletter
} = Baileys;
type WASocket = Baileys.WASocket;
import { v4 as uuidv4 } from 'uuid';
import { mkdir, access } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import logger from '../utils/logger.js';
import { WhatsAppAccount, SessionInfo, SendMessageRequest, SendMessageResponse } from '../types.js';
import { WebhookManager } from './WebhookManager.js';

export class SessionManager {
  private accounts = new Map<string, WhatsAppAccount>();
  private sessionsDir: string;
  private webhookManager: WebhookManager;
  private lastConnectionAttempt = 0;
  private readonly CONNECTION_COOLDOWN = 30000; // 30 seconds between attempts
  private connectedDevicesHistory: any[] = [];
  private qrTimeouts = new Map<string, NodeJS.Timeout>(); // Track QR timeouts for each account
  private readonly QR_TIMEOUT = 50000; // 50 seconds timeout for QR code requests

  constructor(sessionsDir = './sessions') {
    this.sessionsDir = sessionsDir;
    this.webhookManager = new WebhookManager();
    this.ensureSessionsDirectory();
    this.loadDeviceHistory();
    // Restore sessions asynchronously after construction
    setImmediate(() => {
      this.restoreExistingSessions().catch(error => {
        logger.error('Failed to restore sessions during initialization:', error);
      });
    });
  }

  private async ensureSessionsDirectory(): Promise<void> {
    try {
      await access(this.sessionsDir);
    } catch {
      await mkdir(this.sessionsDir, { recursive: true });
      logger.info(`Created sessions directory: ${this.sessionsDir}`);
    }
  }

  async createAccount(id?: string, phoneNumber?: string, webhookUrl?: string, usePairingCode = false): Promise<WhatsAppAccount> {
    // Rate limiting protection
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastConnectionAttempt;
    
    if (timeSinceLastAttempt < this.CONNECTION_COOLDOWN) {
      const waitTime = this.CONNECTION_COOLDOWN - timeSinceLastAttempt;
      throw new Error(`Rate limited: Please wait ${Math.ceil(waitTime / 1000)} seconds before creating another account`);
    }
    
    this.lastConnectionAttempt = now;

    const accountId = id || uuidv4();
    const sessionPath = path.join(this.sessionsDir, `account-${accountId}`);

    if (this.accounts.has(accountId)) {
      throw new Error(`Account ${accountId} already exists`);
    }

    const account: WhatsAppAccount = {
      id: accountId,
      phoneNumber,
      status: 'connecting',
      sessionPath,
      webhookUrl
    };

    this.accounts.set(accountId, account);
    logger.info(`Creating account ${accountId}`, { phoneNumber, usePairingCode });

    // Start QR timeout for this account - if no QR is requested within 50 seconds, cleanup
    this.startQRTimeout(accountId);

    try {
      await this.initializeSocket(account, usePairingCode);
      return account;
    } catch (error) {
      this.accounts.delete(accountId);
      this.clearQRTimeout(accountId);
      throw error;
    }
  }

  private async initializeSocket(account: WhatsAppAccount, usePairingCode = false): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(account.sessionPath);
      const { version } = await fetchLatestBaileysVersion();

      const socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger as any)
        },
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        // Update browser identification for Windows
        browser: ['Chrome (Windows)', '', ''],
        markOnlineOnConnect: false, // Don't mark online immediately
        syncFullHistory: false,
        shouldIgnoreJid: (jid) => isJidBroadcast(jid), // Ignore broadcast messages
        // QR code timeout set to 20 minutes for mobile scanning
        qrTimeout: 1200_000, // 20 minutes timeout for QR codes
        connectTimeoutMs: 120_000, // 2 minutes connection timeout
        defaultQueryTimeoutMs: 120_000, // 2 minutes query timeout
        keepAliveIntervalMs: 30_000, // 30 second keep alive interval
        retryRequestDelayMs: 1000, // 1 second delay between retries
        maxMsgRetryCount: 5, // Retry messages up to 5 times
        // Better message handling
        getMessage: async (key) => {
          return {
            conversation: 'Message not available'
          }
        },
        // Additional socket options can be configured here if needed
        // Enhanced logging for debugging
        logger: logger.child({ class: 'baileys-socket' }) as any
      });

    account.socket = socket;

    // Add global error handler for this socket
    socket.ev.on('creds.update' as any, (error: any) => {
      logger.error(`Socket error for account ${account.id}:`, error);
    });

    // Handle pairing code
    if (usePairingCode && !socket.authState.creds.registered && account.phoneNumber) {
      try {
        const code = await socket.requestPairingCode(account.phoneNumber);
        account.pairingCode = code;
        logger.info(`Pairing code generated for ${account.id}: ${code}`);
      } catch (error) {
        logger.error(`Failed to generate pairing code for ${account.id}:`, error);
      }
    }

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      logger.info(`Connection update for ${account.id}:`, { connection, lastDisconnect });

      if (qr && !usePairingCode) {
        try {
          // Generate QR code with optimal settings for mobile scanning
          account.qrCode = await QRCode.toDataURL(qr, {
            errorCorrectionLevel: 'H' as any, // High error correction for better mobile scanning
            type: 'image/png' as any,
            margin: 3, // Increased margin for better scanning
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            width: 400, // Increased width for better mobile scanning
            scale: 6 // Higher scale for better resolution
          } as any);
          logger.info(`QR code generated for ${account.id}`, { qrLength: qr.length });
          
          // QR code is available, reset the timeout to give user more time to scan
          this.resetQRTimeout(account.id);
        } catch (error) {
          logger.error(`Failed to generate QR code for ${account.id}:`, error);
          account.qrCode = undefined; // Clear invalid QR code
        }
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        const errorReason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        
        logger.info(`Connection closed for ${account.id}, error code: ${errorReason}, should reconnect: ${shouldReconnect}`);
        
        if (shouldReconnect && errorReason !== DisconnectReason.badSession) {
          // Enhanced reconnection delays for different error types
          let reconnectDelay = 10000; // Default 10 seconds
          
          if (errorReason === 428) {
            // Rate limiting - use exponential backoff
            const attemptCount = (account as any).reconnectAttempts || 0;
            reconnectDelay = Math.min(900000, 60000 * Math.pow(2, attemptCount)); // Max 15 minutes
            (account as any).reconnectAttempts = attemptCount + 1;
            
            logger.warn(`Rate limited (428) - attempt ${attemptCount + 1}, waiting ${reconnectDelay/1000}s before reconnect`);
          } else if (errorReason === 408) {
            // DNS/Connectivity issues - longer delay for Indian networks
            reconnectDelay = 30000; // 30 seconds for connectivity issues
            logger.warn(`Connectivity error (408) - DNS/network issue, waiting ${reconnectDelay/1000}s before reconnect`);
          } else {
            // Reset attempt counter for non-rate limit errors
            (account as any).reconnectAttempts = 0;
          }
          
          logger.info(`Reconnecting account ${account.id} in ${reconnectDelay}ms (reason: ${errorReason})`);
          // Clear old QR code on reconnection
          account.qrCode = undefined;
          account.pairingCode = undefined;
          account.status = 'connecting';
          
          setTimeout(() => {
            if (this.accounts.has(account.id)) { // Check if account still exists
              this.initializeSocket(account, usePairingCode).catch(error => {
                logger.error(`Failed to reconnect account ${account.id}:`, error);
                account.status = 'error';
              });
            }
          }, reconnectDelay);
        } else {
          logger.info(`Account ${account.id} logged out or bad session`);
          account.status = 'disconnected';
          account.qrCode = undefined;
          account.pairingCode = undefined;
          
          if (account.webhookUrl) {
            const payload = this.webhookManager.createAccountDisconnectedPayload(account.id, 'logged_out');
            await this.webhookManager.sendWebhook(account.webhookUrl, payload);
          }
        }
      } else if (connection === 'connecting') {
        logger.info(`Account ${account.id} is connecting...`);
        account.status = 'connecting';
      } else if (connection === 'open') {
        logger.info(`Account ${account.id} connected successfully`);
        account.status = 'connected';
        account.lastConnected = new Date();
        account.qrCode = undefined;
        account.pairingCode = undefined;
        
        // Clear QR timeout since account is now connected
        this.clearQRTimeout(account.id);
        
        // Auto-detect and store phone number information
        if (socket.user) {
          const phoneNumber = socket.user.id.replace(/:\d+@s\.whatsapp\.net$/, '');
          const userName = socket.user.name || 'Unknown User';
          const deviceInfo = {
            phoneNumber: phoneNumber.startsWith('91') ? `+${phoneNumber}` : phoneNumber,
            userName: userName,
            connectedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            deviceId: socket.user.id,
            platform: 'mobile' // Detected from QR scan
          };
          
          // Store device information in account
          (account as any).deviceInfo = deviceInfo;
          (account as any).phoneNumber = deviceInfo.phoneNumber;
          
          // Save to device history for future reference
          this.saveDeviceToHistory(account.id, deviceInfo);
          
          logger.info(`Device connected and auto-detected:`, {
            accountId: account.id,
            phoneNumber: deviceInfo.phoneNumber,
            userName: deviceInfo.userName,
            deviceId: deviceInfo.deviceId
          });
        }
      }

      // Send webhook for connection updates
      if (account.webhookUrl) {
        const payload = this.webhookManager.createConnectionUpdatePayload(
          account.id,
          connection || 'unknown',
          account.qrCode,
          account.pairingCode
        );
        await this.webhookManager.sendWebhook(account.webhookUrl, payload);
      }
    });

    // Handle credential updates
    socket.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    socket.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const message of m.messages) {
          if (!message.key.fromMe && account.webhookUrl) {
            const messageData = this.formatMessage(message);
            const payload = this.webhookManager.createMessageReceivedPayload(account.id, messageData);
            await this.webhookManager.sendWebhook(account.webhookUrl, payload);
          }
        }
      }
    });

    // Handle message status updates
    socket.ev.on('messages.update', async (updates) => {
      if (account.webhookUrl) {
        for (const update of updates) {
          const payload = this.webhookManager.createMessageStatusPayload(account.id, update);
          await this.webhookManager.sendWebhook(account.webhookUrl, payload);
        }
      }
    });
    } catch (error) {
      logger.error(`Failed to initialize socket for account ${account.id}:`, error);
      account.status = 'error';
      throw error;
    }
  }

  private formatMessage(message: any): any {
    const messageContent = message.message;
    let formattedMessage: any = {
      messageId: message.key.id,
      from: message.key.remoteJid,
      timestamp: parseInt(message.messageTimestamp) * 1000,
      message: {}
    };

    if (messageContent?.conversation) {
      formattedMessage.message = {
        type: 'text',
        text: messageContent.conversation
      };
    } else if (messageContent?.extendedTextMessage) {
      formattedMessage.message = {
        type: 'text',
        text: messageContent.extendedTextMessage.text
      };
    } else if (messageContent?.imageMessage) {
      formattedMessage.message = {
        type: 'image',
        caption: messageContent.imageMessage.caption,
        mediaUrl: messageContent.imageMessage.url
      };
    } else if (messageContent?.videoMessage) {
      formattedMessage.message = {
        type: 'video',
        caption: messageContent.videoMessage.caption,
        mediaUrl: messageContent.videoMessage.url
      };
    } else if (messageContent?.audioMessage) {
      formattedMessage.message = {
        type: 'audio',
        mediaUrl: messageContent.audioMessage.url
      };
    } else if (messageContent?.documentMessage) {
      formattedMessage.message = {
        type: 'document',
        caption: messageContent.documentMessage.caption,
        mediaUrl: messageContent.documentMessage.url,
        filename: messageContent.documentMessage.fileName
      };
    } else if (messageContent?.locationMessage) {
      formattedMessage.message = {
        type: 'location',
        location: {
          latitude: messageContent.locationMessage.degreesLatitude,
          longitude: messageContent.locationMessage.degreesLongitude
        }
      };
    }

    return formattedMessage;
  }

  async sendMessage(accountId: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    const account = this.accounts.get(accountId);
    
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (!account.socket || account.status !== 'connected') {
      throw new Error(`Account ${accountId} is not connected`);
    }

    try {
      let messageContent: any;

      if (request.message.text) {
        messageContent = { text: request.message.text };
      } else if (request.message.image) {
        messageContent = {
          image: { url: request.message.image.url },
          caption: request.message.image.caption
        };
      } else if (request.message.video) {
        messageContent = {
          video: { url: request.message.video.url },
          caption: request.message.video.caption
        };
      } else if (request.message.audio) {
        messageContent = {
          audio: { url: request.message.audio.url },
          mimetype: 'audio/mp4'
        };
      } else if (request.message.document) {
        messageContent = {
          document: { url: request.message.document.url },
          fileName: request.message.document.filename,
          caption: request.message.document.caption
        };
      } else if (request.message.location) {
        messageContent = {
          location: {
            degreesLatitude: request.message.location.latitude,
            degreesLongitude: request.message.location.longitude,
            name: request.message.location.name,
            address: request.message.location.address
          }
        };
      } else {
        throw new Error('Invalid message type');
      }

      const result = await account.socket.sendMessage(request.to, messageContent);
      
      return {
        success: true,
        messageId: result?.key?.id || undefined
      };
    } catch (error: any) {
      logger.error(`Failed to send message from ${accountId}:`, error);
      return {
        success: false,
        error: error?.message || 'Unknown error'
      };
    }
  }


  getAccount(accountId: string): WhatsAppAccount | undefined {
    return this.accounts.get(accountId);
  }

  // Public method to reset QR timeout when QR is requested
  resetQRTimeoutOnRequest(accountId: string): void {
    const account = this.accounts.get(accountId);
    if (account && account.qrCode) {
      logger.info(`QR code requested for ${accountId} - resetting timeout`);
      this.resetQRTimeout(accountId);
    }
  }

  getAllAccounts(): SessionInfo[] {
    return Array.from(this.accounts.values()).map(account => ({
      id: account.id,
      status: account.socket?.user ? 'connected' as any : account.status as any,
      phoneNumber: (account as any).phoneNumber || account.phoneNumber,
      lastSeen: account.lastConnected,
      qrCode: account.qrCode,
      pairingCode: account.pairingCode,
      deviceInfo: (account as any).deviceInfo,
      userName: (account as any).deviceInfo?.userName
    }));
  }

  getAccountCount(): number {
    return this.accounts.size;
  }

  // Session cleanup and management methods
  cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): number { // Default: 24 hours
    let deletedCount = 0;
    const currentTime = Date.now();

    try {
      if (!fs.existsSync(this.sessionsDir)) {
        return 0;
      }

      const sessionDirs = fs.readdirSync(this.sessionsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('account-'))
        .map(dirent => dirent.name);

      for (const dirName of sessionDirs) {
        const dirPath = path.join(this.sessionsDir, dirName);
        const accountId = dirName.replace('account-', '');
        
        // Don't delete active accounts
        if (this.accounts.has(accountId)) {
          continue;
        }

        try {
          const stats = fs.statSync(dirPath);
          const lastModified = stats.mtime.getTime();
          const age = currentTime - lastModified;

          if (age > maxAge) {
            logger.info(`Cleaning up old session: ${accountId} (${Math.round(age / 1000 / 60 / 60)} hours old)`);
            this.deleteSessionFiles(accountId);
            deletedCount++;
          }
        } catch (error) {
          logger.error(`Error checking session ${accountId}:`, error);
        }
      }

      logger.info(`Session cleanup complete. Deleted ${deletedCount} old sessions`);
      return deletedCount;
    } catch (error) {
      logger.error('Error during session cleanup:', error);
      return 0;
    }
  }

  deleteSessionFiles(accountId: string): boolean {
    const sessionPath = path.join(this.sessionsDir, `account-${accountId}`);
    
    try {
      if (fs.existsSync(sessionPath)) {
        // First, try to remove all files and subdirectories
        const entries = fs.readdirSync(sessionPath, { withFileTypes: true });
        
        // Remove all files and subdirectories
        for (const entry of entries) {
          const entryPath = path.join(sessionPath, entry.name);
          try {
            if (entry.isDirectory()) {
              fs.rmSync(entryPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(entryPath);
            }
          } catch (entryError) {
            logger.warn(`Failed to delete ${entryPath}:`, entryError);
          }
        }
        
        // Remove the main session directory
        fs.rmSync(sessionPath, { recursive: true, force: true });
        logger.info(`Completely deleted session directory and all files for account: ${accountId}`);
        return true;
      } else {
        logger.debug(`Session path does not exist for account: ${accountId}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to delete session files for ${accountId}:`, error);
      // Try force removal as fallback
      try {
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          logger.info(`Force deleted session files for account: ${accountId}`);
          return true;
        }
      } catch (forceError) {
        logger.error(`Force delete also failed for ${accountId}:`, forceError);
      }
      return false;
    }
  }

  // QR timeout management methods
  private startQRTimeout(accountId: string): void {
    // Clear any existing timeout
    this.clearQRTimeout(accountId);
    
    logger.info(`Starting QR timeout for account ${accountId} - will auto-cleanup in ${this.QR_TIMEOUT/1000} seconds`);
    
    const timeout = setTimeout(() => {
      logger.warn(`QR timeout reached for account ${accountId} - no QR request within ${this.QR_TIMEOUT/1000} seconds`);
      this.cleanupAccountOnTimeout(accountId);
    }, this.QR_TIMEOUT);
    
    this.qrTimeouts.set(accountId, timeout);
  }

  private resetQRTimeout(accountId: string): void {
    logger.info(`QR code generated for ${accountId} - extending timeout for scanning`);
    this.clearQRTimeout(accountId);
    
    // Give extra time for scanning once QR is generated (2 minutes)
    const scanTimeout = setTimeout(() => {
      const account = this.accounts.get(accountId);
      if (account && account.status !== 'connected') {
        logger.warn(`QR scan timeout reached for account ${accountId} - cleaning up unscanned session`);
        this.cleanupAccountOnTimeout(accountId);
      }
    }, 120000); // 2 minutes for scanning
    
    this.qrTimeouts.set(accountId, scanTimeout);
  }

  private clearQRTimeout(accountId: string): void {
    const timeout = this.qrTimeouts.get(accountId);
    if (timeout) {
      clearTimeout(timeout);
      this.qrTimeouts.delete(accountId);
      logger.debug(`Cleared QR timeout for account ${accountId}`);
    }
  }

  private async cleanupAccountOnTimeout(accountId: string): Promise<void> {
    logger.info(`Auto-cleaning up account ${accountId} due to QR timeout`);
    
    try {
      // Force cleanup with session deletion and device logout for complete cleanup
      await this.disconnectAccount(accountId, true, true);
    } catch (error) {
      logger.error(`Error during timeout cleanup for ${accountId}:`, error);
    }
  }

  // Enhanced disconnect with session cleanup
  async disconnectAccount(accountId: string, cleanupSession: boolean = true, forceLogout: boolean = false): Promise<void> {
    const account = this.accounts.get(accountId);
    
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    try {
      // Clear QR timeout
      this.clearQRTimeout(accountId);
      
      // Force logout from WhatsApp if requested and socket is available
      if (forceLogout && account.socket) {
        try {
          logger.info(`Force logging out device for account ${accountId}`);
          // Send logout command to WhatsApp to force device logout
          await account.socket.logout();
          logger.info(`Device logout successful for account ${accountId}`);
        } catch (logoutError) {
          logger.warn(`Failed to logout device for ${accountId}:`, logoutError);
          // Continue with disconnection even if logout fails
        }
      }
      
      // Close socket connection
      if (account.socket) {
        try {
          // Wait a moment for logout to process before closing socket
          if (forceLogout) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          (account.socket as any).end();
          logger.debug(`Socket closed for account ${accountId}`);
        } catch (error) {
          logger.warn(`Error ending socket for ${accountId}:`, error);
        }
      }

      // Update status
      account.status = 'disconnected';
      account.qrCode = undefined;
      account.pairingCode = undefined;

      // Remove from active accounts
      this.accounts.delete(accountId);

      // Send disconnect webhook
      if (account.webhookUrl) {
        const payload = this.webhookManager.createAccountDisconnectedPayload(
          accountId, 
          forceLogout ? 'force_logout' : 'manual_disconnect'
        );
        await this.webhookManager.sendWebhook(account.webhookUrl, payload);
      }

      // Clean up session files if requested
      if (cleanupSession) {
        this.deleteSessionFiles(accountId);
        logger.info(`Session files deleted for account ${accountId}`);
      }

      logger.info(`Account ${accountId} disconnected${forceLogout ? ' with device logout' : ''}${cleanupSession ? ' and session cleaned up' : ''}`);
    } catch (error) {
      logger.error(`Error disconnecting account ${accountId}:`, error);
      throw error;
    }
  }

  // Load device history from storage
  private loadDeviceHistory(): void {
    try {
      const historyPath = path.join(this.sessionsDir, 'device-history.json');
      if (fs.existsSync(historyPath)) {
        const historyData = fs.readFileSync(historyPath, 'utf8');
        this.connectedDevicesHistory = JSON.parse(historyData);
        logger.info(`Loaded ${this.connectedDevicesHistory.length} devices from history`);
      } else {
        this.connectedDevicesHistory = [];
        logger.info('No device history found, starting fresh');
      }
    } catch (error) {
      logger.error('Failed to load device history:', error);
      this.connectedDevicesHistory = [];
    }
  }

  // Save device to history for future reference
  private saveDeviceToHistory(accountId: string, deviceInfo: any): void {
    try {
      const historyEntry = {
        ...deviceInfo,
        accountId: accountId,
        firstConnected: deviceInfo.connectedAt,
        lastConnected: deviceInfo.connectedAt,
        connectionCount: 1,
        historyId: `${accountId}_${Date.now()}`
      };

      // Check if device already exists in history
      const existingIndex = this.connectedDevicesHistory.findIndex(
        entry => entry.deviceId === deviceInfo.deviceId || 
        (entry.phoneNumber === deviceInfo.phoneNumber && entry.accountId === accountId)
      );

      if (existingIndex >= 0) {
        // Update existing entry
        this.connectedDevicesHistory[existingIndex] = {
          ...this.connectedDevicesHistory[existingIndex],
          lastConnected: deviceInfo.connectedAt,
          connectionCount: (this.connectedDevicesHistory[existingIndex].connectionCount || 1) + 1,
          userName: deviceInfo.userName // Update name in case it changed
        };
        logger.info(`Updated device history for ${deviceInfo.phoneNumber}`);
      } else {
        // Add new entry
        this.connectedDevicesHistory.push(historyEntry);
        logger.info(`Added new device to history: ${deviceInfo.phoneNumber}`);
      }

      // Save to file
      const historyPath = path.join(this.sessionsDir, 'device-history.json');
      fs.writeFileSync(historyPath, JSON.stringify(this.connectedDevicesHistory, null, 2), 'utf8');

      // Keep only last 100 entries to prevent file from growing too large
      if (this.connectedDevicesHistory.length > 100) {
        this.connectedDevicesHistory = this.connectedDevicesHistory
          .sort((a, b) => new Date(b.lastConnected).getTime() - new Date(a.lastConnected).getTime())
          .slice(0, 100);
        fs.writeFileSync(historyPath, JSON.stringify(this.connectedDevicesHistory, null, 2), 'utf8');
      }
    } catch (error) {
      logger.error('Failed to save device to history:', error);
    }
  }

  // Get device connection history
  getDeviceHistory(): any[] {
    return this.connectedDevicesHistory;
  }

  // Get device history for specific account
  getAccountDeviceHistory(accountId: string): any[] {
    return this.connectedDevicesHistory.filter(entry => entry.accountId === accountId);
  }

  // Restore existing sessions from filesystem
  private async restoreExistingSessions(): Promise<void> {
    try {
      if (!fs.existsSync(this.sessionsDir)) {
        logger.info('No sessions directory found, starting fresh');
        return;
      }

      const sessionDirs = fs.readdirSync(this.sessionsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('account-'))
        .map(dirent => dirent.name);

      logger.info(`Found ${sessionDirs.length} existing session directories`);

      for (const dirName of sessionDirs) {
        const accountId = dirName.replace('account-', '');
        const sessionPath = path.join(this.sessionsDir, dirName);

        try {
          // Check if session has credentials (indicating it was previously connected)
          const credsPath = path.join(sessionPath, 'creds.json');
          if (fs.existsSync(credsPath)) {
            logger.info(`Restoring session for account: ${accountId}`);

            // Find device info from history
            const deviceInfo = this.connectedDevicesHistory.find(device => device.accountId === accountId);

            // Create account object
            const account: WhatsAppAccount = {
              id: accountId,
              phoneNumber: deviceInfo?.phoneNumber,
              status: 'connecting',
              sessionPath,
              lastConnected: deviceInfo ? new Date(deviceInfo.lastConnected) : undefined
            };

            // Add device info if available
            if (deviceInfo) {
              (account as any).deviceInfo = {
                phoneNumber: deviceInfo.phoneNumber,
                userName: deviceInfo.userName,
                connectedAt: deviceInfo.connectedAt,
                lastSeen: deviceInfo.lastSeen,
                deviceId: deviceInfo.deviceId,
                platform: deviceInfo.platform
              };
            }

            // Store in accounts map
            this.accounts.set(accountId, account);

            // Initialize socket for this restored account
            await this.initializeSocket(account, false);

            logger.info(`Successfully restored session for account: ${accountId} (${deviceInfo?.phoneNumber || 'Unknown number'})`);
          } else {
            logger.info(`Skipping session ${accountId} - no credentials found (never connected)`);
          }
        } catch (error) {
          logger.error(`Failed to restore session for account ${accountId}:`, error);
          // Continue with other sessions even if one fails
        }
      }

      logger.info(`Session restoration complete. Active accounts: ${this.accounts.size}`);
    } catch (error) {
      logger.error('Failed to restore existing sessions:', error);
    }
  }

  // Get session statistics
  getSessionStats(): { total: number, active: number, stale: number, oldSessions: string[] } {
    const stats = {
      total: 0,
      active: this.accounts.size,
      stale: 0,
      oldSessions: [] as string[]
    };

    try {
      if (!fs.existsSync(this.sessionsDir)) {
        return stats;
      }

      const sessionDirs = fs.readdirSync(this.sessionsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('account-'));

      stats.total = sessionDirs.length;
      
      const currentTime = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const dirent of sessionDirs) {
        const accountId = dirent.name.replace('account-', '');
        
        if (!this.accounts.has(accountId)) {
          const dirPath = path.join(this.sessionsDir, dirent.name);
          
          try {
            const stats_file = fs.statSync(dirPath);
            const age = currentTime - stats_file.mtime.getTime();
            
            if (age > maxAge) {
              stats.oldSessions.push(accountId);
            } else {
              stats.stale++;
            }
          } catch (error) {
            stats.oldSessions.push(accountId);
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error getting session stats:', error);
      return stats;
    }
  }
}