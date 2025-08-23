import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { SessionProvider } from 'next-auth/react'
import { Notifications } from '@mantine/notifications'
import CustomerProfile from '@/components/customer/CustomerProfile'

// Mock fetch
global.fetch = jest.fn()

// Mock notifications
import { notifications } from '@mantine/notifications'
jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn()
  }
}))

// Mock next-auth
const mockSession = {
  user: {
    id: '1',
    name: 'Test Customer',
    email: 'customer@test.com',
    role: 'CUSTOMER'
  }
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider session={mockSession}>
    <MantineProvider>
      <Notifications />
      {children}
    </MantineProvider>
  </SessionProvider>
)

describe('CustomerProfile', () => {
  const mockProfile = {
    id: '1',
    name: 'Test Customer',
    email: 'customer@test.com',
    mobile: '+1234567890',
    phone: '+1234567890',
    language: 'en',
    address: '123 Test Street',
    notes: 'Test notes',
    dealerInfo: {
      name: 'Test Dealer',
      dealerCode: 'TD001'
    },
    packageInfo: {
      name: 'Professional',
      expiryDate: '2024-12-31',
      status: 'Active'
    }
  }

  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  it('renders profile form with loaded data', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile
    })

    render(
      <TestWrapper>
        <CustomerProfile />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Customer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('customer@test.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument()
    })
  })

  it('displays dealer information when available', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile
    })

    render(
      <TestWrapper>
        <CustomerProfile />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Dealer')).toBeInTheDocument()
      expect(screen.getByText('TD001')).toBeInTheDocument()
    })
  })

  it('displays package information when available', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile
    })

    render(
      <TestWrapper>
        <CustomerProfile />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Professional')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('submits profile updates successfully', async () => {
    const user = userEvent.setup()

    // Mock profile fetch
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile
    })

    // Mock profile update
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Profile updated successfully' })
    })

    render(
      <TestWrapper>
        <CustomerProfile />
      </TestWrapper>
    )

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Customer')).toBeInTheDocument()
    })

    // Update name field
    const nameInput = screen.getByDisplayValue('Test Customer')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Customer')

    // Submit form
    const submitButton = screen.getByText('Update Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Updated Customer')
      })
    })
  })

  it('handles profile update errors', async () => {
    const user = userEvent.setup()

    // Mock profile fetch
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile
    })

    // Mock profile update error
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Update failed'))

    render(
      <TestWrapper>
        <CustomerProfile />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Customer')).toBeInTheDocument()
    })

    const submitButton = screen.getByText('Update Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Error',
        message: 'Failed to update profile',
        color: 'red'
      })
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile
    })

    render(
      <TestWrapper>
        <CustomerProfile />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Customer')).toBeInTheDocument()
    })

    // Clear required name field
    const nameInput = screen.getByDisplayValue('Test Customer')
    await user.clear(nameInput)

    const submitButton = screen.getByText('Update Profile')
    await user.click(submitButton)

    // Form should not submit without name
    expect(fetch).toHaveBeenCalledTimes(1) // Only the initial fetch
  })

  it('disables email field', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfile
    })

    render(
      <TestWrapper>
        <CustomerProfile />
      </TestWrapper>
    )

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('customer@test.com')
      expect(emailInput).toBeDisabled()
    })
  })

})