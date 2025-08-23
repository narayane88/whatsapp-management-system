import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// External WhatsApp server configuration
const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || 'http://localhost:3005'

// POST /api/admin/servers/actions - Perform WhatsApp account actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serverId, action, accountId } = body

    if (!action) {
      return NextResponse.json({ 
        error: 'Action is required' 
      }, { status: 400 })
    }

    const validActions = ['connect', 'disconnect', 'getQR', 'getStatus']
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be one of: connect, disconnect, getQR, getStatus' 
      }, { status: 400 })
    }

    let response
    let result

    try {
      switch (action) {
        case 'connect':
          if (!accountId) {
            return NextResponse.json({ error: 'Account ID required for connect action' }, { status: 400 })
          }
          response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: accountId, name: accountId })
          })
          break

        case 'disconnect':
          if (!accountId) {
            return NextResponse.json({ error: 'Account ID required for disconnect action' }, { status: 400 })
          }
          response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${accountId}/disconnect`, {
            method: 'DELETE'
          })
          break

        case 'getQR':
          if (!accountId) {
            return NextResponse.json({ error: 'Account ID required for getQR action' }, { status: 400 })
          }
          response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${accountId}/qr`)
          break

        case 'getStatus':
          if (!accountId) {
            return NextResponse.json({ error: 'Account ID required for getStatus action' }, { status: 400 })
          }
          response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${accountId}/status`)
          break

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json({ 
          error: errorData.message || `Failed to ${action}`,
          details: errorData
        }, { status: response.status })
      }

      result = await response.json()

      return NextResponse.json({
        message: `${action} completed successfully`,
        action,
        data: result.data
      })
    } catch (fetchError) {
      console.error(`WhatsApp ${action} action failed:`, fetchError)
      return NextResponse.json({ 
        error: `WhatsApp server connection failed`,
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('WhatsApp actions API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/admin/servers/actions - Get WhatsApp server health and accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Get server health and accounts
      const [healthResponse, accountsResponse] = await Promise.all([
        fetch(`${WHATSAPP_SERVER_URL}/api/health`),
        fetch(`${WHATSAPP_SERVER_URL}/api/accounts`)
      ])

      if (!healthResponse.ok || !accountsResponse.ok) {
        throw new Error('Failed to fetch server status')
      }

      const health = await healthResponse.json()
      const accounts = await accountsResponse.json()

      const availableActions = ['connect', 'disconnect', 'getQR', 'getStatus']

      return NextResponse.json({
        serverStatus: health.data.status,
        accounts: accounts.data.accounts,
        totalAccounts: accounts.data.total,
        availableActions,
        actionDescriptions: {
          connect: 'Connect a new WhatsApp account',
          disconnect: 'Disconnect an existing WhatsApp account',
          getQR: 'Get QR code for account connection',
          getStatus: 'Check account connection status'
        }
      })
    } catch (fetchError) {
      return NextResponse.json({ 
        error: 'WhatsApp server is not accessible',
        serverStatus: 'offline',
        accounts: [],
        totalAccounts: 0,
        availableActions: [],
        details: fetchError instanceof Error ? fetchError.message : 'Connection failed'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('WhatsApp actions GET API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}