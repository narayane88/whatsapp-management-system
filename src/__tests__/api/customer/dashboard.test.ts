import { NextRequest } from 'next/server'
import { GET } from '@/app/api/customer/dashboard/route'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'

// Mock dependencies
jest.mock('next-auth/next')
jest.mock('pg')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPool = {
  query: jest.fn()
}
;(Pool as jest.Mock).mockImplementation(() => mockPool)

describe('/api/customer/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost/api/customer/dashboard')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 403 when user is not a customer', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: {
        email: 'admin@test.com',
        role: 'ADMIN'
      }
    })

    const request = new NextRequest('http://localhost/api/customer/dashboard')
    const response = await GET(request)

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('Access denied')
  })

  it('returns 404 when user not found in database', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: {
        email: 'customer@test.com',
        role: 'CUSTOMER'
      }
    })

    mockPool.query.mockResolvedValueOnce({
      rows: [] // No user found
    })

    const request = new NextRequest('http://localhost/api/customer/dashboard')
    const response = await GET(request)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('User not found')
  })

  it('returns dashboard statistics successfully', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: {
        email: 'customer@test.com',
        role: 'CUSTOMER'
      }
    })

    // Mock user lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'user123' }]
    })

    // Mock all dashboard queries
    const mockQueries = [
      Promise.resolve({ rows: [{ count: '2' }] }), // instances
      Promise.resolve({ rows: [{ count: '150' }] }), // contacts  
      Promise.resolve({ rows: [{ count: '1250' }] }), // messages
      Promise.resolve({ rows: [{ count: '1' }] }), // api keys
      Promise.resolve({ rows: [{ count: '5' }] }), // queue
      Promise.resolve({ 
        rows: [{
          name: 'Professional',
          endDate: '2024-12-31T00:00:00Z',
          isActive: true
        }]
      }) // package
    ]

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'user123' }] }) // User lookup
      .mockImplementation(() => mockQueries.shift())

    const request = new NextRequest('http://localhost/api/customer/dashboard')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data).toEqual({
      whatsappInstances: 2,
      totalContacts: 150,
      messagesSent: 1250,
      apiKeys: 1,
      queuedMessages: 5,
      activePackage: {
        name: 'Professional',
        expiryDate: '2024-12-31T00:00:00Z',
        status: 'Active'
      }
    })
  })

  it('handles expired package correctly', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: {
        email: 'customer@test.com',
        role: 'CUSTOMER'
      }
    })

    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'user123' }]
    })

    // Mock queries with expired package
    const pastDate = new Date(Date.now() - 86400000).toISOString() // Yesterday
    const mockQueries = [
      Promise.resolve({ rows: [{ count: '1' }] }), // instances
      Promise.resolve({ rows: [{ count: '50' }] }), // contacts  
      Promise.resolve({ rows: [{ count: '100' }] }), // messages
      Promise.resolve({ rows: [{ count: '1' }] }), // api keys
      Promise.resolve({ rows: [{ count: '0' }] }), // queue
      Promise.resolve({ 
        rows: [{
          name: 'Basic',
          endDate: pastDate,
          isActive: true
        }]
      }) // expired package
    ]

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'user123' }] })
      .mockImplementation(() => mockQueries.shift())

    const request = new NextRequest('http://localhost/api/customer/dashboard')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.activePackage.status).toBe('Expired')
  })

  it('handles null/zero counts properly', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: {
        email: 'customer@test.com',
        role: 'CUSTOMER'
      }
    })

    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'user123' }]
    })

    // Mock queries with null/empty results
    const mockQueries = [
      Promise.resolve({ rows: [] }), // instances - empty
      Promise.resolve({ rows: [{ count: null }] }), // contacts - null
      Promise.resolve({ rows: [{ count: '0' }] }), // messages - zero
      Promise.resolve({ rows: [{ count: '0' }] }), // api keys
      Promise.resolve({ rows: [{ count: '0' }] }), // queue
      Promise.resolve({ rows: [] }) // no package
    ]

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'user123' }] })
      .mockImplementation(() => mockQueries.shift())

    const request = new NextRequest('http://localhost/api/customer/dashboard')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.whatsappInstances).toBe(0)
    expect(data.totalContacts).toBe(0)
    expect(data.messagesSent).toBe(0)
    expect(data.activePackage).toBe(null)
  })

  it('handles database errors gracefully', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: {
        email: 'customer@test.com',
        role: 'CUSTOMER'
      }
    })

    mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost/api/customer/dashboard')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    
    expect(data.error).toBe('Internal server error')
    expect(data.details).toBe('Database connection failed')
  })

  it('calls database with correct user ID', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: {
        email: 'customer@test.com',
        role: 'CUSTOMER'
      }
    })

    const userId = 'test-user-123'
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: userId }]
    })

    // Mock all subsequent queries
    const mockQueries = Array(6).fill(Promise.resolve({ rows: [{ count: '0' }] }))
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: userId }] })
      .mockImplementation(() => mockQueries.shift())

    const request = new NextRequest('http://localhost/api/customer/dashboard')
    await GET(request)

    // Verify user lookup call
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT id FROM users WHERE email = $1',
      ['customer@test.com']
    )

    // Verify all subsequent queries use the correct userId
    const queryCallsWithUserId = mockPool.query.mock.calls.slice(1)
    queryCallsWithUserId.forEach(call => {
      const [query, params] = call
      if (params && params.length > 0) {
        expect(params[0]).toBe(userId)
      }
    })
  })
})