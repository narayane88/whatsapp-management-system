import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'

const EMAIL_SETTINGS_FILE = path.join(process.cwd(), 'config', 'email-settings.json')

async function getEmailSettings() {
  try {
    const data = await fs.readFile(EMAIL_SETTINGS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    throw new Error('Email settings not configured')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail, subject = 'Test Email', content = 'This is a test email from your WhatsApp management system.', templateName } = body

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email address is required' }, { status: 400 })
    }

    const settings = await getEmailSettings()
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp.host,
      port: settings.smtp.port,
      secure: settings.smtp.secure,
      auth: {
        user: settings.smtp.auth.user,
        pass: settings.smtp.auth.pass,
      },
    })

    // Prepare email content
    const emailSubject = templateName ? `[Template Test] ${subject}` : subject
    const emailContent = templateName 
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 8px 0; color: #1e40af;">📧 Template Test Email</h3>
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              Template: <strong>${templateName}</strong><br/>
              This email was generated with sample data for testing purposes.
            </p>
          </div>
          <div>
            ${content}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            This is a test email sent from your WhatsApp Management System at ${new Date().toLocaleString()}.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Test Email - WhatsApp Management System</h2>
          <p>${content}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is a test email sent from your WhatsApp management system at ${new Date().toLocaleString()}.
          </p>
        </div>
      `

    // Send test email
    const info = await transporter.sendMail({
      from: `"${settings.from.name}" <${settings.from.email}>`,
      to: testEmail,
      subject: emailSubject,
      html: emailContent,
    })

    return NextResponse.json({ 
      message: 'Test email sent successfully',
      messageId: info.messageId,
      templateName: templateName || 'Custom Test'
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}