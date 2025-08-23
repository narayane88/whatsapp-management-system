import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const EMAIL_SETTINGS_FILE = path.join(process.cwd(), 'config', 'email-settings.json')

interface EmailSettings {
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
}

async function ensureDirectories() {
  try {
    await fs.mkdir(path.dirname(EMAIL_SETTINGS_FILE), { recursive: true })
  } catch (error) {
    // Directory already exists
  }
}

async function getEmailSettings(): Promise<EmailSettings> {
  const defaultSettings: EmailSettings = {
    provider: 'custom',
    smtp: {
      host: '',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: ''
      }
    },
    from: {
      name: '',
      email: ''
    }
  }

  try {
    await ensureDirectories()
    const data = await fs.readFile(EMAIL_SETTINGS_FILE, 'utf8')
    const parsed = JSON.parse(data)
    
    return {
      provider: parsed.provider || defaultSettings.provider,
      smtp: {
        host: parsed.smtp?.host || defaultSettings.smtp.host,
        port: parsed.smtp?.port || defaultSettings.smtp.port,
        secure: parsed.smtp?.secure || defaultSettings.smtp.secure,
        auth: {
          user: parsed.smtp?.auth?.user || defaultSettings.smtp.auth.user,
          pass: parsed.smtp?.auth?.pass || defaultSettings.smtp.auth.pass
        }
      },
      from: {
        name: parsed.from?.name || defaultSettings.from.name,
        email: parsed.from?.email || defaultSettings.from.email
      }
    }
  } catch (error) {
    await saveEmailSettings(defaultSettings)
    return defaultSettings
  }
}

async function saveEmailSettings(settings: EmailSettings) {
  await ensureDirectories()
  await fs.writeFile(EMAIL_SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

export async function GET() {
  try {
    const settings = await getEmailSettings()
    
    // Remove sensitive password from response
    const sanitizedSettings = {
      ...settings,
      smtp: {
        ...settings.smtp,
        auth: {
          ...settings.smtp.auth,
          pass: settings.smtp.auth.pass ? '***' : ''
        }
      }
    }

    return NextResponse.json(sanitizedSettings)
  } catch (error) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, smtp, from } = body

    if (!provider || !smtp || !from) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const currentSettings = await getEmailSettings()
    
    const newSettings: EmailSettings = {
      provider,
      smtp: {
        ...smtp,
        auth: {
          user: smtp.auth.user,
          pass: smtp.auth.pass === '***' ? currentSettings.smtp.auth.pass : smtp.auth.pass
        }
      },
      from
    }

    await saveEmailSettings(newSettings)

    return NextResponse.json({ message: 'Email settings saved successfully' })
  } catch (error) {
    console.error('Error saving email settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}