import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

const TEMPLATES_DIR = path.join(process.cwd(), 'config', 'email-templates')

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'html' | 'text'
  createdAt: string
  updatedAt: string
}

async function ensureTemplatesDir() {
  try {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true })
  } catch (error) {
    // Directory already exists
  }
}

async function getTemplates(): Promise<EmailTemplate[]> {
  try {
    await ensureTemplatesDir()
    const files = await fs.readdir(TEMPLATES_DIR)
    const templates: EmailTemplate[] = []

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(TEMPLATES_DIR, file)
          const data = await fs.readFile(filePath, 'utf8')
          const template = JSON.parse(data)
          templates.push(template)
        } catch (error) {
          console.error(`Error reading template ${file}:`, error)
        }
      }
    }

    return templates.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (error) {
    console.error('Error fetching templates:', error)
    return []
  }
}

async function saveTemplate(template: EmailTemplate) {
  await ensureTemplatesDir()
  const filePath = path.join(TEMPLATES_DIR, `${template.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(template, null, 2))
}

async function deleteTemplate(templateId: string) {
  const filePath = path.join(TEMPLATES_DIR, `${templateId}.json`)
  await fs.unlink(filePath)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await getTemplates()
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subject, content, type = 'html' } = body

    if (!name || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const template: EmailTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      subject,
      content,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await saveTemplate(template)

    return NextResponse.json({ message: 'Template saved successfully', template })
  } catch (error) {
    console.error('Error saving email template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, subject, content, type } = body

    if (!id || !name || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get existing template to preserve creation date
    const templates = await getTemplates()
    const existingTemplate = templates.find(t => t.id === id)
    
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const updatedTemplate: EmailTemplate = {
      ...existingTemplate,
      name,
      subject,
      content,
      type,
      updatedAt: new Date().toISOString()
    }

    await saveTemplate(updatedTemplate)

    return NextResponse.json({ message: 'Template updated successfully', template: updatedTemplate })
  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    await deleteTemplate(templateId)

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}