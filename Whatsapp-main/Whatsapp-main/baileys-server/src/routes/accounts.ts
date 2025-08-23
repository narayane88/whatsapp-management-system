import { Router, Request, Response } from 'express';
import { connectAccountSchema, accountIdSchema } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { ApiResponse, ConnectAccountRequest, AccountStatusResponse } from '../types.js';
import { getSessionManager } from '../managers/SessionManagerSingleton.js';

const router = Router();
const sessionManager = getSessionManager();

// Connect a new WhatsApp account
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { error, value } = connectAccountSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      } as ApiResponse);
    }

    const { id, phoneNumber, webhookUrl, usePairingCode } = value as ConnectAccountRequest;
    
    const account = await sessionManager.createAccount(id, phoneNumber, webhookUrl, usePairingCode);
    
    logger.info(`Account connection initiated: ${account.id}`);
    
    res.status(201).json({
      success: true,
      data: {
        id: account.id,
        status: account.status,
        phoneNumber: account.phoneNumber,
        qrCode: account.qrCode,
        pairingCode: account.pairingCode
      },
      message: 'Account connection initiated'
    } as ApiResponse<AccountStatusResponse>);
    
  } catch (error: any) {
    logger.error('Failed to connect account:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    } as ApiResponse);
  }
});

// Disconnect an account
router.delete('/:id/disconnect', async (req: Request, res: Response) => {
  try {
    const { error, value } = accountIdSchema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      } as ApiResponse);
    }

    const { id } = value;
    const { forceLogout = false, cleanupSession = true } = req.body || {};
    
    logger.info(`Disconnecting account ${id} with forceLogout: ${forceLogout}, cleanupSession: ${cleanupSession}`);
    
    await sessionManager.disconnectAccount(id, cleanupSession, forceLogout);
    const success = true;
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      } as ApiResponse);
    }

    logger.info(`Account disconnected: ${id} (logged out: ${forceLogout}, session cleaned: ${cleanupSession})`);
    
    res.json({
      success: true,
      message: 'Account disconnected successfully',
      data: {
        deviceLoggedOut: forceLogout,
        sessionCleaned: cleanupSession
      }
    } as ApiResponse);
    
  } catch (error: any) {
    logger.error('Failed to disconnect account:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    } as ApiResponse);
  }
});

// Get account status
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { error, value } = accountIdSchema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      } as ApiResponse);
    }

    const { id } = value;
    const account = sessionManager.getAccount(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        id: account.id,
        status: account.status,
        phoneNumber: account.phoneNumber,
        lastConnected: account.lastConnected?.toISOString(),
        qrCode: account.qrCode,
        pairingCode: account.pairingCode
      }
    } as ApiResponse<AccountStatusResponse>);
    
  } catch (error: any) {
    logger.error('Failed to get account status:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    } as ApiResponse);
  }
});

// Get QR code for account
router.get('/:id/qr', async (req: Request, res: Response) => {
  try {
    const { error, value } = accountIdSchema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      } as ApiResponse);
    }

    const { id } = value;
    const account = sessionManager.getAccount(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      } as ApiResponse);
    }

    if (!account.qrCode) {
      return res.status(404).json({
        success: false,
        error: 'QR code not available'
      } as ApiResponse);
    }

    // Reset QR timeout since QR code is being requested
    sessionManager.resetQRTimeoutOnRequest(id);

    res.json({
      success: true,
      data: {
        qrCode: account.qrCode
      }
    } as ApiResponse);
    
  } catch (error: any) {
    logger.error('Failed to get QR code:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    } as ApiResponse);
  }
});

// Update account webhook URL
router.put('/:id/webhook', async (req: Request, res: Response) => {
  try {
    const { error: paramError, value: paramValue } = accountIdSchema.validate(req.params);
    
    if (paramError) {
      return res.status(400).json({
        success: false,
        error: paramError.details[0].message
      } as ApiResponse);
    }

    const { id } = paramValue;
    const { webhookUrl } = req.body;
    
    const account = sessionManager.getAccount(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      } as ApiResponse);
    }

    // Update webhook URL
    account.webhookUrl = webhookUrl;
    
    logger.info(`Webhook URL updated for account ${id}: ${webhookUrl}`);
    
    res.json({
      success: true,
      data: {
        id: account.id,
        webhookUrl: account.webhookUrl
      },
      message: 'Webhook URL updated successfully'
    } as ApiResponse);
    
  } catch (error: any) {
    logger.error('Failed to update webhook URL:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    } as ApiResponse);
  }
});

// List all accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = sessionManager.getAllAccounts();
    
    res.json({
      success: true,
      data: {
        accounts,
        total: accounts.length
      },
      message: `Found ${accounts.length} accounts`
    } as ApiResponse);
    
  } catch (error: any) {
    logger.error('Failed to list accounts:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    } as ApiResponse);
  }
});

export default router;