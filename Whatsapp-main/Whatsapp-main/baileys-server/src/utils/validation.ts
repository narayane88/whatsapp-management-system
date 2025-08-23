import Joi from 'joi';

export const connectAccountSchema = Joi.object({
  id: Joi.string().optional(),
  phoneNumber: Joi.string().optional(),
  webhookUrl: Joi.string().uri().optional(),
  usePairingCode: Joi.boolean().default(false)
});

export const sendMessageSchema = Joi.object({
  to: Joi.string().required(),
  message: Joi.object({
    text: Joi.string().optional(),
    image: Joi.object({
      url: Joi.string().uri().optional(),
      caption: Joi.string().optional()
    }).optional(),
    document: Joi.object({
      url: Joi.string().uri().optional(),
      filename: Joi.string().optional(),
      caption: Joi.string().optional()
    }).optional(),
    audio: Joi.object({
      url: Joi.string().uri().required()
    }).optional(),
    video: Joi.object({
      url: Joi.string().uri().optional(),
      caption: Joi.string().optional()
    }).optional(),
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      name: Joi.string().optional(),
      address: Joi.string().optional()
    }).optional()
  }).required()
}).custom((value, helpers) => {
  const message = value.message;
  const messageTypes = ['text', 'image', 'document', 'audio', 'video', 'location'];
  const providedTypes = messageTypes.filter(type => message[type] !== undefined);
  
  if (providedTypes.length !== 1) {
    return helpers.error('message.oneType');
  }
  
  return value;
}).messages({
  'message.oneType': 'Message must contain exactly one type (text, image, document, audio, video, or location)'
});

export const accountIdSchema = Joi.object({
  id: Joi.string().required()
});