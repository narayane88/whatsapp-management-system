import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'

// Email event types
export type EmailEvent = 
  | 'user_created'
  | 'user_activated' 
  | 'user_deactivated'
  | 'whatsapp_connected'
  | 'whatsapp_disconnected'
  | 'package_purchased'
  | 'package_expired'
  | 'payment_successful'
  | 'payment_failed'
  | 'balance_low'
  | 'commission_earned'
  | 'payout_processed'
  | 'message_quota_exceeded'
  | 'account_suspended'
  | 'security_alert'
  | 'password_reset'
  | 'login_attempt'
  | 'system_maintenance'

// User roles for email targeting
export type UserRole = 'admin' | 'subdealer' | 'customer' | 'employee' | 'owner'

// Email template data interface
export interface EmailTemplateData {
  id: string
  name: string
  subject: string
  content: string
  type: 'html' | 'text'
  category: UserRole
  event: EmailEvent
  active?: boolean
  createdAt: string
  updatedAt: string
}

// Email event data interface
export interface EmailEventData {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    parentId?: string
  }
  event: EmailEvent
  data?: Record<string, any>
  company?: string
  timestamp: Date
}

// Email settings interface
export interface EmailSettings {
  provider: string
  smtp: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  from: {
    name: string
    email: string
  }
  events: {
    [key in EmailEvent]?: {
      enabled: boolean
      template?: string
      recipients?: UserRole[]
    }
  }
}

const EMAIL_SETTINGS_FILE = path.join(process.cwd(), 'config', 'email-settings.json')
const EMAIL_TEMPLATES_DIR = path.join(process.cwd(), 'config', 'email-templates')
const EMAIL_HISTORY_FILE = path.join(process.cwd(), 'config', 'email-history.json')

// Load email settings
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const data = await fs.readFile(EMAIL_SETTINGS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    throw new Error('Email settings not configured')
  }
}

// Load email templates
export async function getEmailTemplates(): Promise<EmailTemplateData[]> {
  try {
    const files = await fs.readdir(EMAIL_TEMPLATES_DIR)
    const templates: EmailTemplateData[] = []
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const templateData = await fs.readFile(path.join(EMAIL_TEMPLATES_DIR, file), 'utf8')
        templates.push(JSON.parse(templateData))
      }
    }
    
    return templates
  } catch (error) {
    console.error('Error loading email templates:', error)
    return []
  }
}

// Get template by event and role
export async function getTemplateByEvent(event: EmailEvent, role: UserRole): Promise<EmailTemplateData | null> {
  const templates = await getEmailTemplates()
  return templates.find(t => t.event === event && t.category === role && t.active !== false) || null
}

// Replace variables in template content
export function replaceTemplateVariables(content: string, data: Record<string, any>): string {
  let result = content
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, data[key] || '')
  })
  return result
}

// Create email transporter
async function createEmailTransporter() {
  const settings = await getEmailSettings()
  return nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure,
    auth: {
      user: settings.smtp.auth.user,
      pass: settings.smtp.auth.pass,
    },
  })
}

