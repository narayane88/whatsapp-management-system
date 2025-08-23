import { Router, Request, Response } from 'express';
import { sendMessageSchema, accountIdSchema } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { ApiResponse, SendMessageRequest, SendMessageResponse } from '../types.js';
import { getSessionManager } from '../managers/SessionManagerSingleton.js';

const router = Router();
const sessionManager = getSessionManager();

// Send a message
router.post('/:id/send-message', async (req: Request, res: Response) => {
  try {
    // Validate account ID
    const { error: paramError, value: paramValue } = accountIdSchema.validate(req.params);
    if (paramError) {
      return res.status(400).json({
        success: false,
        error: paramError.details[0].message
      } as ApiResponse);
    }

    // Validate message body
    const { error: bodyError, value: bodyValue } = sendMessageSchema.validate(req.body);
    if (bodyError) {
      return res.status(400).json({
        success: false,
        error: bodyError.details[0].message
      } as ApiResponse);
    }

    const { id } = paramValue;
    const messageRequest = bodyValue as SendMessageRequest;

    const account = sessionManager.getAccount(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      } as ApiResponse);
    }

    if (account.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: `Account is ${account.status}, cannot send message`
      } as ApiResponse);
    }

    const result = await sessionManager.sendMessage(id, messageRequest);
    
    if (result.success) {
      logger.info(`Message sent successfully from ${id} to ${messageRequest.to}`, {
        messageId: result.messageId
      });
      
      res.json({
        success: true,
        data: result,
        message: 'Message sent successfully'
      } as ApiResponse<SendMessageResponse>);
    } else {
      logger.error(`Failed to send message from ${id}:`, result.error);
      
      res.status(400).json({
        success: false,
        error: result.error
      } as ApiResponse);
    }
    
  } catch (error) {
    logger.error('Failed to send message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    } as ApiResponse);
  }
});

// Get chat list (if implemented in SessionManager)
router.get('/:id/chats', async (req: Request, res: Response) => {
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

    if (account.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: `Account is ${account.status}, cannot retrieve chats`
      } as ApiResponse);
    }

    // This would require implementing chat retrieval in SessionManager
    res.status(501).json({
      success: false,
      error: 'Chat retrieval not implemented yet'
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Failed to get chats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    } as ApiResponse);
  }
});

export default router;