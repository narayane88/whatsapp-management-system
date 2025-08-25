/**
 * Centralized Webhook Configuration
 * Manages webhook URLs and configurations for different environments
 */

export interface WebhookConfig {
  baseUrl: string
  deviceStatusEndpoint: string
  messageStatusEndpoint: string
  events: string[]
}

/**
 * Get the base URL for webhooks based on environment
 */
function getWebhookBaseUrl(): string {
  // In production, use the actual domain
  if (process.env.NODE_ENV === 'production') {
    return process.env.WEBHOOK_BASE_URL || 'https://wa.bizflash.in'
  }
  
  // In development, use localhost with correct port
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Default to localhost for development
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100'
}

/**
 * Get webhook configuration for WhatsApp device events
 */
export function getDeviceWebhookConfig(): WebhookConfig {
  const baseUrl = getWebhookBaseUrl()
  
  return {
    baseUrl,
    deviceStatusEndpoint: `${baseUrl}/api/webhooks/whatsapp-device`,
    messageStatusEndpoint: `${baseUrl}/api/webhooks/whatsapp-status`,
    events: [
      'connection.update',
      'connection.open',
      'connection.close',
      'qr',
      'ready',
      'auth_failure'
    ]
  }
}

/**
 * Get webhook configuration for message events
 */
export function getMessageWebhookConfig(): WebhookConfig {
  const baseUrl = getWebhookBaseUrl()
  
  return {
    baseUrl,
    deviceStatusEndpoint: `${baseUrl}/api/webhooks/whatsapp-device`,
    messageStatusEndpoint: `${baseUrl}/api/webhooks/whatsapp-status`,
    events: [
      'message.status',
      'message.sent',
      'message.delivered',
      'message.read'
    ]
  }
}

/**
 * Generate webhook payload for device creation
 * Baileys server accepts webhookUrl parameter for device status webhooks
 */
export function generateDeviceWebhookPayload(accountId: string) {
  const config = getDeviceWebhookConfig()
  
  return {
    id: accountId,
    webhookUrl: config.deviceStatusEndpoint
  }
}

/**
 * Generate webhook configuration for external setup
 * Use this to configure webhooks on the Baileys server
 */
export function getWebhookConfigurationForBaileys() {
  const config = getDeviceWebhookConfig()
  
  return {
    webhooks: {
      statusUrl: config.deviceStatusEndpoint,
      messageUrl: config.messageStatusEndpoint,
      events: [
        ...config.events,
        'message.status'
      ]
    }
  }
}

/**
 * Log webhook configuration (for debugging)
 */
export function logWebhookConfig(): void {
  const deviceConfig = getDeviceWebhookConfig()
  const messageConfig = getMessageWebhookConfig()
  
  console.log('🔗 Webhook Configuration:')
  console.log(`   Base URL: ${deviceConfig.baseUrl}`)
  console.log(`   Device Endpoint: ${deviceConfig.deviceStatusEndpoint}`)
  console.log(`   Message Endpoint: ${deviceConfig.messageStatusEndpoint}`)
  console.log(`   Device Events: ${deviceConfig.events.join(', ')}`)
  console.log(`   Message Events: ${messageConfig.events.join(', ')}`)
}