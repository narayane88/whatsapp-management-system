import axios from 'axios';
import logger from '../utils/logger.js';
import { WebhookPayload } from '../types.js';

export class WebhookManager {
  private retryAttempts = 3;
  private retryDelay = 1000; // ms

  async sendWebhook(url: string, payload: WebhookPayload, attempt = 1): Promise<void> {
    try {
      await axios.post(url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Baileys-Server/1.0.0'
        }
      });
      
      logger.info(`Webhook sent successfully to ${url}`, { 
        event: payload.event,
        accountId: payload.accountId,
        attempt
      });
    } catch (error) {
      logger.error(`Webhook failed to ${url}`, { 
        error: error.message,
        attempt,
        event: payload.event,
        accountId: payload.accountId
      });

      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.info(`Retrying webhook in ${delay}ms`, { attempt: attempt + 1 });
        
        setTimeout(() => {
          this.sendWebhook(url, payload, attempt + 1);
        }, delay);
      } else {
        logger.error(`Webhook failed after ${this.retryAttempts} attempts`, {
          url,
          event: payload.event,
          accountId: payload.accountId
        });
      }
    }
  }

  createConnectionUpdatePayload(accountId: string, connection: string, qr?: string, pairingCode?: string): WebhookPayload {
    return {
      event: 'connection.update',
      accountId,
      timestamp: Date.now(),
      data: {
        connection,
        qr,
        pairingCode
      }
    };
  }

  createMessageReceivedPayload(accountId: string, messageData: any): WebhookPayload {
    return {
      event: 'message.received',
      accountId,
      timestamp: Date.now(),
      data: messageData
    };
  }

  createMessageStatusPayload(accountId: string, statusData: any): WebhookPayload {
    return {
      event: 'message.status',
      accountId,
      timestamp: Date.now(),
      data: statusData
    };
  }

  createAccountDisconnectedPayload(accountId: string, reason?: string): WebhookPayload {
    return {
      event: 'account.disconnected',
      accountId,
      timestamp: Date.now(),
      data: {
        reason
      }
    };
  }
}