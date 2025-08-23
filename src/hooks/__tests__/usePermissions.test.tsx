import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '../usePermissions'

// Mock SWR
const mockUseSWR = jest.fn()
jest.mock('swr', () => ({
  __esModule: true,
  default: (key: any, fetcher: any) => mockUseSWR(key, fetcher),
}))

// Mock fetch
global.fetch = jest.fn()

describe('usePermissions Hook', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication States', () => {
    it('returns loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })

      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.permissions).toEqual([])
      expect(result.current.hasPermission('any.permission')).toBe(false)
    })

    it('returns empty permissions when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.permissions).toEqual([])
      expect(result.current.hasPermission('any.permission')).toBe(false)
    })

    it('fetches permissions when authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockPermissions = [
        'users.page.access',
        'users.create.button',
        'users.edit.button',
      ]

      mockUseSWR.mockReturnValue({
        data: mockPermissions,
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.permissions).toEqual(mockPermissions)
    })
  })

  describe('Permission Checking', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('returns true for permissions user has', () => {
      const mockPermissions = [
        'users.page.access',
        'users.create.button',
        'users.edit.button',
      ]

      mockUseSWR.mockReturnValue({
        data: mockPermissions,
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.hasPermission('users.page.access')).toBe(true)
      expect(result.current.hasPermission('users.create.button')).toBe(true)
      expect(result.current.hasPermission('users.edit.button')).toBe(true)
    })

    it('returns false for permissions user lacks', () => {
      const mockPermissions = [
        'users.page.access',
        'users.create.button',
      ]

      mockUseSWR.mockReturnValue({
        data: mockPermissions,
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.hasPermission('users.delete.button')).toBe(false)
      expect(result.current.hasPermission('admin.settings.access')).toBe(false)
      expect(result.current.hasPermission('nonexistent.permission')).toBe(false)
    })

    it('handles empty permissions array', () => {
      mockUseSWR.mockReturnValue({
        data: [],
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.permissions).toEqual([])
      expect(result.current.hasPermission('any.permission')).toBe(false)
    })

    it('handles undefined permissions data', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.permissions).toEqual([])
      expect(result.current.hasPermission('any.permission')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('handles API errors gracefully', () => {
      const mockError = new Error('Failed to fetch permissions')
      
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.permissions).toEqual([])
      expect(result.current.hasPermission('any.permission')).toBe(false)
    })

    it('handles network errors', () => {
      const mockError = new Error('Network error')
      
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        mutate: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.permissions).toEqual([])
      expect(result.current.hasPermission('any.permission')).toBe(false)
    })
  })

  describe('Role-Based Permission Scenarios', () => {
    const roleScenarios = [
      {
        role: 'OWNER',
        expectedPermissions: [
          'users.page.access',
          'users.create.button',
          'users.edit.button',
          'users.delete.button',
          'admin.settings.access',
          'transactions.page.access',
          'vouchers.page.access',
          'servers.page.access',
        ],
      },
      {
        role: 'ADMIN',
        expectedPermissions: [
          'users.page.access',
          'users.create.button',
          'users.edit.button',
          'transactions.page.access',
          'vouchers.page.access',
        ],
      },
      {
        role: 'EMPLOYEE',
        expectedPermissions: [
          'users.page.access',
          'transactions.page.access',
        ],
      },
      {
        role: 'CUSTOMER',
        expectedPermissions: [],
      },
    ]

    roleScenarios.forEach(({ role, expectedPermissions }) => {
      it(`returns correct permissions for ${role} role`, () => {
        mockUseSession.mockReturnValue({
          data: {
            user: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com',
              role,
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          status: 'authenticated',
        })

        mockUseSWR.mockReturnValue({
          data: expectedPermissions,
          error: undefined,
          isLoading: false,
          mutate: jest.fn(),
        })

        const { result } = renderHook(() => usePermissions())

        expect(result.current.permissions).toEqual(expectedPermissions)

        // Test specific permission checks
        expectedPermissions.forEach(permission => {
          expect(result.current.hasPermission(permission)).toBe(true)
        })

        // Test permissions that shouldn't be available
        if (role === 'CUSTOMER') {
          expect(result.current.hasPermission('users.page.access')).toBe(false)
          expect(result.current.hasPermission('admin.settings.access')).toBe(false)
        }

        if (role === 'EMPLOYEE') {
          expect(result.current.hasPermission('users.delete.button')).toBe(false)
          expect(result.current.hasPermission('admin.settings.access')).toBe(false)
        }
      })
    })
  })

  describe('Caching and Revalidation', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('provides mutate function for manual revalidation', () => {
      const mockMutate = jest.fn()
      const mockPermissions = ['users.page.access']

      mockUseSWR.mockReturnValue({
        data: mockPermissions,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      })

      const { result } = renderHook(() => usePermissions())

      expect(typeof result.current.mutate).toBe('function')
      expect(result.current.mutate).toBe(mockMutate)
    })

    it('handles revalidation after permission changes', async () => {
      const mockMutate = jest.fn()
      let currentPermissions = ['users.page.access']

      mockUseSWR.mockReturnValue({
        data: currentPermissions,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      })

      const { result, rerender } = renderHook(() => usePermissions())

      expect(result.current.hasPermission('users.page.access')).toBe(true)
      expect(result.current.hasPermission('users.create.button')).toBe(false)

      // Simulate permission update
      currentPermissions = ['users.page.access', 'users.create.button']
      mockUseSWR.mockReturnValue({
        data: currentPermissions,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      })

      rerender()

      expect(result.current.hasPermission('users.page.access')).toBe(true)
      expect(result.current.hasPermission('users.create.button')).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('memoizes hasPermission function to prevent unnecessary re-renders', () => {
      const mockPermissions = ['users.page.access', 'users.create.button']

      mockUseSWR.mockReturnValue({
        data: mockPermissions,
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      const { result, rerender } = renderHook(() => usePermissions())

      const hasPermissionRef1 = result.current.hasPermission
      
      // Re-render should maintain same function reference when permissions don't change
      rerender()
      
      const hasPermissionRef2 = result.current.hasPermission
      
      expect(hasPermissionRef1).toBe(hasPermissionRef2)
    })

    it('handles rapid permission checks efficiently', () => {
      const mockPermissions = ['users.page.access', 'users.create.button']

      mockUseSWR.mockReturnValue({
        data: mockPermissions,
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      const { result } = renderHook(() => usePermissions())

      // Rapid permission checks should not cause performance issues
      for (let i = 0; i < 100; i++) {
        result.current.hasPermission('users.page.access')
        result.current.hasPermission('users.create.button')
        result.current.hasPermission('nonexistent.permission')
      }

      expect(result.current.hasPermission('users.page.access')).toBe(true)
      expect(result.current.hasPermission('users.create.button')).toBe(true)
      expect(result.current.hasPermission('nonexistent.permission')).toBe(false)
    })
  })
})