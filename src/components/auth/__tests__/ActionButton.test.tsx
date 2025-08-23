import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActionButton, ActionLink, ActionIconButton } from '../ActionButton'

// Mock the usePermissions hook
const mockUsePermissions = jest.fn()
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}))

// Mock Mantine components
jest.mock('@mantine/core', () => ({
  Button: ({ children, loading, disabled, ...props }: any) => (
    <button 
      data-testid="mantine-button" 
      disabled={disabled || loading}
      data-loading={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  ActionIcon: ({ children, loading, disabled, ...props }: any) => (
    <button 
      data-testid="mantine-action-icon"
      disabled={disabled || loading}
      data-loading={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  Anchor: ({ children, ...props }: any) => (
    <a data-testid="mantine-anchor" {...props}>
      {children}
    </a>
  ),
}))

describe('ActionButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Permission-Based Rendering', () => {
    it('renders button when user has permission', () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
      })

      render(
        <ActionButton permission="users.create.button">
          Create User
        </ActionButton>
      )

      expect(mockHasPermission).toHaveBeenCalledWith('users.create.button')
      expect(screen.getByTestId('mantine-button')).toBeInTheDocument()
      expect(screen.getByText('Create User')).toBeInTheDocument()
    })

    it('hides button when user lacks permission', () => {
      const mockHasPermission = jest.fn().mockReturnValue(false)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
      })

      render(
        <ActionButton permission="users.create.button">
          Create User
        </ActionButton>
      )

      expect(mockHasPermission).toHaveBeenCalledWith('users.create.button')
      expect(screen.queryByTestId('mantine-button')).not.toBeInTheDocument()
      expect(screen.queryByText('Create User')).not.toBeInTheDocument()
    })

    it('shows loading button when permissions are loading', () => {
      const mockHasPermission = jest.fn()
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: true,
      })

      render(
        <ActionButton permission="users.create.button">
          Create User
        </ActionButton>
      )

      const button = screen.getByTestId('mantine-button')
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button.getAttribute('data-loading')).toBe('true')
    })

    it('renders fallback when provided and no permission', () => {
      const mockHasPermission = jest.fn().mockReturnValue(false)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
      })

      render(
        <ActionButton 
          permission="users.create.button"
          fallback={<div data-testid="fallback">No Access</div>}
        >
          Create User
        </ActionButton>
      )

      expect(screen.queryByTestId('mantine-button')).not.toBeInTheDocument()
      expect(screen.getByTestId('fallback')).toBeInTheDocument()
      expect(screen.getByText('No Access')).toBeInTheDocument()
    })
  })

  describe('Button Functionality', () => {
    it('calls onClick handler when button is clicked', async () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      const mockOnClick = jest.fn()
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
      })

      render(
        <ActionButton permission="users.create.button" onClick={mockOnClick}>
          Create User
        </ActionButton>
      )

      const button = screen.getByTestId('mantine-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockOnClick).toHaveBeenCalledTimes(1)
      })
    })

    it('passes through all button props correctly', () => {
      const mockHasPermission = jest.fn().mockReturnValue(true)
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        isLoading: false,
      })

      render(
        <ActionButton 
          permission="users.create.button"
          variant="outline"
          color="blue"
          size="sm"
          data-testid="custom-button"
        >
          Create User
        </ActionButton>
      )

      const button = screen.getByTestId('mantine-button')
      expect(button).toHaveAttribute('variant', 'outline')
      expect(button).toHaveAttribute('color', 'blue')
      expect(button).toHaveAttribute('size', 'sm')
    })
  })

  describe('Different Permission Scenarios', () => {
    const permissionScenarios = [
      {
        permission: 'users.create.button',
        description: 'user creation button',
        hasPermission: true,
      },
      {
        permission: 'users.edit.button',
        description: 'user edit button',
        hasPermission: true,
      },
      {
        permission: 'users.delete.button',
        description: 'user delete button',
        hasPermission: false,
      },
      {
        permission: 'admin.settings.button',
        description: 'admin settings button',
        hasPermission: false,
      },
    ]

    permissionScenarios.forEach(({ permission, description, hasPermission }) => {
      it(`${hasPermission ? 'shows' : 'hides'} ${description}`, () => {
        const mockHasPermissionFn = jest.fn().mockReturnValue(hasPermission)
        mockUsePermissions.mockReturnValue({
          hasPermission: mockHasPermissionFn,
          isLoading: false,
        })

        render(
          <ActionButton permission={permission}>
            {description}
          </ActionButton>
        )

        expect(mockHasPermissionFn).toHaveBeenCalledWith(permission)
        
        if (hasPermission) {
          expect(screen.getByTestId('mantine-button')).toBeInTheDocument()
          expect(screen.getByText(description)).toBeInTheDocument()
        } else {
          expect(screen.queryByTestId('mantine-button')).not.toBeInTheDocument()
          expect(screen.queryByText(description)).not.toBeInTheDocument()
        }
      })
    })
  })
})

