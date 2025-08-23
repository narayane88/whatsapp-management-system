import swaggerJsdoc from 'swagger-jsdoc'
import { createSwaggerSpec } from 'next-swagger-doc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp Business Customer API',
      version: '1.0.0',
      description: `
        # WhatsApp Business Customer API
        
        This API provides programmatic access to WhatsApp Business functionality for customers.
        
        ## Authentication
        
        All API requests require authentication using an API key in the Authorization header:
        
        \`\`\`
        Authorization: Bearer YOUR_API_KEY
        \`\`\`
        
        ## Rate Limits
        
        - 100 requests per minute per API key
        - 10,000 messages per day (varies by plan)
        - Burst limit: 10 requests per second
        
        ## Base URL
        
        \`https://api.example.com/v1\`
        
        ## Error Responses
        
        All error responses follow this format:
        
        \`\`\`json
        {
          "success": false,
          "error": "Error description",
          "details": "Additional error details"
        }
        \`\`\`
        
        ## Support
        
        For API support, contact us at support@example.com
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your API key'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error description'
            },
            details: {
              type: 'string',
              example: 'Additional error details'
            }
          }
        },
        Contact: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'contact_123'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            phoneNumber: {
              type: 'string',
              example: '+1234567890'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            isSubscribed: {
              type: 'boolean',
              example: true
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['customer', 'vip']
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'msg_123'
            },
            to: {
              type: 'string',
              example: '+1234567890'
            },
            message: {
              type: 'string',
              example: 'Hello from our API!'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
              example: 'SENT'
            },
            instanceId: {
              type: 'string',
              example: 'instance_123'
            },
            sentAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        WhatsAppInstance: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'instance_123'
            },
            name: {
              type: 'string',
              example: 'Business Account'
            },
            phoneNumber: {
              type: 'string',
              example: '+1234567890'
            },
            status: {
              type: 'string',
              enum: ['CONNECTED', 'DISCONNECTED', 'CONNECTING', 'ERROR'],
              example: 'CONNECTED'
            },
            lastSeenAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'key_123'
            },
            name: {
              type: 'string',
              example: 'Production API'
            },
            key: {
              type: 'string',
              example: 'sk_live_abc123...def456'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['messages.send', 'contacts.read']
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Customer Dashboard',
        description: 'Dashboard statistics and overview'
      },
      {
        name: 'Customer Profile',
        description: 'Customer profile management'
      },
      {
        name: 'Customer API Keys',
        description: 'API key management'
      },
      {
        name: 'WhatsApp Messages',
        description: 'Send and manage WhatsApp messages'
      },
      {
        name: 'WhatsApp Instances',
        description: 'Manage WhatsApp instances'
      },
      {
        name: 'Contacts',
        description: 'Contact management'
      },
      {
        name: 'Contact Groups',
        description: 'Contact group management'
      },
      {
        name: 'Webhooks',
        description: 'Webhook configuration'
      }
    ]
  },
  apis: [
    './src/app/api/customer/**/*.ts',
    './src/app/api/v1/**/*.ts'
  ]
}

export const swaggerSpec = swaggerJsdoc(options)

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: options.definition,
  })
}