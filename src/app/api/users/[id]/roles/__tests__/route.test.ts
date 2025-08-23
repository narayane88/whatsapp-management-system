import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { GET, PUT } from '../route'
import prisma from '@/lib/prisma'

// Mock NextAuth
jest.mock('next-auth/next')
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userRole: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock role-based permission checker
const mockCheckRolePermissions = jest.fn()
jest.mock('@/lib/auth/permissions', () => ({
  checkRolePermissions: mockCheckRolePermissions,
}))

describe('Users Roles API Route', () => {
  const mockRequest = (method: string = 'GET', body?: any) => {
    const request = new NextRequest(`http://localhost:3000/api/users/123/roles`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return request
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/users/[id]/roles', () => {
    describe('Authentication & Authorization', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const request = mockRequest()
        const response = await GET(request, { params: { id: '123' } })

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('Unauthorized')
      })

      it('returns 403 when user lacks required permissions', async () => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'employee@example.com',
            role: 'EMPLOYEE',
          },
        })

        mockCheckRolePermissions.mockReturnValue(false)

        const request = mockRequest()
        const response = await GET(request, { params: { id: '123' } })

        expect(response.status).toBe(403)
        const data = await response.json()
        expect(data.error).toBe('Insufficient permissions')
        expect(mockCheckRolePermissions).toHaveBeenCalledWith('EMPLOYEE', ['users.roles.read'])
      })

      it('allows ADMIN users to read user roles', async () => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        })

        mockCheckRolePermissions.mockReturnValue(true)

        const mockUser = {
          id: '123',
          email: 'user@example.com',
          roles: [
            { role: { id: 'role1', name: 'EMPLOYEE', permissions: [] } },
          ],
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

        const request = mockRequest()
        const response = await GET(request, { params: { id: '123' } })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.roles).toBeDefined()
        expect(mockCheckRolePermissions).toHaveBeenCalledWith('ADMIN', ['users.roles.read'])
      })

      it('allows OWNER users to read any user roles', async () => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'owner@example.com',
            role: 'OWNER',
          },
        })

        mockCheckRolePermissions.mockReturnValue(true)

        const mockUser = {
          id: '123',
          email: 'user@example.com',
          roles: [
            { role: { id: 'role1', name: 'ADMIN', permissions: [] } },
          ],
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

        const request = mockRequest()
        const response = await GET(request, { params: { id: '123' } })

        expect(response.status).toBe(200)
        expect(mockCheckRolePermissions).toHaveBeenCalledWith('OWNER', ['users.roles.read'])
      })
    })

    describe('Data Retrieval', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        })
        mockCheckRolePermissions.mockReturnValue(true)
      })

      it('returns user roles successfully', async () => {
        const mockUser = {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
          roles: [
            {
              role: {
                id: 'role1',
                name: 'EMPLOYEE',
                description: 'Employee role',
                permissions: [
                  { permission: { name: 'users.page.access', description: 'Access users page' } },
                ],
              },
            },
            {
              role: {
                id: 'role2',
                name: 'SUBDEALER',
                description: 'Subdealer role',
                permissions: [
                  { permission: { name: 'customers.page.access', description: 'Access customers page' } },
                ],
              },
            },
          ],
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

        const request = mockRequest()
        const response = await GET(request, { params: { id: '123' } })

        expect(response.status).toBe(200)
        const data = await response.json()

        expect(data).toEqual({
          userId: '123',
          roles: [
            {
              id: 'role1',
              name: 'EMPLOYEE',
              description: 'Employee role',
              permissions: ['users.page.access'],
            },
            {
              id: 'role2',
              name: 'SUBDEALER',
              description: 'Subdealer role',
              permissions: ['customers.page.access'],
            },
          ],
        })

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: '123' },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('returns 404 when user is not found', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const request = mockRequest()
        const response = await GET(request, { params: { id: '999' } })

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.error).toBe('User not found')
      })

      it('returns empty roles array when user has no roles', async () => {
        const mockUser = {
          id: '123',
          email: 'user@example.com',
          roles: [],
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

        const request = mockRequest()
        const response = await GET(request, { params: { id: '123' } })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.roles).toEqual([])
      })
    })

    describe('Error Handling', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        })
        mockCheckRolePermissions.mockReturnValue(true)
      })

      it('handles database errors gracefully', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

        const request = mockRequest()
        const response = await GET(request, { params: { id: '123' } })

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toBe('Internal server error')
      })

      it('handles invalid user ID format', async () => {
        const request = mockRequest()
        const response = await GET(request, { params: { id: '' } })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Invalid user ID')
      })
    })
  })

  describe('PUT /api/users/[id]/roles', () => {
    describe('Authentication & Authorization', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const request = mockRequest('PUT', { roleIds: ['role1'] })
        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('Unauthorized')
      })

      it('returns 403 when user lacks required permissions', async () => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'employee@example.com',
            role: 'EMPLOYEE',
          },
        })

        mockCheckRolePermissions.mockReturnValue(false)

        const request = mockRequest('PUT', { roleIds: ['role1'] })
        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(403)
        const data = await response.json()
        expect(data.error).toBe('Insufficient permissions')
        expect(mockCheckRolePermissions).toHaveBeenCalledWith('EMPLOYEE', ['users.roles.update'])
      })

      it('allows OWNER users to update any user roles', async () => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'owner@example.com',
            role: 'OWNER',
          },
        })

        mockCheckRolePermissions.mockReturnValue(true)

        // Mock successful transaction
        ;(prisma.$transaction as jest.Mock).mockResolvedValue([
          { count: 1 }, // deleteMany result
          { count: 1 }, // createMany result
        ])

        const mockUser = {
          id: '123',
          email: 'user@example.com',
          roles: [
            { role: { id: 'role1', name: 'ADMIN', permissions: [] } },
          ],
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

        const request = mockRequest('PUT', { roleIds: ['role1'] })
        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(200)
        expect(mockCheckRolePermissions).toHaveBeenCalledWith('OWNER', ['users.roles.update'])
      })
    })

    describe('Role Assignment', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        })
        mockCheckRolePermissions.mockReturnValue(true)
      })

      it('updates user roles successfully', async () => {
        const roleIds = ['role1', 'role2']

        // Mock successful transaction
        ;(prisma.$transaction as jest.Mock).mockResolvedValue([
          { count: 2 }, // deleteMany result
          { count: 2 }, // createMany result
        ])

        const mockUpdatedUser = {
          id: '123',
          email: 'user@example.com',
          roles: [
            { role: { id: 'role1', name: 'EMPLOYEE', permissions: [] } },
            { role: { id: 'role2', name: 'SUBDEALER', permissions: [] } },
          ],
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUpdatedUser)

        const request = mockRequest('PUT', { roleIds })
        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(200)
        const data = await response.json()

        expect(data.message).toBe('User roles updated successfully')
        expect(data.roles).toHaveLength(2)

        // Verify transaction was called with correct operations
        expect(prisma.$transaction).toHaveBeenCalledWith([
          prisma.userRole.deleteMany({ where: { userId: '123' } }),
          prisma.userRole.createMany({
            data: roleIds.map(roleId => ({
              userId: '123',
              roleId,
            })),
          }),
        ])
      })

      it('handles empty roles array (removes all roles)', async () => {
        ;(prisma.$transaction as jest.Mock).mockResolvedValue([
          { count: 1 }, // deleteMany result
          { count: 0 }, // createMany result
        ])

        const mockUser = {
          id: '123',
          email: 'user@example.com',
          roles: [],
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

        const request = mockRequest('PUT', { roleIds: [] })
        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.roles).toEqual([])

        expect(prisma.$transaction).toHaveBeenCalledWith([
          prisma.userRole.deleteMany({ where: { userId: '123' } }),
          prisma.userRole.createMany({
            data: [],
          }),
        ])
      })

      it('validates role existence before assignment', async () => {
        const request = mockRequest('PUT', { roleIds: ['invalid-role'] })
        
        // Mock role validation failure
        ;(prisma.role.findMany as jest.Mock).mockResolvedValue([])

        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('One or more invalid role IDs provided')
      })
    })

    describe('Request Validation', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        })
        mockCheckRolePermissions.mockReturnValue(true)
      })

      it('validates request body structure', async () => {
        const request = mockRequest('PUT', { invalid: 'data' })
        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Invalid request body. Expected roleIds array.')
      })

      it('validates roleIds as array', async () => {
        const request = mockRequest('PUT', { roleIds: 'not-an-array' })
        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Invalid request body. Expected roleIds array.')
      })

      it('handles malformed JSON', async () => {
        const request = new NextRequest(`http://localhost:3000/api/users/123/roles`, {
          method: 'PUT',
          body: '{ invalid json }',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Invalid JSON in request body')
      })
    })

    describe('Error Handling', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        })
        mockCheckRolePermissions.mockReturnValue(true)
      })

      it('handles database transaction failures', async () => {
        ;(prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'))

        const request = mockRequest('PUT', { roleIds: ['role1'] })
        const response = await PUT(request, { params: { id: '123' } })

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toBe('Internal server error')
      })

      it('handles user not found during role update', async () => {
        ;(prisma.$transaction as jest.Mock).mockResolvedValue([
          { count: 0 }, // No roles deleted (user not found)
          { count: 0 },
        ])

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const request = mockRequest('PUT', { roleIds: ['role1'] })
        const response = await PUT(request, { params: { id: '999' } })

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.error).toBe('User not found')
      })
    })
  })

  describe('Role-Based Permission Testing', () => {
    const testScenarios = [
      {
        userRole: 'OWNER',
        action: 'read',
        targetUser: 'ADMIN',
        expectedPermissions: ['users.roles.read'],
        shouldAllow: true,
      },
      {
        userRole: 'OWNER',
        action: 'update',
        targetUser: 'ADMIN',
        expectedPermissions: ['users.roles.update'],
        shouldAllow: true,
      },
      {
        userRole: 'ADMIN',
        action: 'read',
        targetUser: 'EMPLOYEE',
        expectedPermissions: ['users.roles.read'],
        shouldAllow: true,
      },
      {
        userRole: 'ADMIN',
        action: 'update',
        targetUser: 'EMPLOYEE',
        expectedPermissions: ['users.roles.update'],
        shouldAllow: true,
      },
      {
        userRole: 'EMPLOYEE',
        action: 'read',
        targetUser: 'CUSTOMER',
        expectedPermissions: ['users.roles.read'],
        shouldAllow: false,
      },
      {
        userRole: 'CUSTOMER',
        action: 'read',
        targetUser: 'CUSTOMER',
        expectedPermissions: ['users.roles.read'],
        shouldAllow: false,
      },
    ]

    testScenarios.forEach(({ userRole, action, targetUser, expectedPermissions, shouldAllow }) => {
      it(`${shouldAllow ? 'allows' : 'denies'} ${userRole} to ${action} ${targetUser} roles`, async () => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: '456',
            email: `${userRole.toLowerCase()}@example.com`,
            role: userRole,
          },
        })

        mockCheckRolePermissions.mockReturnValue(shouldAllow)

        const mockUser = {
          id: '123',
          email: `${targetUser.toLowerCase()}@example.com`,
          roles: [{ role: { id: 'role1', name: targetUser, permissions: [] } }],
        }

        if (shouldAllow) {
          ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
        }

        const request = action === 'read' 
          ? mockRequest() 
          : mockRequest('PUT', { roleIds: ['role1'] })
        
        const handler = action === 'read' ? GET : PUT
        const response = await handler(request, { params: { id: '123' } })

        expect(mockCheckRolePermissions).toHaveBeenCalledWith(userRole, expectedPermissions)

        if (shouldAllow) {
          expect(response.status).not.toBe(403)
        } else {
          expect(response.status).toBe(403)
          const data = await response.json()
          expect(data.error).toBe('Insufficient permissions')
        }
      })
    })
  })
})