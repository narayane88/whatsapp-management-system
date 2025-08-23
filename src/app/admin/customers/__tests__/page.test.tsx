import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import CustomersPage from '../page'

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

// Mock Customer Components (lazy-loaded)
jest.mock('@/components/admin/customers/CustomerActions', () => {
  return function MockCustomerActions() {
    return <div data-testid="customer-actions">Customer Actions</div>
  }
})

jest.mock('@/components/admin/customers/CustomerStatsCards', () => {
  return function MockCustomerStatsCards() {
    return <div data-testid="customer-stats">Customer Stats</div>
  }
})

jest.mock('@/components/admin/customers/CustomerFilters', () => {
  return function MockCustomerFilters() {
    return <div data-testid="customer-filters">Customer Filters</div>
  }
})

jest.mock('@/components/admin/customers/CustomerTable', () => {
  return function MockCustomerTable() {
    return <div data-testid="customer-table">Customer Table</div>
  }
})

describe('Customers Page', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default authenticated session
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
    })
  })

  describe('Permission-Based Access Control', () => {
    it('renders page when user has customers.page.access permission', async () => {
      const mockHasPermission = jest.fn()
        .mockImplementation((permission) => permission === 'customers.page.access')
      
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['customers.page.access'],
      })

      render(<CustomersPage />)

      expect(mockHasPermission).toHaveBeenCalledWith('customers.page.access')
      
      await waitFor(() => {
        expect(screen.getByTestId('page-permission-guard')).toBeInTheDocument()
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
        expect(screen.getByTestId('customer-actions')).toBeInTheDocument()
        expect(screen.getByTestId('customer-stats')).toBeInTheDocument()
        expect(screen.getByTestId('customer-filters')).toBeInTheDocument()
        expect(screen.getByTestId('customer-table')).toBeInTheDocument()
      })
    })

    it('denies access when user lacks customers.page.access permission', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(false)
      
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: [],
      })

      render(<CustomersPage />)

      expect(mockHasPermission).toHaveBeenCalledWith('customers.page.access')
      
      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument()
        expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument()
      })
    })

    it('handles loading state during permission check', () => {
      const mockHasPermission = jest.fn()
      
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: true,
        permissions: [],
      })

      render(<CustomersPage />)

      // During loading, the permission guard should handle the loading state
      expect(screen.queryByTestId('customer-actions')).not.toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['customers.page.access'],
      })
    })

    it('renders all customer management components in correct order', async () => {
      render(<CustomersPage />)

      await waitFor(() => {
        const pageGuard = screen.getByTestId('page-permission-guard')
        const adminLayout = screen.getByTestId('admin-layout')
        const customerActions = screen.getByTestId('customer-actions')
        const customerStats = screen.getByTestId('customer-stats')
        const customerFilters = screen.getByTestId('customer-filters')
        const customerTable = screen.getByTestId('customer-table')

        expect(pageGuard).toBeInTheDocument()
        expect(adminLayout).toBeInTheDocument()
        expect(customerActions).toBeInTheDocument()
        expect(customerStats).toBeInTheDocument()
        expect(customerFilters).toBeInTheDocument()
        expect(customerTable).toBeInTheDocument()
      })
    })

    it('wraps content with AdminLayout', async () => {
      render(<CustomersPage />)

      await waitFor(() => {
        const adminLayout = screen.getByTestId('admin-layout')
        const customerComponents = [
          screen.getByTestId('customer-actions'),
          screen.getByTestId('customer-stats'),
          screen.getByTestId('customer-filters'),
          screen.getByTestId('customer-table')
        ]

        expect(adminLayout).toBeInTheDocument()
        customerComponents.forEach(component => {
          expect(adminLayout).toContainElement(component)
        })
      })
    })

    it('applies proper permission guard with required permission', async () => {
      render(<CustomersPage />)

      // The mock PagePermissionGuard will be called with the required permissions
      const mockHasPermission = mockUsePermissions().hasPermission
      expect(mockHasPermission).toHaveBeenCalledWith('customers.page.access')
    })
  })

  describe('Role-Based Access Scenarios', () => {
    const roleScenarios = [
      {
        role: 'OWNER',
        permissions: ['customers.page.access', 'customers.manage', 'customers.create', 'customers.delete'],
        shouldHaveAccess: true,
      },
      {
        role: 'ADMIN',
        permissions: ['customers.page.access', 'customers.manage'],
        shouldHaveAccess: true,
      },
      {
        role: 'SUBDEALER',
        permissions: ['customers.page.access'],
        shouldHaveAccess: true,
      },
      {
        role: 'EMPLOYEE',
        permissions: ['customers.page.access'],
        shouldHaveAccess: true,
      },
      {
        role: 'CUSTOMER',
        permissions: [],
        shouldHaveAccess: false,
      },
    ]

    roleScenarios.forEach(({ role, permissions, shouldHaveAccess }) => {
      it(`${shouldHaveAccess ? 'allows' : 'denies'} access for ${role} role`, async () => {
        mockUseSession.mockReturnValue({
          data: {
            user: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com',
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

        render(<CustomersPage />)

        if (shouldHaveAccess) {
          await waitFor(() => {
            expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
            expect(screen.getByTestId('customer-actions')).toBeInTheDocument()
          })
        } else {
          await waitFor(() => {
            expect(screen.getByTestId('access-denied')).toBeInTheDocument()
            expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument()
          })
        }

        expect(mockHasPermission).toHaveBeenCalledWith('customers.page.access')
      })
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

      // The test should not crash when permission check throws
      expect(() => render(<CustomersPage />)).not.toThrow()
    })

    it('handles missing session gracefully', async () => {
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

      render(<CustomersPage />)

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      })
    })
  })

  describe('Component Integration', () => {
    beforeEach(() => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['customers.page.access'],
      })
    })

    it('integrates all customer management components properly', async () => {
      render(<CustomersPage />)

      await waitFor(() => {
        // All components should be present and rendered
        expect(screen.getByText('Customer Actions')).toBeInTheDocument()
        expect(screen.getByText('Customer Stats')).toBeInTheDocument()
        expect(screen.getByText('Customer Filters')).toBeInTheDocument()
        expect(screen.getByText('Customer Table')).toBeInTheDocument()
      })
    })

    it('maintains proper component hierarchy', async () => {
      render(<CustomersPage />)

      await waitFor(() => {
        const pageGuard = screen.getByTestId('page-permission-guard')
        const adminLayout = screen.getByTestId('admin-layout')

        // Check hierarchy: PagePermissionGuard > AdminLayout > Components
        expect(pageGuard).toContainElement(adminLayout)
        expect(adminLayout).toContainElement(screen.getByTestId('customer-actions'))
        expect(adminLayout).toContainElement(screen.getByTestId('customer-stats'))
        expect(adminLayout).toContainElement(screen.getByTestId('customer-filters'))
        expect(adminLayout).toContainElement(screen.getByTestId('customer-table'))
      })
    })
  })

  describe('Performance Considerations', () => {
    it('should render efficiently with proper component structure', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['customers.page.access'],
      })

      const renderTime = Date.now()
      render(<CustomersPage />)
      const renderDuration = Date.now() - renderTime

      await waitFor(() => {
        expect(screen.getByTestId('customer-actions')).toBeInTheDocument()
      })

      // Component should render quickly (under 100ms in test environment)
      expect(renderDuration).toBeLessThan(100)
    })

    it('minimizes permission checks to required permissions only', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
        permissions: ['customers.page.access'],
      })

      render(<CustomersPage />)

      await waitFor(() => {
        expect(screen.getByTestId('customer-actions')).toBeInTheDocument()
      })

      // Should only check the required permission
      expect(mockHasPermission).toHaveBeenCalledWith('customers.page.access')
      expect(mockHasPermission).toHaveBeenCalledTimes(1)
    })
  })
})