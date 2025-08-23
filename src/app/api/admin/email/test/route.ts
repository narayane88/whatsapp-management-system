import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testEmail, subject = 'Test Email', content = 'This is a test email from your WhatsApp management system.' } = body

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

    // Send test email
    const info = await transporter.sendMail({
      from: `"${settings.from.name}" <${settings.from.email}>`,
      to: testEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Test Email - WhatsApp Management System</h2>
          <p>${content}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is a test email sent from your WhatsApp management system at ${new Date().toLocaleString()}.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ 
      message: 'Test email sent successfully',
      messageId: info.messageId
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}