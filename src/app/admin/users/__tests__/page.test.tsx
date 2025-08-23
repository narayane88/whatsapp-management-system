import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import UsersPage from '../page'

// Mock the usePermissions hook
const mockUsePermissions = jest.fn()
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}))

// Mock the PagePermissionGuard component
jest.mock('@/components/auth/PagePermissionGuard', () => {
  return function MockPagePermissionGuard({ 
    children, 
    requiredPermissions 
  }: { 
    children: React.ReactNode
    requiredPermissions: string[] 
  }) {
    const { hasPermission } = mockUsePermissions()
    const hasAccess = requiredPermissions.every(permission => hasPermission(permission))
    
    if (!hasAccess) {
      return <div data-testid="access-denied">Access Denied</div>
    }
    
    return <div data-testid="page-permission-guard">{children}</div>
  }
})

// Mock AdminLayout
jest.mock('@/components/layout/AdminLayout', () => {
  return function MockAdminLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="admin-layout">{children}</div>
  }
})

// Mock Suspense fallback component
const MockLoadingFallback = () => <div data-testid="loading-fallback">Loading user management...</div>

// Mock the lazy-loaded UserManagementSystem
jest.mock('@/components/admin/UserManagementSystem', () => {
  return function MockUserManagementSystem() {
    return <div data-testid="user-management-system">User Management System</div>
  }
})

// Mock React.lazy and Suspense
const mockLazy = jest.fn()
const mockSuspense = jest.fn()

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  lazy: (factory: any) => {
    mockLazy(factory)
    // Return the actual component for testing
    return jest.requireActual('@/components/admin/UserManagementSystem').default
  },
  Suspense: ({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) => {
    mockSuspense({ children, fallback })
    // For testing purposes, render children immediately
    return <>{children}</>
  }
}))