// Send email with template
export async function sendTemplateEmail(
  eventData: EmailEventData,
  template: EmailTemplateData,
  additionalData: Record<string, any> = {}
): Promise<boolean> {
  try {
    const settings = await getEmailSettings()
    const transporter = await createEmailTransporter()
    
    // Prepare template data
    const templateData = {
      name: eventData.user.name,
      email: eventData.user.email,
      user_id: eventData.user.id,
      company: eventData.company || settings.from.name,
      dashboard_url: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3000/dashboard',
      support_email: `support@${eventData.company || 'company'}.com`,
      ...eventData.data,
      ...additionalData
    }
    
    // Replace variables in subject and content
    const subject = replaceTemplateVariables(template.subject, templateData)
    const content = replaceTemplateVariables(template.content, templateData)
    
    // Send email
    const info = await transporter.sendMail({
      from: `\"${settings.from.name}\" <${settings.from.email}>`,
      to: eventData.user.email,
      subject: subject,
      html: template.type === 'html' ? content : undefined,
      text: template.type === 'text' ? content : undefined,
    })
    
    // Log email history
    await logEmailHistory({
      messageId: info.messageId,
      to: eventData.user.email,
      subject: subject,
      template: template.name,
      event: eventData.event,
      timestamp: new Date(),
      status: 'sent'
    })
    
    console.log(`Email sent successfully: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('Error sending template email:', error)
    
    // Log failed email
    await logEmailHistory({
      messageId: null,
      to: eventData.user.email,
      subject: template.subject,
      template: template.name,
      event: eventData.event,
      timestamp: new Date(),
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return false
  }
}

// Log email history
async function logEmailHistory(entry: any) {
  try {
    let history = []
    try {
      const historyData = await fs.readFile(EMAIL_HISTORY_FILE, 'utf8')
      history = JSON.parse(historyData)
    } catch {
      // File doesn't exist, start with empty array
    }
    
    history.push(entry)
    
    // Keep only last 1000 entries
    if (history.length > 1000) {
      history = history.slice(-1000)
    }
    
    await fs.writeFile(EMAIL_HISTORY_FILE, JSON.stringify(history, null, 2))
  } catch (error) {
    console.error('Error logging email history:', error)
  }
}

// Main email event trigger function
export async function triggerEmailEvent(eventData: EmailEventData): Promise<boolean> {
  try {
    const settings = await getEmailSettings()
    
    // Check if event is enabled
    const eventConfig = settings.events?.[eventData.event]
    if (!eventConfig?.enabled) {
      console.log(`Email event ${eventData.event} is disabled`)
      return false
    }
    
    // Get template for user role and event
    const template = await getTemplateByEvent(eventData.event, eventData.user.role)
    if (!template) {
      console.log(`No template found for event ${eventData.event} and role ${eventData.user.role}`)
      return false
    }
    
    // Send email
    const success = await sendTemplateEmail(eventData, template)
    
    // If user has a parent (SubDealer), also notify parent for certain events
    if (eventData.user.parentId && ['user_created', 'package_purchased', 'payment_successful'].includes(eventData.event)) {
      // TODO: Implement parent notification logic
      console.log(`Parent notification needed for user ${eventData.user.parentId}`)
    }
    
    return success
  } catch (error) {
    console.error('Error triggering email event:', error)
    return false
  }
}

// Convenience functions for common events
export async function sendWelcomeEmail(user: EmailEventData['user'], additionalData?: Record<string, any>) {
  return triggerEmailEvent({
    user,
    event: 'user_created',
    data: additionalData,
    timestamp: new Date()
  })
}

export async function sendWhatsAppConnectedEmail(user: EmailEventData['user'], whatsappData: any) {
  return triggerEmailEvent({
    user,
    event: 'whatsapp_connected',
    data: {
      whatsapp_number: whatsappData.number,
      connected_at: whatsappData.connectedAt
    },
    timestamp: new Date()
  })
}

export async function sendPackagePurchaseEmail(user: EmailEventData['user'], packageData: any) {
  return triggerEmailEvent({
    user,
    event: 'package_purchased',
    data: {
      package_name: packageData.name,
      package_price: packageData.price,
      expiry_date: packageData.expiryDate
    },
    timestamp: new Date()
  })
}

export async function sendPaymentSuccessEmail(user: EmailEventData['user'], paymentData: any) {
  return triggerEmailEvent({
    user,
    event: 'payment_successful',
    data: {
      amount: paymentData.amount,
      transaction_id: paymentData.transactionId,
      payment_method: paymentData.method
    },
    timestamp: new Date()
  })
}

export async function sendSecurityAlertEmail(user: EmailEventData['user'], alertData: any) {
  return triggerEmailEvent({
    user,
    event: 'security_alert',
    data: {
      alert_type: alertData.type,
      ip_address: alertData.ipAddress,
      location: alertData.location,
      timestamp: alertData.timestamp
    },
    timestamp: new Date()
  })
}