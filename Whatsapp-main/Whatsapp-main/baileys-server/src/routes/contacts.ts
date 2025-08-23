import { Router, Request, Response } from 'express';
import { accountIdSchema } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { ApiResponse } from '../types.js';
import { getSessionManager } from '../managers/SessionManagerSingleton.js';
import Joi from 'joi';

const contactParamsSchema = Joi.object({
  id: Joi.string().required(),
  phoneNumber: Joi.string().required()
});

const router = Router();
const sessionManager = getSessionManager();

// Get contact info by phone number
router.get('/:id/contacts/:phoneNumber', async (req: Request, res: Response) => {
  try {
    const { error: paramError, value: paramValue } = contactParamsSchema.validate(req.params);
    
    if (paramError) {
      return res.status(400).json({
        success: false,
        error: paramError.details[0].message
      } as ApiResponse);
    }

    const { id } = paramValue;
    const { phoneNumber } = req.params;
    
    const account = sessionManager.getAccount(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      } as ApiResponse);
    }

    if (!account.socket || account.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Account not connected'
      } as ApiResponse);
    }

    // Format phone number for WhatsApp JID
    let formattedNumber = phoneNumber.replace(/[^\d]/g, '');
    
    // Add country code if not present (assuming Indian numbers for 10-digit numbers)
    if (formattedNumber.length === 10 && formattedNumber.match(/^[6-9]/)) {
      formattedNumber = '91' + formattedNumber;
    }
    
    const jid = `${formattedNumber}@s.whatsapp.net`;
    
    try {
      // Try to get contact info from WhatsApp
      const contactInfo = await account.socket.onWhatsApp(jid);
      
      if (contactInfo && contactInfo.length > 0) {
        const contact = contactInfo[0];
        
        // Try to get the contact's name/profile
        let contactName = null;
        try {
          // Get user profile/status which might include name
          const profilePicUrl = await account.socket.profilePictureUrl(jid).catch(() => null);
          
          // The contact exists on WhatsApp, but we can't directly get their name
          // due to WhatsApp's privacy settings. We can only confirm they exist.
          contactName = contact.exists ? 'WhatsApp User' : null;
          
        } catch (profileError) {
          logger.debug(`Could not get profile for ${jid}:`, profileError);
        }

        return res.json({
          success: true,
          data: {
            phoneNumber: formattedNumber,
            jid,
            exists: contact.exists,
            name: contactName,
            profilePicUrl: null // Privacy protected
          }
        } as ApiResponse);
        
      } else {
        return res.json({
          success: true,
          data: {
            phoneNumber: formattedNumber,
            jid,
            exists: false,
            name: null,
            profilePicUrl: null
          }
        } as ApiResponse);
      }
      
    } catch (whatsappError) {
      logger.error(`Error checking contact ${jid}:`, whatsappError);
      return res.status(500).json({
        success: false,
        error: 'Failed to check contact on WhatsApp'
      } as ApiResponse);
    }
    
  } catch (error: any) {
    logger.error('Failed to get contact info:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    } as ApiResponse);
  }
});

// Get all contacts from device (if available)
router.get('/:id/contacts', async (req: Request, res: Response) => {
  try {
    const { error: paramError, value: paramValue } = accountIdSchema.validate(req.params);
    
    if (paramError) {
      return res.status(400).json({
        success: false,
        error: paramError.details[0].message
      } as ApiResponse);
    }

    const { id } = paramValue;
    
    const account = sessionManager.getAccount(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      } as ApiResponse);
    }

    if (!account.socket || account.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Account not connected'
      } as ApiResponse);
    }

    try {
      // Try to get the user's contacts
      // Note: This might not work due to WhatsApp's privacy restrictions
      const store = account.socket.store;
      const contacts = store?.contacts || {};
      
      const contactList = Object.entries(contacts).map(([jid, contact]: [string, any]) => ({
        jid,
        name: contact.name || contact.notify || 'Unknown',
        phoneNumber: jid.replace('@s.whatsapp.net', '').replace('@c.us', ''),
      }));

      return res.json({
        success: true,
        data: {
          contacts: contactList,
          total: contactList.length
        },
        message: `Found ${contactList.length} contacts`
      } as ApiResponse);
      
    } catch (contactsError) {
      logger.error('Error getting contacts:', contactsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to get contacts list'
      } as ApiResponse);
    }
    
  } catch (error: any) {
    logger.error('Failed to get contacts:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    } as ApiResponse);
  }
});

export default router;