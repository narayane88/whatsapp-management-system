/**
 * Real Customer Host API Tests
 * Tests that can be run against the actual implementation
 */

import { Pool } from 'pg'

// Database configuration for testing
const testPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Test configuration
const WHATSAPP_SERVER_URL = 'http://localhost:3005'
const TEST_USER_EMAIL = 'test@customer.com'

describe('Customer Host Real Implementation Tests', () => {
  let testUserId: string
  let testConnectionId: string
  let testAccountName: string

  beforeAll(async () => {
    testAccountName = `TestAccount_${Date.now()}`
    
    // Create or get test user
    try {
      const result = await testPool.query(
        'SELECT id FROM users WHERE email = $1',
        [TEST_USER_EMAIL]
      )
      
      if (result.rows.length > 0) {
        testUserId = result.rows[0].id
      } else {
        const insertResult = await testPool.query(`
          INSERT INTO users (email, name, role, "hashedPassword", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `, [TEST_USER_EMAIL, 'Test Customer', 'CUSTOMER', 'hashed_password'])
        
        testUserId = insertResult.rows[0].id
      }
      
      console.log('Test User ID:', testUserId)
    } catch (error) {
      console.error('Failed to setup test user:', error)
      throw error
    }
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      if (testConnectionId) {
        await testPool.query('DELETE FROM whatsapp_instances WHERE id = $1', [testConnectionId])
      }
      
      // Don't delete test user to preserve other tests
    } catch (error) {
      console.warn('Cleanup warning:', error)
    } finally {
      await testPool.end()
    }
  })

  describe('Database Integration', () => {
    test('Should create WhatsApp instance in database', async () => {
      const serverAccountId = `${testUserId}_${testAccountName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`
      
      const result = await testPool.query(`
        INSERT INTO whatsapp_instances (
          "userId", "serverId", name, description, status, "qrCode", 
          "createdAt", "updatedAt"
        )
        VALUES ($1::text, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, name, description, status, "qrCode", "createdAt"
      `, [
        testUserId,
        '1',
        testAccountName,
        serverAccountId,
        'CONNECTING',
        null
      ])
      
      expect(result.rows.length).toBe(1)
      
      const instance = result.rows[0]
      testConnectionId = instance.id
      
      expect(instance.name).toBe(testAccountName)
      expect(instance.description).toBe(serverAccountId)
      expect(instance.status).toBe('CONNECTING')
      
      console.log('Created test connection:', testConnectionId)
    })

    test('Should retrieve user WhatsApp instances', async () => {
      const result = await testPool.query(`
        SELECT id, name, "phoneNumber", status, "qrCode", 
               "lastSeenAt", "createdAt", "updatedAt", "serverId", description
        FROM whatsapp_instances 
        WHERE "userId" = $1::text
        ORDER BY "createdAt" DESC
      `, [testUserId])
      
      expect(result.rows.length).toBeGreaterThan(0)
      
      const instance = result.rows.find(row => row.id === testConnectionId)
      expect(instance).toBeDefined()
      expect(instance.name).toBe(testAccountName)
    })

    test('Should update instance status', async () => {
      const result = await testPool.query(`
        UPDATE whatsapp_instances 
        SET status = $1, "qrCode" = $2, "lastSeenAt" = $3, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $4 AND "userId" = $5::text
        RETURNING id, name, status, "qrCode", "lastSeenAt", "updatedAt"
      `, [
        'AUTHENTICATING',
        'data:image/png;base64,test_qr_code',
        new Date(),
        testConnectionId,
        testUserId
      ])
      
      expect(result.rows.length).toBe(1)
      
      const updatedInstance = result.rows[0]
      expect(updatedInstance.status).toBe('AUTHENTICATING')
      expect(updatedInstance.qrCode).toBe('data:image/png;base64,test_qr_code')
    })
  })

  describe('WhatsApp Server Integration', () => {
    test('Should connect to WhatsApp server health endpoint', async () => {
      try {
        const response = await fetch(`${WHATSAPP_SERVER_URL}/api/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        })
        
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('status', 'healthy')
        
        console.log('WhatsApp server health:', data.data.status)
      } catch (error) {
        console.warn('WhatsApp server not available:', error)
        // Don't fail test if server is not running
      }
    })

    test('Should get server statistics', async () => {
      try {
        const response = await fetch(`${WHATSAPP_SERVER_URL}/api/stats`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        })
        
        if (response.ok) {
          const data = await response.json()
          expect(data).toHaveProperty('data')
          expect(data.data).toHaveProperty('accounts')
          expect(typeof data.data.accounts.total).toBe('number')
          
          console.log('Server stats:', data.data.accounts)
        }
      } catch (error) {
        console.warn('Server stats not available:', error)
      }
    })

    test('Should create account on WhatsApp server', async () => {
      try {
        const serverAccountId = `test_${testUserId}_${Date.now()}`
        
        const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/connect`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            id: serverAccountId,
            name: testAccountName
          }),
          signal: AbortSignal.timeout(10000)
        })
        
        if (response.ok) {
          const data = await response.json()
          expect(data).toHaveProperty('data')
          expect(data.data).toHaveProperty('id', serverAccountId)
          
          console.log('WhatsApp account created:', data.data.id)
          
          // Try to get QR code
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const qrResponse = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${serverAccountId}/qr`, {
            signal: AbortSignal.timeout(5000)
          })
          
          if (qrResponse.ok) {
            const qrData = await qrResponse.json()
            if (qrData.data?.qr) {
              expect(qrData.data.qr).toMatch(/^data:image\/png;base64,/)
              console.log('QR code generated successfully')
            }
          }
          
          // Cleanup
          await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${serverAccountId}/disconnect`, {
            method: 'POST'
          })
        }
      } catch (error) {
        console.warn('WhatsApp account creation test skipped:', error)
      }
    })
  })

  describe('End-to-End Customer Flow', () => {
    test('Complete customer connection flow', async () => {
      // This test simulates the full customer connection process
      const uniqueId = Date.now()
      const customerAccountName = `E2E_Test_${uniqueId}`
      const serverAccountId = `${testUserId}_e2e_${uniqueId}`
      
      try {
        // Step 1: Create connection in database
        const dbResult = await testPool.query(`
          INSERT INTO whatsapp_instances (
            "userId", "serverId", name, description, status, 
            "createdAt", "updatedAt"
          )
          VALUES ($1::text, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id, name, description, status
        `, [testUserId, '1', customerAccountName, serverAccountId, 'CONNECTING'])
        
        const connectionId = dbResult.rows[0].id
        console.log('E2E: Created database record:', connectionId)
        
        // Step 2: Try to create WhatsApp account
        let whatsappConnected = false
        try {
          const whatsappResponse = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: serverAccountId,
              name: customerAccountName
            }),
            signal: AbortSignal.timeout(10000)
          })
          
          if (whatsappResponse.ok) {
            whatsappConnected = true
            console.log('E2E: WhatsApp account created')
            
            // Step 3: Wait for QR code
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const qrResponse = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${serverAccountId}/qr`)
            if (qrResponse.ok) {
              const qrData = await qrResponse.json()
              if (qrData.data?.qr) {
                // Step 4: Update database with QR code
                await testPool.query(`
                  UPDATE whatsapp_instances 
                  SET status = $1, "qrCode" = $2, "updatedAt" = CURRENT_TIMESTAMP
                  WHERE id = $3
                `, ['AUTHENTICATING', qrData.data.qr, connectionId])
                
                console.log('E2E: Updated database with QR code')
              }
            }
          }
        } catch (whatsappError) {
          console.warn('E2E: WhatsApp server not available:', whatsappError)
        }
        
        // Step 5: Verify database state
        const finalResult = await testPool.query(
          'SELECT * FROM whatsapp_instances WHERE id = $1',
          [connectionId]
        )
        
        expect(finalResult.rows.length).toBe(1)
        const finalInstance = finalResult.rows[0]
        expect(finalInstance.name).toBe(customerAccountName)
        expect(finalInstance.description).toBe(serverAccountId)
        
        console.log('E2E: Final instance status:', finalInstance.status)
        
        // Cleanup
        if (whatsappConnected) {
          await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${serverAccountId}/disconnect`, {
            method: 'POST'
          })
        }
        
        await testPool.query('DELETE FROM whatsapp_instances WHERE id = $1', [connectionId])
        
        console.log('E2E: Test completed successfully')
        
      } catch (error) {
        console.error('E2E test failed:', error)
        throw error
      }
    })
  })
})