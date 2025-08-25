'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Container, Stack, Card, Group, Text, Button, Alert, Tabs, Badge, Code, 
  TextInput, Textarea, Select, Switch, JsonInput, Paper, Divider, Box,
  Loader, ScrollArea, CopyButton, ActionIcon, Modal, NumberInput,
  Accordion, ThemeIcon, Title, Grid, Spotlight, UnstyledButton
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { 
  IconApi, IconRefresh, IconPlaylistAdd, IconExternalLink, IconInfoCircle,
  IconCode, IconTestPipe, IconRocket, IconDatabase, IconServer, IconDevices,
  IconBolt, IconCheck, IconX, IconCopy, IconEye, IconChevronRight,
  IconMessageCircle, IconHistory, IconList, IconCreditCard, IconSearch,
  IconPlayerPlay, IconSettings, IconDownload, IconBookmark
} from '@tabler/icons-react'

interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  title: string
  description: string
  category: string
  icon: React.ReactNode
  tags: string[]
  parameters?: Parameter[]
  requestBody?: RequestBodySchema
  responses: Response[]
  examples: Example[]
  useCases: string[]
  rateLimit?: string
  authentication: boolean
}

interface Parameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description: string
  example?: any
  enum?: string[]
  format?: string
  minimum?: number
  maximum?: number
}

interface RequestBodySchema {
  type: 'object' | 'array'
  properties: Record<string, any>
  required: string[]
  example: any
}

interface Response {
  status: number
  description: string
  schema: any
  example: any
}

interface Example {
  title: string
  description: string
  request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: any
  }
  response: {
    status: number
    body: any
  }
}

const API_BASE_URL = 'http://localhost:3100/api/v1'

