import * as Baileys from 'baileys';
type WASocket = Baileys.WASocket;
type ConnectionState = Baileys.ConnectionState;

export interface WhatsAppAccount {
  id: string;
  phoneNumber?: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  qrCode?: string;
  pairingCode?: string;
  socket?: WASocket;
  lastConnected?: Date;
  webhookUrl?: string;
  sessionPath: string;
}

export interface SessionInfo {
  id: string;
  status: ConnectionState;
  phoneNumber?: string;
  lastSeen?: Date;
  qrCode?: string;
  pairingCode?: string;
}

export interface SendMessageRequest {
  to: string;
  message: {
    text?: string;
    image?: {
      url?: string;
      caption?: string;
    };
    document?: {
      url?: string;
      filename?: string;
      caption?: string;
    };
    audio?: {
      url?: string;
    };
    video?: {
      url?: string;
      caption?: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      address?: string;
    };
  };
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WebhookPayload {
  event: 'connection.update' | 'message.received' | 'message.status' | 'account.disconnected';
  accountId: string;
  timestamp: number;
  data: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConnectAccountRequest {
  id?: string;
  phoneNumber?: string;
  webhookUrl?: string;
  usePairingCode?: boolean;
}

export interface AccountStatusResponse {
  id: string;
  status: string;
  phoneNumber?: string;
  lastConnected?: string;
  qrCode?: string;
  pairingCode?: string;
}

export interface MessageReceivedWebhook {
  messageId: string;
  from: string;
  timestamp: number;
  message: {
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
    text?: string;
    caption?: string;
    mediaUrl?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    contact?: {
      name: string;
      phone: string;
    };
  };
}

export interface ConnectionUpdateWebhook {
  connection: string;
  lastDisconnect?: {
    error?: {
      output?: {
        statusCode?: number;
      };
    };
    date?: Date;
  };
  qr?: string;
  pairingCode?: string;
}