describe('ActionLink Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders link when user has permission', () => {
    const mockHasPermission = jest.fn().mockReturnValue(true)
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      isLoading: false,
    })

    render(
      <ActionLink permission="users.view.link" href="/users/123">
        View User
      </ActionLink>
    )

    expect(mockHasPermission).toHaveBeenCalledWith('users.view.link')
    expect(screen.getByTestId('mantine-anchor')).toBeInTheDocument()
    expect(screen.getByText('View User')).toBeInTheDocument()
  })

  it('hides link when user lacks permission', () => {
    const mockHasPermission = jest.fn().mockReturnValue(false)
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      isLoading: false,
    })

    render(
      <ActionLink permission="users.view.link" href="/users/123">
        View User
      </ActionLink>
    )

    expect(mockHasPermission).toHaveBeenCalledWith('users.view.link')
    expect(screen.queryByTestId('mantine-anchor')).not.toBeInTheDocument()
    expect(screen.queryByText('View User')).not.toBeInTheDocument()
  })

  it('passes through href and other props correctly', () => {
    const mockHasPermission = jest.fn().mockReturnValue(true)
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      isLoading: false,
    })

    render(
      <ActionLink 
        permission="users.view.link" 
        href="/users/123"
        target="_blank"
        rel="noopener"
      >
        View User
      </ActionLink>
    )

    const link = screen.getByTestId('mantine-anchor')
    expect(link).toHaveAttribute('href', '/users/123')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener')
  })
})

describe('ActionIconButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders icon button when user has permission', () => {
    const mockHasPermission = jest.fn().mockReturnValue(true)
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      isLoading: false,
    })

    render(
      <ActionIconButton permission="users.edit.icon">
        ✏️
      </ActionIconButton>
    )

    expect(mockHasPermission).toHaveBeenCalledWith('users.edit.icon')
    expect(screen.getByTestId('mantine-action-icon')).toBeInTheDocument()
    expect(screen.getByText('✏️')).toBeInTheDocument()
  })

  it('hides icon button when user lacks permission', () => {
    const mockHasPermission = jest.fn().mockReturnValue(false)
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      isLoading: false,
    })

    render(
      <ActionIconButton permission="users.edit.icon">
        ✏️
      </ActionIconButton>
    )

    expect(mockHasPermission).toHaveBeenCalledWith('users.edit.icon')
    expect(screen.queryByTestId('mantine-action-icon')).not.toBeInTheDocument()
    expect(screen.queryByText('✏️')).not.toBeInTheDocument()
  })

  it('shows loading state when permissions are loading', () => {
    const mockHasPermission = jest.fn()
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      isLoading: true,
    })

    render(
      <ActionIconButton permission="users.edit.icon">
        ✏️
      </ActionIconButton>
    )

    const iconButton = screen.getByTestId('mantine-action-icon')
    expect(iconButton).toBeInTheDocument()
    expect(iconButton).toBeDisabled()
    expect(iconButton.getAttribute('data-loading')).toBe('true')
  })

  it('calls onClick handler when icon button is clicked', async () => {
    const mockHasPermission = jest.fn().mockReturnValue(true)
    const mockOnClick = jest.fn()
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      isLoading: false,
    })

    render(
      <ActionIconButton permission="users.edit.icon" onClick={mockOnClick}>
        ✏️
      </ActionIconButton>
    )

    const iconButton = screen.getByTestId('mantine-action-icon')
    fireEvent.click(iconButton)

    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })
  })
})

describe('Integration Tests', () => {
  it('handles multiple action components with different permissions', () => {
    const mockHasPermission = jest.fn()
      .mockImplementation((permission) => {
        return permission === 'users.create.button' || permission === 'users.view.link'
      })
    
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      isLoading: false,
    })

    render(
      <div>
        <ActionButton permission="users.create.button">Create</ActionButton>
        <ActionButton permission="users.delete.button">Delete</ActionButton>
        <ActionLink permission="users.view.link" href="/users/123">View</ActionLink>
        <ActionIconButton permission="users.edit.icon">✏️</ActionIconButton>
      </div>
    )

    // Should show create button and view link
    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByText('View')).toBeInTheDocument()
    
    // Should hide delete button and edit icon
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    expect(screen.queryByText('✏️')).not.toBeInTheDocument()

    // Verify permission checks
    expect(mockHasPermission).toHaveBeenCalledWith('users.create.button')
    expect(mockHasPermission).toHaveBeenCalledWith('users.delete.button')
    expect(mockHasPermission).toHaveBeenCalledWith('users.view.link')
    expect(mockHasPermission).toHaveBeenCalledWith('users.edit.icon')
  })
})