const apiEndpoints: ApiEndpoint[] = [
  // Messages API
  {
    id: 'send-message',
    method: 'POST',
    path: '/messages/send',
    title: 'Send WhatsApp Message',
    description: 'Send a single WhatsApp message with queue-based processing for reliable delivery',
    category: 'Messages',
    icon: <IconMessageCircle size={20} />,
    tags: ['messaging', 'whatsapp', 'queue', 'realtime'],
    authentication: true,
    rateLimit: '1000 requests/hour',
    parameters: [],
    requestBody: {
      type: 'object',
      properties: {
        deviceName: { type: 'string', description: 'WhatsApp device/instance name' },
        to: { type: 'string', description: 'Recipient phone number in international format' },
        message: { type: 'string', description: 'Message content to send' },
        attachmentUrl: { type: 'string', description: 'URL of the attachment to send (image, video, document, audio)' },
        priority: { type: 'number', description: 'Message priority (0-10, higher = more urgent)' },
        scheduledAt: { type: 'string', format: 'date-time', description: 'Schedule message for future delivery' }
      },
      required: ['deviceName', 'to', 'message'],
      example: {
        deviceName: '2_bizflashindevice202508210325_1755746719393',
        to: '+919960589622',
        message: 'Hello! This is a test message from the API.',
        attachmentUrl: 'https://example.com/document.pdf',
        priority: 1,
        scheduledAt: '2025-08-22T10:00:00.000Z'
      }
    },
    responses: [
      {
        status: 200,
        description: 'Message queued successfully',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            messageId: 'msg_1755788203814_5',
            queueId: 'a84767cf-65ae-4d89-b07b-f77fc7f920d3',
            to: '+919960589622',
            message: 'Hello! This is a test message from the API.',
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            status: 'QUEUED',
            queuePosition: 1,
            priority: 1,
            scheduledAt: '2025-08-21T14:56:31.821Z',
            estimatedDelivery: '2025-08-21T14:56:34.826Z',
            remainingCredits: 999
          },
          message: 'Message queued successfully'
        }
      }
    ],
    examples: [
      {
        title: 'Send Message (JSON)',
        description: 'Send a message using JSON request body with authentication headers',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/send`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            to: '+919960589622',
            message: 'Hello! This is a test message from the API.',
            priority: 1
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              messageId: 'msg_1755788203814_5',
              queueId: 'a84767cf-65ae-4d89-b07b-f77fc7f920d3',
              to: '+919960589622',
              message: 'Hello! This is a test message from the API.',
              deviceName: '2_bizflashindevice202508210325_1755746719393',
              status: 'QUEUED',
              queuePosition: 1,
              priority: 1,
              scheduledAt: '2025-08-21T14:56:31.821Z',
              estimatedDelivery: '2025-08-21T14:56:34.826Z',
              remainingCredits: 999
            },
            message: 'Message queued successfully'
          }
        }
      },
      {
        title: 'Send Message (URL-encoded)',
        description: 'Send a message using form-urlencoded data for simple form submissions',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/send`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'deviceName=2_bizflashindevice202508210325_1755746719393&to=%2B919960589622&message=Hello%20from%20form%20submission!&priority=1'
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              messageId: 'msg_1755788203815_6',
              queueId: 'b84767cf-65ae-4d89-b07b-f77fc7f920d4',
              status: 'QUEUED',
              estimatedDelivery: '2025-08-21T14:56:34.826Z'
            }
          }
        }
      },
      {
        title: 'Send Scheduled Message',
        description: 'Schedule a message for future delivery with high priority',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/send`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            to: '+919960589622',
            message: 'This is a scheduled reminder message!',
            priority: 3,
            scheduledAt: '2025-08-22T10:00:00.000Z'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              messageId: 'msg_1755788203816_7',
              status: 'SCHEDULED',
              scheduledAt: '2025-08-22T10:00:00.000Z'
            }
          }
        }
      },
      {
        title: 'Send Message with Image Attachment',
        description: 'Send a WhatsApp message with an image attachment via URL',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/send`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            to: '+919960589622',
            message: 'Check out this product image!',
            attachmentUrl: 'https://example.com/product-image.jpg',
            priority: 1
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              messageId: 'msg_1755788203817_8',
              queueId: 'c84767cf-65ae-4d89-b07b-f77fc7f920d5',
              status: 'QUEUED',
              attachmentType: 'image',
              attachmentUrl: 'https://example.com/product-image.jpg'
            }
          }
        }
      },
      {
        title: 'Send Message with PDF Document',
        description: 'Send a WhatsApp message with a PDF document attachment',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/send`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            to: '+919960589622',
            message: 'Please find the invoice attached.',
            attachmentUrl: 'https://example.com/invoice-2025.pdf',
            priority: 2
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              messageId: 'msg_1755788203818_9',
              status: 'QUEUED',
              attachmentType: 'document',
              attachmentUrl: 'https://example.com/invoice-2025.pdf'
            }
          }
        }
      },
      {
        title: 'Send Message with Video Attachment',
        description: 'Send a WhatsApp message with a video attachment',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/send`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            to: '+919960589622',
            message: 'Watch our latest product demo video!',
            attachmentUrl: 'https://example.com/demo-video.mp4',
            priority: 1
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              messageId: 'msg_1755788203819_10',
              status: 'QUEUED',
              attachmentType: 'video',
              attachmentUrl: 'https://example.com/demo-video.mp4'
            }
          }
        }
      }
    ],
    useCases: [
      'Send notifications and alerts',
      'Customer support messaging',
      'Marketing communications',
      'Order confirmations and updates',
      'Appointment reminders'
    ]
  },
  
  // Bulk Messages API
  {
    id: 'bulk-messages',
    method: 'POST',
    path: '/messages/bulk',
    title: 'Send Bulk Messages',
    description: 'Send multiple WhatsApp messages in a single batch operation with advanced scheduling and delivery management',
    category: 'Messages',
    icon: <IconBolt size={20} />,
    tags: ['bulk', 'batch', 'marketing', 'campaigns'],
    authentication: true,
    rateLimit: '100 batches/hour',
    requestBody: {
      type: 'object',
      properties: {
        deviceName: { type: 'string', description: 'WhatsApp device for sending' },
        batchId: { type: 'string', description: 'Unique batch identifier' },
        delay: { type: 'number', description: 'Delay between messages in milliseconds' },
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              to: { type: 'string' },
              message: { type: 'string' },
              attachmentUrl: { type: 'string', description: 'URL of the attachment to send' },
              priority: { type: 'number' },
              scheduledAt: { type: 'string' }
            }
          }
        }
      },
      required: ['deviceName', 'messages'],
      example: {
        deviceName: '2_bizflashindevice202508210325_1755746719393',
        batchId: 'campaign_2025_001',
        delay: 2000,
        messages: [
          {
            to: '+919960589622',
            message: 'Welcome to our service!',
            attachmentUrl: 'https://example.com/welcome-banner.jpg',
            priority: 1
          },
          {
            to: '+918983063144',
            message: 'Special offer just for you!',
            attachmentUrl: 'https://example.com/offer-details.pdf',
            priority: 2
          }
        ]
      }
    },
    responses: [
      {
        status: 200,
        description: 'Bulk batch processed successfully',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            batchId: 'campaign_2025_001',
            totalMessages: 2,
            queuedMessages: 2,
            failedMessages: 0,
            estimatedCompletionTime: '2025-08-21T14:56:59.720Z'
          }
        }
      }
    ],
    examples: [
      {
        title: 'Bulk Messages (JSON)',
        description: 'Send multiple messages in a single batch using JSON format',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/bulk`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            batchId: 'campaign_2025_001',
            delay: 2000,
            messages: [
              {
                to: '+919960589622',
                message: 'Welcome to our service! Thank you for joining us.',
                priority: 1
              },
              {
                to: '+918983063144',
                message: 'Special offer: 50% off your first purchase!',
                priority: 2,
                scheduledAt: '2025-08-22T10:00:00.000Z'
              }
            ]
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              batchId: 'campaign_2025_001',
              totalMessages: 2,
              queuedMessages: 2,
              failedMessages: 0,
              estimatedCompletionTime: '2025-08-21T14:56:59.720Z'
            }
          }
        }
      },
      {
        title: 'Bulk Messages (URL-encoded)',
        description: 'Send bulk messages using form-urlencoded format with batch tracking',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/bulk`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'deviceName=2_bizflashindevice202508210325_1755746719393&batchId=marketing_campaign_001&delay=3000&messages[0][to]=%2B919960589622&messages[0][message]=Welcome%20to%20our%20service!&messages[0][priority]=1&messages[1][to]=%2B918983063144&messages[1][message]=Special%20discount%20offer!&messages[1][priority]=2'
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              batchId: 'marketing_campaign_001',
              totalMessages: 2,
              queuedMessages: 2,
              failedMessages: 0,
              estimatedCompletionTime: '2025-08-21T14:57:05.720Z'
            }
          }
        }
      },
      {
        title: 'Bulk Messages with Attachments',
        description: 'Send bulk messages with different attachments for each recipient',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/bulk`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            batchId: 'product_launch_2025',
            delay: 3000,
            messages: [
              {
                to: '+919960589622',
                message: 'Introducing our new product line! Check out the catalog.',
                attachmentUrl: 'https://example.com/catalog-2025.pdf',
                priority: 1
              },
              {
                to: '+918983063144',
                message: 'Watch our product demo video!',
                attachmentUrl: 'https://example.com/product-demo.mp4',
                priority: 1
              },
              {
                to: '+917890123456',
                message: 'See our latest collection in this brochure.',
                attachmentUrl: 'https://example.com/brochure.jpg',
                priority: 2
              }
            ]
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              batchId: 'product_launch_2025',
              totalMessages: 3,
              queuedMessages: 3,
              failedMessages: 0,
              estimatedCompletionTime: '2025-08-21T14:57:15.720Z'
            }
          }
        }
      },
      {
        title: 'Marketing Campaign with Mixed Media',
        description: 'Send a marketing campaign with text-only and media messages',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/messages/bulk`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: '2_bizflashindevice202508210325_1755746719393',
            batchId: 'mixed_media_campaign',
            delay: 2500,
            messages: [
              {
                to: '+919960589622',
                message: 'Flash Sale Alert! 50% off on all products today only!',
                priority: 3
              },
              {
                to: '+918983063144',
                message: 'Exclusive offer for you! See details in the attached flyer.',
                attachmentUrl: 'https://example.com/exclusive-offer.jpg',
                priority: 2
              },
              {
                to: '+917890123456',
                message: 'Your personalized discount code: SAVE20. Terms apply.',
                attachmentUrl: 'https://example.com/terms-conditions.pdf',
                priority: 1
              }
            ]
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              batchId: 'mixed_media_campaign',
              totalMessages: 3,
              queuedMessages: 3,
              failedMessages: 0,
              withAttachments: 2,
              withoutAttachments: 1,
              estimatedCompletionTime: '2025-08-21T14:57:12.500Z'
            }
          }
        }
      }
    ],
    useCases: [
      'Marketing campaigns',
      'Newsletter distribution',
      'Event announcements',
      'Product launches',
      'Customer surveys'
    ]
  },

  // Message History API
  {
    id: 'message-history',
    method: 'GET',
    path: '/messages/history',
    title: 'Get Message History',
    description: 'Retrieve sent message history with advanced filtering, pagination, and analytics',
    category: 'Messages',
    icon: <IconHistory size={20} />,
    tags: ['history', 'analytics', 'reporting'],
    authentication: true,
    parameters: [
      { name: 'limit', type: 'number', required: false, description: 'Number of messages to return (1-1000)', example: 50 },
      { name: 'offset', type: 'number', required: false, description: 'Number of messages to skip', example: 0 },
      { name: 'status', type: 'string', required: false, description: 'Filter by status', enum: ['sent', 'delivered', 'read', 'failed', 'pending'] },
      { name: 'deviceName', type: 'string', required: false, description: 'Filter by device', example: '2_bizflashindevice202508210325_1755746719393' },
      { name: 'recipient', type: 'string', required: false, description: 'Filter by recipient phone', example: '+919960589622' },
      { name: 'startDate', type: 'string', required: false, description: 'Start date (YYYY-MM-DD)', format: 'date' },
      { name: 'endDate', type: 'string', required: false, description: 'End date (YYYY-MM-DD)', format: 'date' }
    ],
    responses: [
      {
        status: 200,
        description: 'Message history retrieved successfully',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            messages: [],
            pagination: {
              total: 150,
              limit: 50,
              offset: 0,
              hasMore: true
            },
            summary: {
              totalSent: 120,
              totalDelivered: 115,
              totalRead: 98,
              totalFailed: 5
            }
          }
        }
      }
    ],
    examples: [
      {
        title: 'Get Message History (JSON)',
        description: 'Retrieve message history with filtering and pagination',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/messages/history?limit=10&status=sent&deviceName=2_bizflashindevice202508210325_1755746719393`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              messages: [
                {
                  id: 'msg_1755788203814_5',
                  to: '+919960589622',
                  message: 'Hello! This is a test message.',
                  status: 'delivered',
                  sentAt: '2025-08-21T14:56:31.821Z',
                  deliveredAt: '2025-08-21T14:56:35.124Z',
                  deviceName: '2_bizflashindevice202508210325_1755746719393'
                }
              ],
              pagination: {
                total: 150,
                limit: 10,
                offset: 0,
                hasMore: true
              }
            }
          }
        }
      },
      {
        title: 'Get Message History (URL-encoded)',
        description: 'Simple URL-encoded query for message history',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/messages/history?limit=5&status=delivered&recipient=%2B919960589622`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              messages: [],
              summary: {
                totalSent: 120,
                totalDelivered: 115,
                totalRead: 98,
                totalFailed: 5
              }
            }
          }
        }
      }
    ],
    useCases: [
      'Message analytics and reporting',
      'Customer support history',
      'Compliance and audit trails',
      'Performance monitoring',
      'Delivery rate analysis'
    ]
  },

  // Queue Management API
  {
    id: 'message-queue',
    method: 'GET',
    path: '/messages/queue',
    title: 'Get Queue Status',
    description: 'Monitor message queue status with real-time statistics and filtering capabilities',
    category: 'Messages',
    icon: <IconList size={20} />,
    tags: ['queue', 'monitoring', 'realtime'],
    authentication: true,
    parameters: [
      { name: 'status', type: 'string', required: false, description: 'Filter by queue status', enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'] },
      { name: 'deviceName', type: 'string', required: false, description: 'Filter by device' },
      { name: 'batchId', type: 'string', required: false, description: 'Filter by batch ID' },
      { name: 'limit', type: 'number', required: false, description: 'Maximum results to return', maximum: 500 }
    ],
    responses: [
      {
        status: 200,
        description: 'Queue status retrieved successfully',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            queue: [],
            statistics: {
              pending: 15,
              processing: 3,
              sent: 120,
              failed: 2,
              totalInQueue: 18
            }
          }
        }
      }
    ],
    examples: [
      {
        title: 'Get Queue Status (All)',
        description: 'Get complete queue status with statistics',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/messages/queue`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              queue: [
                {
                  id: 'queue_1755788203814_1',
                  messageId: 'msg_1755788203814_5',
                  to: '+919960589622',
                  message: 'Hello! This is a test message.',
                  status: 'PENDING',
                  priority: 1,
                  scheduledAt: '2025-08-21T14:56:31.821Z',
                  deviceName: '2_bizflashindevice202508210325_1755746719393'
                }
              ],
              statistics: {
                pending: 15,
                processing: 3,
                sent: 120,
                failed: 2,
                totalInQueue: 18
              }
            }
          }
        }
      },
      {
        title: 'Get Queue Status (Filtered)',
        description: 'Get queue status filtered by device and status',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/messages/queue?status=PENDING&deviceName=2_bizflashindevice202508210325_1755746719393&limit=10`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              queue: [],
              statistics: {
                pending: 5,
                processing: 0,
                sent: 45,
                failed: 0,
                totalInQueue: 5
              }
            }
          }
        }
      }
    ],
    useCases: [
      'Queue monitoring and management',
      'Performance optimization',
      'Batch campaign tracking',
      'System health monitoring',
      'Resource planning'
    ]
  },

  // Subscription API
  {
    id: 'subscription',
    method: 'GET',
    path: '/subscription',
    title: 'Get Subscription Details',
    description: 'Retrieve comprehensive subscription information, usage analytics, and billing status',
    category: 'Account',
    icon: <IconCreditCard size={20} />,
    tags: ['subscription', 'billing', 'usage', 'analytics'],
    authentication: true,
    responses: [
      {
        status: 200,
        description: 'Subscription details retrieved successfully',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            currentPackage: {
              name: 'Basic Plan',
              messageLimit: 1000,
              price: 299.00
            },
            usage: {
              messagesUsed: 150,
              messagesRemaining: 850,
              usagePercentage: 15.0
            }
          }
        }
      }
    ],
    examples: [
      {
        title: 'Get Subscription Details',
        description: 'Retrieve current subscription and usage information',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/subscription`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              currentPackage: {
                id: 'pkg_basic_001',
                name: 'Basic Plan',
                messageLimit: 1000,
                price: 299.00,
                currency: 'INR',
                billingCycle: 'monthly',
                features: ['WhatsApp messaging', 'Basic analytics', 'Email support']
              },
              usage: {
                messagesUsed: 150,
                messagesRemaining: 850,
                usagePercentage: 15.0,
                resetDate: '2025-09-21T00:00:00.000Z'
              },
              billing: {
                nextBillingDate: '2025-09-21T00:00:00.000Z',
                paymentStatus: 'active',
                lastPayment: {
                  amount: 299.00,
                  date: '2025-08-21T00:00:00.000Z',
                  method: 'razorpay'
                }
              }
            }
          }
        }
      }
    ],
    useCases: [
      'Usage monitoring and analytics',
      'Billing and payment tracking',
      'Plan optimization',
      'Usage forecasting',
      'Account management'
    ]
  },

  // Devices API
  {
    id: 'devices',
    method: 'GET',
    path: '/devices',
    title: 'Get WhatsApp Devices',
    description: 'Retrieve your WhatsApp devices with real-time connection status from WhatsApp servers, message counts, and server information. Status is automatically synchronized with the database.',
    category: 'Devices',
    icon: <IconDevices size={20} />,
    tags: ['devices', 'whatsapp', 'instances', 'status', 'realtime'],
    authentication: true,
    parameters: [
      { name: 'format', type: 'string', required: false, description: 'Response format - table format includes status display with emojis', enum: ['table', 'json'], example: 'table' },
      { name: 'status', type: 'string', required: false, description: 'Filter by real-time device status', enum: ['CONNECTED', 'CONNECTING', 'DISCONNECTED', 'AUTHENTICATING', 'ERROR'] }
    ],
    responses: [
      {
        status: 200,
        description: 'Devices retrieved successfully with real-time status',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            devices: [
              {
                deviceName: '5_bizflashindevice202508230721_1755933681864',
                phoneNumber: '+919960589622',
                status: '🟢 Connected',
                messages: 53,
                lastActivity: '2025-08-25T12:19:21.094Z',
                serverName: 'WA-Server-01',
                actions: ['view', 'edit', 'delete', 'relink'],
                metadata: {
                  id: 'ddef4be8-47ae-4a92-af7d-8dbcc95ab76a',
                  serverId: 'd72aec27-9b79-4ef8-abc5-82fcdecb8ec2',
                  rawStatus: 'CONNECTED',
                  createdAt: '2025-08-23T07:21:22.095Z'
                }
              },
              {
                deviceName: '3_support_device_202508251202_1756123456789',
                phoneNumber: 'Not connected',
                status: '🔵 Scan QR Code',
                messages: 0,
                lastActivity: 'Never',
                serverName: 'WA-Server-02',
                actions: ['view', 'edit', 'delete', 'generate-qr'],
                metadata: {
                  id: 'auth-device-123-456-789',
                  serverId: 'server-abc-def-456',
                  rawStatus: 'AUTHENTICATING',
                  createdAt: '2025-08-25T12:00:00.000Z'
                }
              }
            ],
            summary: {
              total: 2,
              connected: 1,
              pending: 1,
              disconnected: 0,
              totalMessages: 53
            },
            format: 'table'
          },
          message: 'Retrieved 2 devices in table format'
        }
      }
    ],
    examples: [
      {
        title: 'Get All Devices (Table Format)',
        description: 'Retrieve devices with real-time status in table format for UI display',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/devices?format=table`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              devices: [
                {
                  deviceName: '5_bizflashindevice202508230721_1755933681864',
                  phoneNumber: '+919960589622',
                  status: '🟢 Connected',
                  messages: 53,
                  lastActivity: '8/25/2025, 5:49:21 PM',
                  serverName: 'WA-Server-01',
                  actions: ['view', 'edit', 'delete', 'relink'],
                  metadata: {
                    id: 'ddef4be8-47ae-4a92-af7d-8dbcc95ab76a',
                    serverId: 'd72aec27-9b79-4ef8-abc5-82fcdecb8ec2',
                    rawStatus: 'CONNECTED',
                    createdAt: '2025-08-23T07:21:22.095Z'
                  }
                },
                {
                  deviceName: '3_support_device_202508251202_1756123456789',
                  phoneNumber: 'Not connected',
                  status: '🔵 Scan QR Code',
                  messages: 0,
                  lastActivity: 'Never',
                  serverName: 'WA-Server-02',
                  actions: ['view', 'edit', 'delete', 'generate-qr'],
                  metadata: {
                    id: 'auth-device-123-456-789',
                    serverId: 'server-abc-def-456',
                    rawStatus: 'AUTHENTICATING',
                    createdAt: '2025-08-25T12:00:00.000Z'
                  }
                }
              ],
              summary: {
                total: 2,
                connected: 1,
                pending: 1,
                disconnected: 0,
                totalMessages: 53
              },
              format: 'table'
            },
            message: 'Retrieved 2 devices in table format'
          }
        }
      },
      {
        title: 'Get Connected Devices (JSON)',
        description: 'Filter devices by real-time connection status in JSON format',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/devices?status=CONNECTED&format=json`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              devices: [
                {
                  id: 'ddef4be8-47ae-4a92-af7d-8dbcc95ab76a',
                  name: '5_bizflashindevice202508230721_1755933681864',
                  phoneNumber: '+919960589622',
                  status: 'CONNECTED',
                  lastActivity: '2025-08-25T12:19:21.094Z',
                  messageCount: 53,
                  serverId: 'd72aec27-9b79-4ef8-abc5-82fcdecb8ec2',
                  serverName: 'WA-Server-01',
                  serverUrl: 'http://127.0.0.1:3110',
                  createdAt: '2025-08-23T07:21:22.095Z'
                }
              ],
              format: 'json'
            },
            message: 'Retrieved 1 devices'
          }
        }
      },
      {
        title: 'Get Devices by Status (All Statuses)',
        description: 'Example showing different device statuses with real-time updates',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/devices?format=table`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              devices: [
                {
                  deviceName: '5_bizflashindevice202508230721_1755933681864',
                  phoneNumber: '+919960589622',
                  status: '🟢 Connected',
                  messages: 53,
                  lastActivity: '8/25/2025, 5:49:21 PM',
                  serverName: 'WA-Server-01',
                  actions: ['view', 'edit', 'delete', 'relink']
                },
                {
                  deviceName: '6_customer_device_connecting_1756123789012',
                  phoneNumber: 'Not connected',
                  status: '🟡 Connecting',
                  messages: 0,
                  lastActivity: '8/25/2025, 6:00:15 PM',
                  serverName: 'WA-Server-02',
                  actions: ['view', 'edit', 'delete', 'generate-qr']
                },
                {
                  deviceName: '7_support_device_auth_1756123890123',
                  phoneNumber: 'Not connected',
                  status: '🔵 Scan QR Code',
                  messages: 0,
                  lastActivity: 'Never',
                  serverName: 'WA-Server-01',
                  actions: ['view', 'edit', 'delete', 'generate-qr']
                },
                {
                  deviceName: '8_old_device_disconnected_1756120000000',
                  phoneNumber: '+918983063144',
                  status: '⚫ Disconnected',
                  messages: 15,
                  lastActivity: '8/24/2025, 2:30:45 PM',
                  serverName: 'WA-Server-03',
                  actions: ['view', 'edit', 'delete', 'reconnect']
                },
                {
                  deviceName: '9_error_device_failed_1756119000000',
                  phoneNumber: 'Not connected',
                  status: '🔴 Error',
                  messages: 0,
                  lastActivity: '8/24/2025, 1:15:30 PM',
                  serverName: 'WA-Server-02',
                  actions: ['view', 'edit', 'delete', 'reconnect']
                }
              ],
              summary: {
                total: 5,
                connected: 1,
                pending: 2,
                disconnected: 2,
                totalMessages: 68
              },
              format: 'table'
            },
            message: 'Retrieved 5 devices in table format'
          }
        }
      }
    ],
    useCases: [
      'Real-time device monitoring and management',
      'Live connection status tracking and alerts',
      'Performance analytics with current status',
      'Troubleshooting connectivity issues',
      'Resource allocation based on device availability',
      'Automated health checks and status reporting',
      'Integration with monitoring dashboards'
    ]
  },

  // Servers API
  {
    id: 'servers',
    method: 'GET',
    path: '/servers',
    title: 'Get WhatsApp Servers',
    description: 'Retrieve available WhatsApp servers with health status, capacity, and performance metrics',
    category: 'Infrastructure',
    icon: <IconServer size={20} />,
    tags: ['servers', 'infrastructure', 'health', 'capacity'],
    authentication: true,
    parameters: [
      { name: 'status', type: 'string', required: false, description: 'Filter by server status', enum: ['active', 'inactive', 'maintenance'] },
      { name: 'includeHealth', type: 'boolean', required: false, description: 'Include real-time health data', example: true }
    ],
    responses: [
      {
        status: 200,
        description: 'Servers retrieved successfully',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            servers: [
              {
                id: 'wa-server-1',
                name: 'Wa-Server-1',
                url: 'http://127.0.0.1:3110',
                location: 'Local',
                status: 'active',
                capacity: {
                  max: 100,
                  current: 1,
                  available: 99,
                  percentage: 1
                },
                performance: {
                  ping: 25,
                  uptime: 99.9,
                  version: '1.0.0'
                },
                recommended: true
              }
            ],
            summary: {
              total: 1,
              active: 1,
              totalCapacity: 100,
              availableCapacity: 99
            }
          }
        }
      }
    ],
    examples: [
      {
        title: 'Get All Servers with Health Data',
        description: 'Retrieve all servers with real-time health information',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/servers?includeHealth=true`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              servers: [
                {
                  id: 'wa-server-1',
                  name: 'Wa-Server-1',
                  url: 'http://127.0.0.1:3110',
                  location: 'Local Development',
                  status: 'active',
                  capacity: {
                    max: 100,
                    current: 1,
                    available: 99,
                    percentage: 1
                  },
                  performance: {
                    ping: 25,
                    uptime: 99.9,
                    version: '1.0.0',
                    lastSeen: '2025-08-21T15:30:00.000Z'
                  },
                  recommended: true
                }
              ],
              summary: {
                total: 1,
                active: 1,
                inactive: 0,
                maintenance: 0,
                totalCapacity: 100,
                availableCapacity: 99,
                recommendedServer: 'wa-server-1'
              }
            }
          }
        }
      },
      {
        title: 'Get Active Servers Only',
        description: 'Filter servers by active status for load balancing',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/servers?status=active&includeHealth=false`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              servers: [
                {
                  id: 'wa-server-1',
                  name: 'Wa-Server-1',
                  url: 'http://127.0.0.1:3110',
                  location: 'Local Development',
                  status: 'active',
                  recommended: true
                }
              ],
              summary: {
                total: 1,
                active: 1,
                totalCapacity: 100,
                availableCapacity: 99
              }
            }
          }
        }
      }
    ],
    useCases: [
      'Server health monitoring',
      'Capacity planning',
      'Performance optimization',
      'Load balancing',
      'Infrastructure management'
    ]
  },

  // Add Device API
  {
    id: 'add-device',
    method: 'POST',
    path: '/devices/add',
    title: 'Add WhatsApp Device',
    description: 'Create a new WhatsApp device instance and generate QR code for authentication',
    category: 'Devices',
    icon: <IconDevices size={20} />,
    tags: ['devices', 'create', 'qr-code', 'setup'],
    authentication: true,
    rateLimit: '10 devices/hour',
    requestBody: {
      type: 'object',
      properties: {
        deviceName: { type: 'string', description: 'Unique name for the WhatsApp device' },
        serverId: { type: 'string', description: 'Specific server ID (optional - auto-selects if not provided)' },
        description: { type: 'string', description: 'Optional description for the device' }
      },
      required: ['deviceName'],
      example: {
        deviceName: 'my_business_whatsapp_001',
        serverId: 'server-1755622995233',
        description: 'Main business WhatsApp for customer support'
      }
    },
    responses: [
      {
        status: 201,
        description: 'Device created successfully with QR code',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            deviceId: 'demo_customer_my_business_whatsapp_001_1755792400000',
            deviceName: 'my_business_whatsapp_001',
            status: 'AUTHENTICATING',
            serverId: 'server-1755622995233',
            serverName: 'Wa-Server-1',
            qr: {
              code: '2@3QN8tG6U9...',
              imageUrl: '/api/v1/devices/demo_customer_my_business_whatsapp_001_1755792400000/qr?format=image',
              expiresAt: '2025-08-21T16:12:00.000Z'
            },
            createdAt: '2025-08-21T16:10:00.000Z'
          },
          message: 'Device created successfully. Scan QR code to authenticate.'
        }
      }
    ],
    examples: [
      {
        title: 'Add Device (JSON)',
        description: 'Create a new WhatsApp device with JSON request',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/devices/add`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            deviceName: 'my_business_whatsapp_001',
            description: 'Main business WhatsApp for customer support'
          }
        },
        response: {
          status: 201,
          body: {
            success: true,
            data: {
              deviceId: 'demo_customer_my_business_whatsapp_001_1755792400000',
              deviceName: 'my_business_whatsapp_001',
              status: 'AUTHENTICATING',
              qr: {
                code: '2@3QN8tG6U9rT5xP...',
                imageUrl: '/api/v1/devices/demo_customer_my_business_whatsapp_001_1755792400000/qr?format=image'
              }
            }
          }
        }
      },
      {
        title: 'Add Device (Form-encoded)',
        description: 'Create a new WhatsApp device with form data',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/devices/add`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'deviceName=support_whatsapp&description=Customer%20support%20device'
        },
        response: {
          status: 201,
          body: {
            success: true,
            data: {
              deviceId: 'demo_customer_support_whatsapp_1755792450000',
              deviceName: 'support_whatsapp',
              status: 'AUTHENTICATING'
            }
          }
        }
      }
    ],
    useCases: [
      'Set up new business WhatsApp accounts',
      'Create separate devices for different departments',
      'Scale messaging capacity',
      'Replace disconnected devices',
      'Multi-brand messaging setup'
    ]
  },

  // Get QR Code API
  {
    id: 'device-qr',
    method: 'GET',
    path: '/devices/{deviceId}/qr',
    title: 'Get Device QR Code',
    description: 'Retrieve QR code for WhatsApp device authentication in multiple formats (JSON, image, base64)',
    category: 'Devices',
    icon: <IconList size={20} />,
    tags: ['qr-code', 'authentication', 'image', 'json'],
    authentication: true,
    parameters: [
      { name: 'deviceId', type: 'string', required: true, description: 'WhatsApp device ID', example: 'demo_instance_001' },
      { name: 'format', type: 'string', required: false, description: 'Response format', enum: ['json', 'image', 'base64'], example: 'json' },
      { name: 'size', type: 'number', required: false, description: 'QR code image size in pixels (100-1000)', minimum: 100, maximum: 1000, example: 256 },
      { name: 'download', type: 'boolean', required: false, description: 'Force download of image file', example: false }
    ],
    responses: [
      {
        status: 200,
        description: 'QR code retrieved successfully',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            deviceId: 'demo_instance_001',
            deviceName: 'my_business_whatsapp_001',
            qrCode: '2@3QN8tG6U9rT5xP7mB2kL...',
            base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            imageUrl: '/api/v1/devices/demo_instance_001/qr?format=image',
            downloadUrl: '/api/v1/devices/demo_instance_001/qr?format=image&download=true',
            expiresAt: '2025-08-21T16:12:00.000Z',
            status: 'AUTHENTICATING',
            instructions: [
              '1. Open WhatsApp on your phone',
              '2. Tap Menu (⋮) > Linked devices',
              '3. Tap "Link a device"',
              '4. Point your phone camera at this QR code',
              '5. Wait for the connection to complete'
            ]
          },
          message: 'QR code retrieved successfully. Scan within 2 minutes.'
        }
      }
    ],
    examples: [
      {
        title: 'Get QR Code (JSON)',
        description: 'Get QR code data and base64 image in JSON format',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/devices/demo_instance_001/qr?format=json`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              deviceId: 'demo_instance_001',
              qrCode: '2@3QN8tG6U9rT5xP7mB2kL...',
              base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
              imageUrl: '/api/v1/devices/demo_instance_001/qr?format=image',
              expiresAt: '2025-08-21T16:12:00.000Z'
            }
          }
        }
      },
      {
        title: 'Get QR Code (Image)',
        description: 'Download QR code as PNG image file',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/devices/demo_instance_001/qr?format=image&size=512&download=true`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: '[Binary PNG image data]'
        }
      },
      {
        title: 'Get QR Code (Base64)',
        description: 'Get only base64 encoded image data',
        request: {
          method: 'GET',
          url: `${API_BASE_URL}/devices/demo_instance_001/qr?format=base64`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              deviceId: 'demo_instance_001',
              base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
              expiresAt: '2025-08-21T16:12:00.000Z'
            }
          }
        }
      }
    ],
    useCases: [
      'Display QR codes in web applications',
      'Generate QR codes for mobile apps',
      'Create printable QR codes for physical setup',
      'Programmatic device authentication',
      'Integration with custom authentication flows'
    ]
  },
  
  // WhatsApp Check API
  {
    id: 'check-whatsapp',
    method: 'POST',
    path: '/accounts/:id/check-whatsapp',
    title: 'Check WhatsApp Phone Number',
    description: 'Verify if a phone number is registered on WhatsApp and get account details',
    category: 'Validation',
    icon: <IconCheck size={20} />,
    tags: ['validation', 'whatsapp', 'phone', 'verification'],
    authentication: true,
    rateLimit: '500 requests/hour',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Account/Device ID to use for checking', example: 'demo_instance_001' }
    ],
    requestBody: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', description: 'Phone number to check in international format with + prefix' }
      },
      required: ['phoneNumber'],
      example: {
        phoneNumber: '+919960589622'
      }
    },
    responses: [
      {
        status: 200,
        description: 'WhatsApp check completed successfully',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            phoneNumber: '+919960589622',
            isOnWhatsApp: true,
            jid: '919960589622@s.whatsapp.net',
            businessAccount: false
          },
          message: 'WhatsApp check completed for +919960589622'
        }
      },
      {
        status: 200,
        description: 'Number not on WhatsApp',
        schema: { type: 'object' },
        example: {
          success: true,
          data: {
            phoneNumber: '+919999999999',
            isOnWhatsApp: false,
            jid: null,
            businessAccount: false
          },
          message: 'WhatsApp check completed for +919999999999'
        }
      },
      {
        status: 400,
        description: 'Invalid phone number format',
        schema: { type: 'object' },
        example: {
          success: false,
          error: 'Invalid phone number format. Please use international format with + prefix'
        }
      }
    ],
    examples: [
      {
        title: 'Check WhatsApp User (JSON)',
        description: 'Verify if a phone number is registered on WhatsApp using JSON format',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/accounts/demo_instance_001/check-whatsapp`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            phoneNumber: '+919960589622'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              phoneNumber: '+919960589622',
              isOnWhatsApp: true,
              jid: '919960589622@s.whatsapp.net',
              businessAccount: false
            },
            message: 'WhatsApp check completed for +919960589622'
          }
        }
      },
      {
        title: 'Check WhatsApp User (URL-encoded)',
        description: 'Verify phone number using form-urlencoded format',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/accounts/demo_instance_001/check-whatsapp`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'phoneNumber=%2B919960589622'
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              phoneNumber: '+919960589622',
              isOnWhatsApp: true,
              jid: '919960589622@s.whatsapp.net',
              businessAccount: false
            },
            message: 'WhatsApp check completed for +919960589622'
          }
        }
      },
      {
        title: 'Check Business Account',
        description: 'Check if a number is a WhatsApp Business account',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/accounts/demo_instance_001/check-whatsapp`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            phoneNumber: '+14155552671'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              phoneNumber: '+14155552671',
              isOnWhatsApp: true,
              jid: '14155552671@s.whatsapp.net',
              businessAccount: true
            },
            message: 'WhatsApp check completed for +14155552671'
          }
        }
      },
      {
        title: 'Check Non-WhatsApp Number',
        description: 'Check a number that is not on WhatsApp',
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/accounts/demo_instance_001/check-whatsapp`,
          headers: {
            'Authorization': 'Bearer sk_live_your_api_key_here',
            'Content-Type': 'application/json'
          },
          body: {
            phoneNumber: '+919999999999'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            data: {
              phoneNumber: '+919999999999',
              isOnWhatsApp: false,
              jid: null,
              businessAccount: false
            },
            message: 'WhatsApp check completed for +919999999999'
          }
        }
      }
    ],
    useCases: [
      'Validate customer phone numbers before sending messages',
      'Build contact lists of WhatsApp users',
      'Filter marketing campaigns by WhatsApp availability',
      'Verify customer contact information',
      'Pre-validate bulk message recipients',
      'Reduce failed message attempts'
    ]
  }
]

