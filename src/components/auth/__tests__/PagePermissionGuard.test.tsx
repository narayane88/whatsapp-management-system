import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PagePermissionGuard from '../PagePermissionGuard'

// Mock the usePermissions hook
const mockUsePermissions = jest.fn()
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}))

// Mock router functions
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock components
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>
const LoadingComponent = () => <div data-testid="loading">Loading...</div>

describe('PagePermissionGuard', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication States', () => {
    it('shows loading when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })
      mockUsePermissions.mockReturnValue({
        permissions: [],
        isLoading: true,
        hasPermission: jest.fn(),
      })

      render(
        <PagePermissionGuard requiredPermissions={['users.page.access']}>
          <TestComponent />
        </PagePermissionGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('redirects to login when not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })
      mockUsePermissions.mockReturnValue({
        permissions: [],
        isLoading: false,
        hasPermission: jest.fn(),
      })

      render(
        <PagePermissionGuard requiredPermissions={['users.page.access']}>
          <TestComponent />
        </PagePermissionGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin')
      })
    })

    it('redirects to unauthorized when user lacks required permissions', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'EMPLOYEE',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockHasPermission = jest.fn().mockReturnValue(false)
      mockUsePermissions.mockReturnValue({
        permissions: ['other.permission'],
        isLoading: false,
        hasPermission: mockHasPermission,
      })

      render(
        <PagePermissionGuard requiredPermissions={['users.page.access']}>
          <TestComponent />
        </PagePermissionGuard>
      )

      await waitFor(() => {
        expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
        expect(mockPush).toHaveBeenCalledWith('/unauthorized')
      })
    })
  })

  describe('Permission Validation', () => {
    it('renders children when user has required permissions', async () => {
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

      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        permissions: ['users.page.access'],
        isLoading: false,
        hasPermission: mockHasPermission,
      })

      render(
        <PagePermissionGuard requiredPermissions={['users.page.access']}>
          <TestComponent />
        </PagePermissionGuard>
      )

      await waitFor(() => {
        expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })

    it('validates multiple required permissions', async () => {
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

      const mockHasPermission = jest.fn()
        .mockReturnValueOnce(true)  // users.page.access
        .mockReturnValueOnce(true)  // users.manage

      mockUsePermissions.mockReturnValue({
        permissions: ['users.page.access', 'users.manage'],
        isLoading: false,
        hasPermission: mockHasPermission,
      })

      render(
        <PagePermissionGuard requiredPermissions={['users.page.access', 'users.manage']}>
          <TestComponent />
        </PagePermissionGuard>
      )

      await waitFor(() => {
        expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
        expect(mockHasPermission).toHaveBeenCalledWith('users.manage')
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })

    it('fails validation when one of multiple permissions is missing', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'EMPLOYEE',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockHasPermission = jest.fn()
        .mockReturnValueOnce(true)   // users.page.access
        .mockReturnValueOnce(false)  // users.manage

      mockUsePermissions.mockReturnValue({
        permissions: ['users.page.access'],
        isLoading: false,
        hasPermission: mockHasPermission,
      })

      render(
        <PagePermissionGuard requiredPermissions={['users.page.access', 'users.manage']}>
          <TestComponent />
        </PagePermissionGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized')
      })
    })
  })

  describe('Custom Loading Component', () => {
    it('renders custom loading component when provided', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })
      mockUsePermissions.mockReturnValue({
        permissions: [],
        isLoading: true,
        hasPermission: jest.fn(),
      })

      render(
        <PagePermissionGuard 
          requiredPermissions={['users.page.access']}
          loadingComponent={<LoadingComponent />}
        >
          <TestComponent />
        </PagePermissionGuard>
      )

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty permissions array', async () => {
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

      mockUsePermissions.mockReturnValue({
        permissions: [],
        isLoading: false,
        hasPermission: jest.fn(),
      })

      render(
        <PagePermissionGuard requiredPermissions={[]}>
          <TestComponent />
        </PagePermissionGuard>
      )

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })

    it('handles permissions loading state', () => {
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

      mockUsePermissions.mockReturnValue({
        permissions: [],
        isLoading: true,
        hasPermission: jest.fn(),
      })

      render(
        <PagePermissionGuard requiredPermissions={['users.page.access']}>
          <TestComponent />
        </PagePermissionGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Role-Based Scenarios', () => {
    const testRoleScenarios = [
      {
        role: 'OWNER',
        permissions: ['users.page.access', 'users.manage', 'users.create', 'users.delete'],
        shouldHaveAccess: true,
      },
      {
        role: 'ADMIN',
        permissions: ['users.page.access', 'users.manage'],
        shouldHaveAccess: true,
      },
      {
        role: 'EMPLOYEE',
        permissions: ['users.page.access'],
        shouldHaveAccess: true,
      },
      {
        role: 'CUSTOMER',
        permissions: [],
        shouldHaveAccess: false,
      },
    ]

    testRoleScenarios.forEach(({ role, permissions, shouldHaveAccess }) => {
      it(`${shouldHaveAccess ? 'allows' : 'denies'} access for ${role} role`, async () => {
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

        const mockHasPermission = jest.fn()
          .mockImplementation((permission) => permissions.includes(permission))

        mockUsePermissions.mockReturnValue({
          permissions,
          isLoading: false,
          hasPermission: mockHasPermission,
        })

        render(
          <PagePermissionGuard requiredPermissions={['users.page.access']}>
            <TestComponent />
          </PagePermissionGuard>
        )

        if (shouldHaveAccess) {
          await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument()
          })
        } else {
          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/unauthorized')
          })
        }
      })
    })
  })
})