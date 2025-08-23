import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

const pool = new Pool(getDatabaseConfig())

// Update recipient name from WhatsApp
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { recipientNumber, deviceName, messageId } = body

    if (!recipientNumber || !deviceName) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipientNumber, deviceName' 
      }, { status: 400 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user updating contact for customer ID: ${userId}`)
    }

    // Try to get contact name from Baileys server
    try {
      const optimalServer = await whatsappServerManager.getOptimalServer()
      if (!optimalServer) {
        throw new Error('No active WhatsApp servers available')
      }

      const response = await fetch(`${optimalServer.url}/api/accounts/${deviceName}/contacts/${recipientNumber}`)
      
      if (response.ok) {
        const contactData = await response.json()
        
        if (contactData.success && contactData.data.exists) {
          // Contact exists on WhatsApp, update name if available
          const contactName = contactData.data.name === 'WhatsApp User' 
            ? `WhatsApp User (${recipientNumber})`
            : contactData.data.name

          if (contactName && contactName !== 'WhatsApp User') {
            // Update all messages from this recipient
            const updateResult = await pool.query(`
              UPDATE sent_messages 
              SET "recipientName" = $1, "updatedAt" = NOW()
              WHERE "userId" = $2 
                AND "recipientNumber" = $3
                AND ("recipientName" IS NULL OR "recipientName" = '' OR "recipientName" = 'Unknown')
              RETURNING id
            `, [contactName, userId, recipientNumber])

            return NextResponse.json({
              success: true,
              data: {
                recipientNumber,
                recipientName: contactName,
                updatedMessages: updateResult.rowCount,
                contactExists: true
              },
              message: `Updated ${updateResult.rowCount} messages with contact name`
            })
          } else {
            // Contact exists but no name available, just mark as WhatsApp user
            const updateResult = await pool.query(`
              UPDATE sent_messages 
              SET "recipientName" = $1, "updatedAt" = NOW()
              WHERE "userId" = $2 
                AND "recipientNumber" = $3
                AND ("recipientName" IS NULL OR "recipientName" = '')
              RETURNING id
            `, [`WhatsApp User (${recipientNumber})`, userId, recipientNumber])

            return NextResponse.json({
              success: true,
              data: {
                recipientNumber,
                recipientName: `WhatsApp User (${recipientNumber})`,
                updatedMessages: updateResult.rowCount,
                contactExists: true
              },
              message: `Updated ${updateResult.rowCount} messages - contact exists on WhatsApp`
            })
          }
        } else {
          // Contact doesn't exist on WhatsApp
          return NextResponse.json({
            success: true,
            data: {
              recipientNumber,
              recipientName: null,
              updatedMessages: 0,
              contactExists: false
            },
            message: 'Contact not found on WhatsApp'
          })
        }
      } else {
        throw new Error('Failed to contact Baileys server')
      }
    } catch (whatsappError) {
      console.error('Error fetching from WhatsApp:', whatsappError)
      
      // Fallback: just mark as "Unknown Contact" if we can't reach WhatsApp
      const updateResult = await pool.query(`
        UPDATE sent_messages 
        SET "recipientName" = $1, "updatedAt" = NOW()
        WHERE "userId" = $2 
          AND "recipientNumber" = $3
          AND ("recipientName" IS NULL OR "recipientName" = '')
        RETURNING id
      `, [`Unknown Contact (${recipientNumber})`, userId, recipientNumber])

      return NextResponse.json({
        success: true,
        data: {
          recipientNumber,
          recipientName: `Unknown Contact (${recipientNumber})`,
          updatedMessages: updateResult.rowCount,
          contactExists: null,
          warning: 'Could not check WhatsApp status'
        },
        message: `Updated ${updateResult.rowCount} messages (fallback)`
      })
    }

  } catch (error) {
    console.error('Contact update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Bulk update contact names for all recipients
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user bulk updating contacts for customer ID: ${userId}`)
    }

    // Get all unique recipient numbers that need name updates
    const recipientsResult = await pool.query(`
      SELECT DISTINCT sm."recipientNumber", sm."deviceName"
      FROM sent_messages sm
      WHERE sm."userId" = $1 
        AND (sm."recipientName" IS NULL OR sm."recipientName" = '' OR sm."recipientName" = 'Unknown')
      LIMIT 50
    `, [userId])

    const recipients = recipientsResult.rows
    let updatedCount = 0
    const results = []

    const optimalServer = await whatsappServerManager.getOptimalServer()
    if (!optimalServer) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active WhatsApp servers available',
        updated: 0
      })
    }

    for (const recipient of recipients) {
      try {
        const response = await fetch(`${optimalServer.url}/api/accounts/${recipient.deviceName}/contacts/${recipient.recipientNumber}`)
        
        if (response.ok) {
          const contactData = await response.json()
          
          if (contactData.success && contactData.data.exists) {
            const contactName = contactData.data.name === 'WhatsApp User' 
              ? `WhatsApp User (${recipient.recipientNumber})`
              : contactData.data.name || `WhatsApp User (${recipient.recipientNumber})`

            // Update messages for this recipient
            const updateResult = await pool.query(`
              UPDATE sent_messages 
              SET "recipientName" = $1, "updatedAt" = NOW()
              WHERE "userId" = $2 
                AND "recipientNumber" = $3
                AND ("recipientName" IS NULL OR "recipientName" = '' OR "recipientName" = 'Unknown')
            `, [contactName, userId, recipient.recipientNumber])

            if (updateResult.rowCount && updateResult.rowCount > 0) {
              updatedCount += updateResult.rowCount
              results.push({
                recipientNumber: recipient.recipientNumber,
                recipientName: contactName,
                updatedMessages: updateResult.rowCount,
                status: 'success'
              })
            }
          }
        }
        
        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error updating contact ${recipient.recipientNumber}:`, error)
        results.push({
          recipientNumber: recipient.recipientNumber,
          recipientName: null,
          updatedMessages: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRecipients: recipients.length,
        totalUpdatedMessages: updatedCount,
        results
      },
      message: `Bulk update completed: ${updatedCount} messages updated across ${recipients.length} recipients`
    })

  } catch (error) {
    console.error('Bulk contact update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}