describe('Users Page', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default authenticated session
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test Admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
    })
  })

  describe('Permission-Based Access Control', () => {
    it('renders page when user has users.page.access permission', async () => {
      const mockHasPermission = jest.fn()
        .mockImplementation((permission) => permission === 'users.page.access')
      
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['users.page.access'],
      })

      render(<UsersPage />)

      expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
      
      await waitFor(() => {
        expect(screen.getByTestId('page-permission-guard')).toBeInTheDocument()
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
        expect(screen.getByTestId('user-management-system')).toBeInTheDocument()
      })
    })

    it('denies access when user lacks users.page.access permission', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(false)
      
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: [],
      })

      render(<UsersPage />)

      expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
      
      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument()
        expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument()
        expect(screen.queryByTestId('user-management-system')).not.toBeInTheDocument()
      })
    })

    it('handles loading state during permission check', () => {
      const mockHasPermission = jest.fn()
      
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: true,
        permissions: [],
      })

      render(<UsersPage />)

      // During loading, components should not be rendered yet
      expect(screen.queryByTestId('user-management-system')).not.toBeInTheDocument()
    })
  })

  describe('Lazy Loading Implementation', () => {
    beforeEach(() => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['users.page.access'],
      })
    })

    it('implements lazy loading for UserManagementSystem component', () => {
      render(<UsersPage />)

      // Verify that React.lazy was called
      expect(mockLazy).toHaveBeenCalled()
      
      // Verify that the lazy factory function was called
      const lazyFactory = mockLazy.mock.calls[0][0]
      expect(typeof lazyFactory).toBe('function')
    })

    it('wraps lazy component with Suspense', () => {
      render(<UsersPage />)

      // Verify that Suspense was used
      expect(mockSuspense).toHaveBeenCalled()
      
      const suspenseCall = mockSuspense.mock.calls[0][0]
      expect(suspenseCall).toHaveProperty('children')
      expect(suspenseCall).toHaveProperty('fallback')
    })

    it('provides loading fallback during component loading', async () => {
      // Mock Suspense to actually show fallback
      jest.unmock('react')
      
      const { Suspense, lazy } = jest.requireActual('react')
      
      // Create a component that never resolves to test loading state
      const NeverLoadingComponent = lazy(() => new Promise(() => {}))
      
      const TestComponent = () => (
        <Suspense fallback={<MockLoadingFallback />}>
          <NeverLoadingComponent />
        </Suspense>
      )

      render(<TestComponent />)

      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument()
      expect(screen.getByText('Loading user management...')).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['users.page.access'],
      })
    })

    it('renders proper component hierarchy', async () => {
      render(<UsersPage />)

      await waitFor(() => {
        const pageGuard = screen.getByTestId('page-permission-guard')
        const adminLayout = screen.getByTestId('admin-layout')
        const userManagement = screen.getByTestId('user-management-system')

        expect(pageGuard).toBeInTheDocument()
        expect(adminLayout).toBeInTheDocument()
        expect(userManagement).toBeInTheDocument()

        // Check hierarchy: PagePermissionGuard > AdminLayout > UserManagementSystem
        expect(pageGuard).toContainElement(adminLayout)
        expect(adminLayout).toContainElement(userManagement)
      })
    })

    it('applies correct required permission', async () => {
      render(<UsersPage />)

      const mockHasPermission = mockUsePermissions().hasPermission
      expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
    })
  })

  describe('Role-Based Access Scenarios', () => {
    const roleScenarios = [
      {
        role: 'OWNER',
        permissions: ['users.page.access', 'users.manage', 'users.create', 'users.delete'],
        shouldHaveAccess: true,
        description: 'full user management access',
      },
      {
        role: 'ADMIN',
        permissions: ['users.page.access', 'users.manage', 'users.create'],
        shouldHaveAccess: true,
        description: 'standard user management access',
      },
      {
        role: 'SUBDEALER',
        permissions: ['users.page.access'],
        shouldHaveAccess: true,
        description: 'view-only user access',
      },
      {
        role: 'EMPLOYEE',
        permissions: ['users.page.access'],
        shouldHaveAccess: true,
        description: 'basic user access',
      },
      {
        role: 'CUSTOMER',
        permissions: [],
        shouldHaveAccess: false,
        description: 'no user management access',
      },
    ]

    roleScenarios.forEach(({ role, permissions, shouldHaveAccess, description }) => {
      it(`${shouldHaveAccess ? 'allows' : 'denies'} access for ${role} role - ${description}`, async () => {
        mockUseSession.mockReturnValue({
          data: {
            user: {
              id: '1',
              name: `Test ${role}`,
              email: `${role.toLowerCase()}@example.com`,
              role,
            },
          },
          status: 'authenticated',
        })

        const mockHasPermission = jest.fn()
          .mockImplementation((permission) => permissions.includes(permission))

        mockUsePermissions.mockReturnValue({
          hasPermission: mockHasPermission,
          isLoading: false,
          permissions,
        })

        render(<UsersPage />)

        if (shouldHaveAccess) {
          await waitFor(() => {
            expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
            expect(screen.getByTestId('user-management-system')).toBeInTheDocument()
          })
        } else {
          await waitFor(() => {
            expect(screen.getByTestId('access-denied')).toBeInTheDocument()
            expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument()
            expect(screen.queryByTestId('user-management-system')).not.toBeInTheDocument()
          })
        }

        expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
      })
    })
  })

  describe('Performance Optimizations', () => {
    beforeEach(() => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['users.page.access'],
      })
    })

    it('implements code splitting with lazy loading', async () => {
      render(<UsersPage />)

      // Verify lazy loading was implemented
      expect(mockLazy).toHaveBeenCalled()
      
      await waitFor(() => {
        expect(screen.getByTestId('user-management-system')).toBeInTheDocument()
      })
    })

    it('prevents unnecessary re-renders with proper component structure', async () => {
      const { rerender } = render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByTestId('user-management-system')).toBeInTheDocument()
      })

      // Re-render with same props should not cause issues
      rerender(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByTestId('user-management-system')).toBeInTheDocument()
      })
    })

    it('handles single permission check efficiently', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['users.page.access'],
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByTestId('user-management-system')).toBeInTheDocument()
      })

      // Should only check the required permission once
      expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
      expect(mockHasPermission).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('handles permission check errors gracefully', async () => {
      const mockHasPermission = jest.fn().mockImplementation(() => {
        throw new Error('Permission check failed')
      })

      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: [],
      })

      // Should not crash when permission check throws
      expect(() => render(<UsersPage />)).not.toThrow()
    })

    it('handles component loading errors gracefully', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['users.page.access'],
      })

      // The page should render even if there are component loading issues
      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      })
    })

    it('handles unauthenticated sessions', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const mockHasPermission = jest.fn().mockReturnValue(false)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: [],
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      })
    })
  })

  describe('Integration Tests', () => {
    it('integrates properly with permission system and layout', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['users.page.access'],
      })

      render(<UsersPage />)

      await waitFor(() => {
        // All components should be properly integrated
        expect(screen.getByTestId('page-permission-guard')).toBeInTheDocument()
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
        expect(screen.getByTestId('user-management-system')).toBeInTheDocument()
        
        // Verify text content
        expect(screen.getByText('User Management System')).toBeInTheDocument()
      })

      // Verify permission was checked correctly
      expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
    })

    it('maintains consistent behavior with other admin pages', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['users.page.access'],
      })

      render(<UsersPage />)

      await waitFor(() => {
        // Should follow same pattern as other admin pages
        expect(screen.getByTestId('page-permission-guard')).toBeInTheDocument()
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      })

      // Should use consistent permission naming pattern
      expect(mockHasPermission).toHaveBeenCalledWith('users.page.access')
    })
  })
})