interface ApiKeyOption {
  value: string
  label: string
  name: string
  isActive: boolean
}

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [testParameters, setTestParameters] = useState<Record<string, any>>({})
  const [testBody, setTestBody] = useState('')
  const [testResponse, setTestResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('sk_live_demo_test_key_12345678901234567890123456789012')
  const [availableKeys, setAvailableKeys] = useState<ApiKeyOption[]>([])
  const [selectedKeyId, setSelectedKeyId] = useState<string>('')
  const [opened, { open, close }] = useDisclosure(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const endpointDetailsRef = useRef<HTMLDivElement>(null)

  const categories = ['All', 'Messages', 'Account', 'Devices', 'Infrastructure']

  // Fetch available API keys
  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/customer/api-keys')
      if (response.ok) {
        const data = await response.json()
        const keyOptions = data.keys
          .filter((key: any) => key.isActive)
          .map((key: any) => ({
            value: key.key,
            label: `${key.name} (${key.key.slice(-8)})`,
            name: key.name,
            isActive: key.isActive
          }))
        setAvailableKeys(keyOptions)
        
        // Set the first key as default if no key is selected
        if (keyOptions.length > 0 && !apiKey) {
          setApiKey(keyOptions[0].value)
          setSelectedKeyId(keyOptions[0].value)
        }
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    }
  }

  // Load API keys on component mount
  useEffect(() => {
    fetchApiKeys()
  }, [])

  // Handle API key selection
  const handleKeySelect = (selectedKey: string | null) => {
    if (selectedKey) {
      setApiKey(selectedKey)
      setSelectedKeyId(selectedKey)
    }
  }

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesSearch = endpoint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         endpoint.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || endpoint.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleEndpointSelect = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint)
    // Scroll to endpoint details section after a brief delay
    setTimeout(() => {
      endpointDetailsRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }

  const executeTest = async () => {
    if (!selectedEndpoint) return

    setIsLoading(true)
    try {
      const url = new URL(`${API_BASE_URL}${selectedEndpoint.path}`)
      
      // Add query parameters
      if (selectedEndpoint.parameters) {
        selectedEndpoint.parameters.forEach(param => {
          if (testParameters[param.name] && testParameters[param.name] !== '') {
            url.searchParams.append(param.name, testParameters[param.name])
          }
        })
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }

      // Add request body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && testBody) {
        try {
          options.body = JSON.stringify(JSON.parse(testBody))
        } catch (error) {
          notifications.show({
            title: 'Invalid JSON',
            message: 'Please provide valid JSON in the request body',
            color: 'red'
          })
          setIsLoading(false)
          return
        }
      }

      console.log('Making request to:', url.toString())
      console.log('Options:', options)

      const response = await fetch(url.toString(), options)
      const data = await response.json()

      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      })

      notifications.show({
        title: 'API Test Complete',
        message: `Response: ${response.status} ${response.statusText}`,
        color: response.ok ? 'green' : 'red'
      })

    } catch (error) {
      console.error('API test error:', error)
      setTestResponse({
        status: 0,
        statusText: 'Network Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      notifications.show({
        title: 'Request Failed',
        message: error instanceof Error ? error.message : 'Network error occurred',
        color: 'red'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetTest = () => {
    setTestParameters({})
    setTestBody('')
    setTestResponse(null)
  }

  useEffect(() => {
    if (selectedEndpoint?.requestBody?.example) {
      setTestBody(JSON.stringify(selectedEndpoint.requestBody.example, null, 2))
    } else {
      setTestBody('')
    }
    resetTest()
  }, [selectedEndpoint])

  return (
    <Container size="xl" py="md">
      <Card withBorder padding="lg" radius="md" mb="lg">
        <Group justify="space-between" align="center">
          <div>
            <Group gap="sm" mb="xs">
              <Title order={1}>API Documentation & Testing Center</Title>
              <Badge color="blue" size="lg">v1.0</Badge>
            </Group>
            <Text size="lg" c="dimmed">Interactive documentation with live testing capabilities</Text>
          </div>
          <ThemeIcon size="xl" variant="light" color="blue">
            <IconApi size={32} />
          </ThemeIcon>
        </Group>
      </Card>

      <Stack gap="lg">
        {/* Header Section */}
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" mb="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconApi size={24} />
              </ThemeIcon>
              <div>
                <Title order={3}>WhatsApp Business API v1</Title>
                <Text size="sm" c="dimmed">Professional-grade messaging API with real-time testing</Text>
              </div>
            </Group>
            <Group gap="sm">
              <Badge variant="light" color="green" size="lg">
                <Group gap={4}>
                  <IconCheck size={12} />
                  All Systems Operational
                </Group>
              </Badge>
              <Button
                variant="light"
                leftSection={<IconDownload size="1rem" />}
                onClick={() => window.open('/api/docs/openapi.json', '_blank')}
              >
                Export OpenAPI
              </Button>
            </Group>
          </Group>

          <Grid gutter="md">
            <Grid.Col span={6}>
              <Paper p="md" withBorder radius="md">
                <Group gap="xs" mb="xs">
                  <IconRocket size={16} color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={600}>Base URL</Text>
                </Group>
                <Code block>{API_BASE_URL}</Code>
              </Paper>
            </Grid.Col>
            <Grid.Col span={6}>
              <Paper p="md" withBorder radius="md">
                <Group gap="xs" mb="xs">
                  <IconSettings size={16} color="var(--mantine-color-green-6)" />
                  <Text size="sm" fw={600}>Authentication</Text>
                </Group>
                <Text size="sm" c="dimmed">Bearer Token (API Key)</Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Search and Filter */}
        <Card withBorder padding="md">
          <Group gap="md">
            <TextInput
              placeholder="Search endpoints, descriptions, or tags..."
              leftSection={<IconSearch size="1rem" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.currentTarget?.value || '')}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by category"
              data={categories}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value || 'All')}
              w={200}
            />
            <Button
              variant="light"
              leftSection={<IconTestPipe size="1rem" />}
              onClick={open}
            >
              API Tester
            </Button>
          </Group>
        </Card>

        {/* Endpoints Grid */}
        <Grid gutter="md">
          {filteredEndpoints.map((endpoint) => (
            <Grid.Col key={endpoint.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card
                withBorder
                padding="lg"
                radius="md"
                style={{ 
                  height: '100%',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  border: selectedEndpoint?.id === endpoint.id ? '2px solid var(--mantine-color-blue-5)' : undefined
                }}
                className={selectedEndpoint?.id === endpoint.id ? 'selected-endpoint' : ''}
                onClick={() => handleEndpointSelect(endpoint)}
              >
                <Group justify="space-between" mb="md">
                  <Group gap="sm">
                    <ThemeIcon size="md" variant="light" color={endpoint.method === 'GET' ? 'blue' : endpoint.method === 'POST' ? 'green' : 'orange'}>
                      {endpoint.icon}
                    </ThemeIcon>
                    <Badge
                      color={endpoint.method === 'GET' ? 'blue' : endpoint.method === 'POST' ? 'green' : 'orange'}
                      variant="light"
                      size="sm"
                    >
                      {endpoint.method}
                    </Badge>
                  </Group>
                  <IconChevronRight size={16} style={{ color: 'var(--mantine-color-gray-5)' }} />
                </Group>

                <Text fw={600} mb="xs">{endpoint.title}</Text>
                <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                  {endpoint.description}
                </Text>

                <Group gap="xs" mb="md">
                  {endpoint.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} size="xs" variant="dot" color="gray">
                      {tag}
                    </Badge>
                  ))}
                </Group>

                <Group justify="space-between" align="center">
                  <Badge variant="light" color="gray" size="xs">
                    {endpoint.category}
                  </Badge>
                  {endpoint.authentication && (
                    <Badge variant="light" color="yellow" size="xs">
                      🔐 Auth Required
                    </Badge>
                  )}
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Endpoint Details */}
        {selectedEndpoint && (
          <Card withBorder padding="lg" radius="md" ref={endpointDetailsRef}>
            <Group justify="space-between" mb="lg">
              <Group gap="md">
                <ThemeIcon size="xl" variant="light" color={selectedEndpoint.method === 'GET' ? 'blue' : selectedEndpoint.method === 'POST' ? 'green' : 'orange'}>
                  {selectedEndpoint.icon}
                </ThemeIcon>
                <div>
                  <Group gap="sm" mb="xs">
                    <Title order={2}>{selectedEndpoint.title}</Title>
                    <Badge color={selectedEndpoint.method === 'GET' ? 'blue' : selectedEndpoint.method === 'POST' ? 'green' : 'orange'}>
                      {selectedEndpoint.method}
                    </Badge>
                  </Group>
                  <Text c="dimmed">{selectedEndpoint.description}</Text>
                </div>
              </Group>
              <Group gap="sm">
                <Button
                  variant="light"
                  leftSection={<IconTestPipe size="1rem" />}
                  onClick={() => {
                    setSelectedEndpoint(selectedEndpoint)
                    open()
                  }}
                >
                  Test API
                </Button>
                <CopyButton value={`${API_BASE_URL}${selectedEndpoint.path}`}>
                  {({ copied, copy }) => (
                    <ActionIcon variant="light" onClick={copy} color={copied ? 'green' : 'blue'}>
                      {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                    </ActionIcon>
                  )}
                </CopyButton>
              </Group>
            </Group>

            <Tabs defaultValue="overview">
              <Tabs.List mb="md">
                <Tabs.Tab value="overview" leftSection={<IconInfoCircle size="0.8rem" />}>
                  Overview
                </Tabs.Tab>
                <Tabs.Tab value="parameters" leftSection={<IconSettings size="0.8rem" />}>
                  Parameters
                </Tabs.Tab>
                <Tabs.Tab value="examples" leftSection={<IconCode size="0.8rem" />}>
                  Examples
                </Tabs.Tab>
                <Tabs.Tab value="responses" leftSection={<IconEye size="0.8rem" />}>
                  Responses
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="overview">
                <Stack gap="md">
                  <Group gap="md">
                    <Paper p="md" withBorder radius="md" style={{ flex: 1 }}>
                      <Text size="sm" fw={600} mb="xs">Endpoint</Text>
                      <Code>{selectedEndpoint.method} {selectedEndpoint.path}</Code>
                    </Paper>
                    {selectedEndpoint.rateLimit && (
                      <Paper p="md" withBorder radius="md">
                        <Text size="sm" fw={600} mb="xs">Rate Limit</Text>
                        <Text size="sm" c="dimmed">{selectedEndpoint.rateLimit}</Text>
                      </Paper>
                    )}
                  </Group>

                  <Paper p="md" withBorder radius="md">
                    <Text size="sm" fw={600} mb="xs">Use Cases</Text>
                    <Stack gap="xs">
                      {selectedEndpoint.useCases.map((useCase, index) => (
                        <Group key={index} gap="xs">
                          <Text size="sm" c="dimmed">•</Text>
                          <Text size="sm">{useCase}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>

                  <Paper p="md" withBorder radius="md">
                    <Text size="sm" fw={600} mb="xs">Tags</Text>
                    <Group gap="xs">
                      {selectedEndpoint.tags.map((tag) => (
                        <Badge key={tag} size="sm" variant="light">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  </Paper>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="parameters">
                <Stack gap="md">
                  {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 ? (
                    selectedEndpoint.parameters.map((param) => (
                      <Paper key={param.name} p="md" withBorder radius="md">
                        <Group justify="space-between" mb="xs">
                          <Group gap="sm">
                            <Code>{param.name}</Code>
                            <Badge size="xs" color={param.required ? 'red' : 'gray'}>
                              {param.required ? 'Required' : 'Optional'}
                            </Badge>
                            <Badge size="xs" variant="light">{param.type}</Badge>
                          </Group>
                        </Group>
                        <Text size="sm" mb="xs">{param.description}</Text>
                        {param.example && (
                          <Code block>Example: {JSON.stringify(param.example)}</Code>
                        )}
                      </Paper>
                    ))
                  ) : (
                    <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                      This endpoint does not require any query parameters.
                    </Alert>
                  )}

                  {selectedEndpoint.requestBody && (
                    <Paper p="md" withBorder radius="md">
                      <Text fw={600} mb="md">Request Body</Text>
                      <JsonInput
                        value={JSON.stringify(selectedEndpoint.requestBody.example, null, 2)}
                        readOnly
                        autosize
                        minRows={10}
                        formatOnBlur
                      />
                    </Paper>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="examples">
                <Stack gap="md">
                  {selectedEndpoint.examples.length > 0 ? (
                    selectedEndpoint.examples.map((example, index) => (
                      <Paper key={index} p="md" withBorder radius="md">
                        <Text fw={600} mb="xs">{example.title}</Text>
                        <Text size="sm" c="dimmed" mb="md">{example.description}</Text>
                        
                        <Accordion>
                          <Accordion.Item value="request">
                            <Accordion.Control>Request</Accordion.Control>
                            <Accordion.Panel>
                              <Stack gap="sm">
                                <Code block>
                                  {example.request.method} {example.request.url}
                                </Code>
                                {example.request.headers && (
                                  <JsonInput
                                    label="Headers"
                                    value={JSON.stringify(example.request.headers, null, 2)}
                                    readOnly
                                    autosize
                                  />
                                )}
                                {example.request.body && (
                                  <JsonInput
                                    label="Body"
                                    value={JSON.stringify(example.request.body, null, 2)}
                                    readOnly
                                    autosize
                                  />
                                )}
                              </Stack>
                            </Accordion.Panel>
                          </Accordion.Item>
                          <Accordion.Item value="response">
                            <Accordion.Control>Response</Accordion.Control>
                            <Accordion.Panel>
                              <Stack gap="sm">
                                <Badge color="green">Status: {example.response.status}</Badge>
                                <JsonInput
                                  value={JSON.stringify(example.response.body, null, 2)}
                                  readOnly
                                  autosize
                                />
                              </Stack>
                            </Accordion.Panel>
                          </Accordion.Item>
                        </Accordion>
                      </Paper>
                    ))
                  ) : (
                    <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                      <Text fw={600} mb="xs">Ready to Test!</Text>
                      <Text size="sm">
                        This endpoint now includes comprehensive examples. Click the "Test API" button above to experiment with real requests, 
                        or check the Examples tab to see detailed JSON and URL-encoded request samples.
                      </Text>
                    </Alert>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="responses">
                <Stack gap="md">
                  {selectedEndpoint.responses.map((response) => (
                    <Paper key={response.status} p="md" withBorder radius="md">
                      <Group justify="space-between" mb="md">
                        <Group gap="sm">
                          <Badge 
                            color={response.status < 300 ? 'green' : response.status < 400 ? 'orange' : 'red'}
                            size="lg"
                          >
                            {response.status}
                          </Badge>
                          <Text fw={600}>{response.description}</Text>
                        </Group>
                      </Group>
                      <JsonInput
                        value={JSON.stringify(response.example, null, 2)}
                        readOnly
                        autosize
                        minRows={5}
                      />
                    </Paper>
                  ))}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Card>
        )}
      </Stack>

      {/* API Tester Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="sm">
            <IconTestPipe size={20} />
            <Text fw={600}>API Endpoint Tester</Text>
            {selectedEndpoint && (
              <Badge color={selectedEndpoint.method === 'GET' ? 'blue' : 'green'}>
                {selectedEndpoint.method} {selectedEndpoint.path}
              </Badge>
            )}
          </Group>
        }
        size="xl"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {selectedEndpoint ? (
          <Stack gap="md">
            {/* API Key Selection */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>API Key Authentication</Text>
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconRefresh size="0.8rem" />}
                  onClick={fetchApiKeys}
                >
                  Refresh Keys
                </Button>
              </Group>
              
              {availableKeys.length > 0 && (
                <Select
                  label="Select from your API keys"
                  placeholder="Choose an existing API key"
                  value={selectedKeyId}
                  onChange={handleKeySelect}
                  data={availableKeys.map(key => ({
                    value: key.value,
                    label: key.label
                  }))}
                  leftSection={<IconBookmark size="1rem" />}
                  searchable
                  clearable
                  description="Quick select from your active API keys"
                />
              )}
              
              <TextInput
                label={availableKeys.length > 0 ? "Or enter API key manually" : "API Key"}
                placeholder="sk_live_..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e?.currentTarget?.value || '')
                  setSelectedKeyId('') // Clear selection when typing manually
                }}
                leftSection={<IconBookmark size="1rem" />}
                description="Your Bearer token for authentication"
              />
              
              {availableKeys.length === 0 && (
                <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
                  No API keys found. Create one in the API Keys section to see the dropdown.
                </Alert>
              )}
            </Stack>

            {/* Parameters */}
            {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
              <Paper p="md" withBorder>
                <Text fw={600} mb="md">Query Parameters</Text>
                <Stack gap="sm">
                  {selectedEndpoint.parameters.map((param) => (
                    <Group key={param.name} align="flex-end">
                      {param.type === 'boolean' ? (
                        <Switch
                          label={param.name}
                          description={param.description}
                          checked={testParameters[param.name] || false}
                          onChange={(checked) => setTestParameters(prev => ({
                            ...prev,
                            [param.name]: checked
                          }))}
                        />
                      ) : param.type === 'number' ? (
                        <NumberInput
                          label={param.name}
                          description={param.description}
                          placeholder={param.example?.toString()}
                          value={testParameters[param.name] || ''}
                          onChange={(value) => setTestParameters(prev => ({
                            ...prev,
                            [param.name]: value
                          }))}
                          min={param.minimum}
                          max={param.maximum}
                          style={{ flex: 1 }}
                        />
                      ) : param.enum ? (
                        <Select
                          label={param.name}
                          description={param.description}
                          placeholder="Select value"
                          data={param.enum}
                          value={testParameters[param.name] || ''}
                          onChange={(value) => setTestParameters(prev => ({
                            ...prev,
                            [param.name]: value
                          }))}
                          style={{ flex: 1 }}
                        />
                      ) : (
                        <TextInput
                          label={param.name}
                          description={param.description}
                          placeholder={param.example?.toString() || `Enter ${param.name}`}
                          value={testParameters[param.name] || ''}
                          onChange={(e) => setTestParameters(prev => ({
                            ...prev,
                            [param.name]: e?.currentTarget?.value || ''
                          }))}
                          style={{ flex: 1 }}
                        />
                      )}
                      {param.required && (
                        <Badge size="xs" color="red">Required</Badge>
                      )}
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* Request Body */}
            {selectedEndpoint.requestBody && (
              <Paper p="md" withBorder>
                <Text fw={600} mb="md">Request Body</Text>
                <JsonInput
                  value={testBody}
                  onChange={setTestBody}
                  placeholder="Enter JSON request body"
                  autosize
                  minRows={10}
                  formatOnBlur
                  validationError="Invalid JSON format"
                />
              </Paper>
            )}

            {/* Action Buttons */}
            <Group justify="space-between">
              <Button variant="light" onClick={resetTest}>
                Reset
              </Button>
              <Button
                leftSection={<IconPlayerPlay size="1rem" />}
                onClick={executeTest}
                loading={isLoading}
                disabled={!apiKey}
              >
                Execute Request
              </Button>
            </Group>

            {/* Response */}
            {testResponse && (
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Response</Text>
                  <Badge 
                    color={testResponse.status < 300 ? 'green' : testResponse.status < 400 ? 'orange' : 'red'}
                  >
                    {testResponse.status} {testResponse.statusText}
                  </Badge>
                </Group>
                
                {testResponse.error ? (
                  <Alert icon={<IconX size="1rem" />} color="red">
                    <Text fw={600}>Error:</Text>
                    <Text size="sm">{testResponse.error}</Text>
                  </Alert>
                ) : (
                  <JsonInput
                    value={JSON.stringify(testResponse.data, null, 2)}
                    readOnly
                    autosize
                    minRows={10}
                  />
                )}
              </Paper>
            )}
          </Stack>
        ) : (
          <Alert icon={<IconInfoCircle size="1rem" />}>
            Please select an endpoint from the list to test it.
          </Alert>
        )}
      </Modal>

      <style jsx global>{`
        .selected-endpoint {
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15) !important;
          transform: translateY(-2px);
        }
        
        .selected-endpoint:hover {
          box-shadow: 0 6px 16px rgba(0, 123, 255, 0.2) !important;
        }
      `}</style>
    </Container>
  )
}