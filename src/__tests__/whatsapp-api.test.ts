/**
 * Unit Tests for WhatsApp API (localhost:3005)
 * Tests the real WhatsApp Business API endpoints
 */

const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || 'http://localhost:3005'

describe('WhatsApp API Integration Tests', () => {
  let testAccountId: string
  
  beforeAll(() => {
    testAccountId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`
  })

  describe('Health Check', () => {
    test('GET /api/health should return server health status', async () => {
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/health`)
      
      expect(response.status).toBe(200)
      
      const healthData = await response.json()
      expect(healthData).toHaveProperty('data')
      expect(healthData.data).toHaveProperty('status')
      expect(healthData.data).toHaveProperty('uptime')
      expect(healthData.data).toHaveProperty('timestamp')
      expect(healthData.data).toHaveProperty('version')
      
      // Health status should be 'healthy'
      expect(healthData.data.status).toBe('healthy')
      expect(typeof healthData.data.uptime).toBe('number')
      expect(typeof healthData.data.timestamp).toBe('string')
    })
  })

  describe('Server Statistics', () => {
    test('GET /api/stats should return server statistics', async () => {
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/stats`)
      
      expect(response.status).toBe(200)
      
      const statsData = await response.json()
      expect(statsData).toHaveProperty('data')
      expect(statsData.data).toHaveProperty('accounts')
      expect(statsData.data.accounts).toHaveProperty('total')
      expect(statsData.data.accounts).toHaveProperty('connected')
      expect(statsData.data.accounts).toHaveProperty('disconnected')
      
      expect(typeof statsData.data.accounts.total).toBe('number')
      expect(typeof statsData.data.accounts.connected).toBe('number')
      expect(typeof statsData.data.accounts.disconnected).toBe('number')
    })
  })

  describe('Account Management', () => {
    test('GET /api/accounts should return accounts list', async () => {
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts`)
      
      expect(response.status).toBe(200)
      
      const accountsData = await response.json()
      expect(accountsData).toHaveProperty('data')
      expect(Array.isArray(accountsData.data)).toBe(true)
    })

    test('POST /api/accounts/connect should create new WhatsApp account', async () => {
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: testAccountId,
          name: 'Test Account'
        })
      })
      
      expect(response.status).toBe(200)
      
      const connectData = await response.json()
      expect(connectData).toHaveProperty('data')
      expect(connectData.data).toHaveProperty('id', testAccountId)
      expect(connectData.data).toHaveProperty('status')
      
      // Account should be in connecting/authenticating state
      expect(['CONNECTING', 'AUTHENTICATING', 'DISCONNECTED']).toContain(connectData.data.status)
    })

    test('GET /api/accounts/{id}/status should return account status', async () => {
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${testAccountId}/status`)
      
      expect(response.status).toBe(200)
      
      const statusData = await response.json()
      expect(statusData).toHaveProperty('data')
      expect(statusData.data).toHaveProperty('id', testAccountId)
      expect(statusData.data).toHaveProperty('status')
      
      // Status should be one of valid WhatsApp states
      const validStatuses = ['CONNECTING', 'CONNECTED', 'DISCONNECTED', 'AUTHENTICATING', 'ERROR']
      expect(validStatuses).toContain(statusData.data.status)
    })

    test('GET /api/accounts/{id}/qr should return QR code when available', async () => {
      // Wait a moment for QR code generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${testAccountId}/qr`)
      
      if (response.status === 200) {
        const qrData = await response.json()
        expect(qrData).toHaveProperty('data')
        
        if (qrData.data && qrData.data.qr) {
          expect(qrData.data.qr).toMatch(/^data:image\/png;base64,/)
          expect(qrData.data.qr.length).toBeGreaterThan(100)
        }
      } else {
        // QR code might not be available yet, which is acceptable
        expect([404, 400]).toContain(response.status)
      }
    })

    test('GET /api/accounts/{id}/stats should return account statistics', async () => {
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${testAccountId}/stats`)
      
      if (response.status === 200) {
        const statsData = await response.json()
        expect(statsData).toHaveProperty('data')
        expect(statsData.data).toHaveProperty('messageCount')
        expect(typeof statsData.data.messageCount).toBe('number')
      } else {
        // Account might not have stats yet, which is acceptable
        expect([404, 400]).toContain(response.status)
      }
    })
  })

  describe('Account Lifecycle', () => {
    test('POST /api/accounts/{id}/disconnect should disconnect account', async () => {
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${testAccountId}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      expect([200, 404]).toContain(response.status)
      
      if (response.status === 200) {
        const disconnectData = await response.json()
        expect(disconnectData).toHaveProperty('data')
        expect(disconnectData.data).toHaveProperty('id', testAccountId)
      }
    })
  })

  describe('Error Handling', () => {
    test('Invalid account ID should return 404', async () => {
      const invalidId = 'invalid_account_id_' + Date.now()
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${invalidId}/status`)
      
      expect(response.status).toBe(404)
    })

    test('Malformed requests should return 400', async () => {
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
        })
      })
      
      expect(response.status).toBe(400)
    })
  })

  describe('Performance Tests', () => {
    test('Health check should respond quickly', async () => {
      const startTime = Date.now()
      const response = await fetch(`${WHATSAPP_SERVER_URL}/api/health`)
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000) // Should respond within 1 second
    })

    test('Multiple concurrent requests should be handled', async () => {
      const promises = Array.from({ length: 5 }, () => 
        fetch(`${WHATSAPP_SERVER_URL}/api/health`)
      )
      
      const responses = await Promise.all(promises)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})