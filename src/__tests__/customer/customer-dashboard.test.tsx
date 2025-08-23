import { render, screen, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { SessionProvider } from 'next-auth/react'
import CustomerDashboard from '@/components/customer/CustomerDashboard'

// Mock fetch
global.fetch = jest.fn()

// Mock next-auth
const mockSession = {
  user: {
    id: '1',
    name: 'Test Customer',
    email: 'customer@test.com',
    role: 'CUSTOMER'
  }
}

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider session={mockSession}>
    <MantineProvider>
      {children}
    </MantineProvider>
  </SessionProvider>
)

describe('CustomerDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  it('renders dashboard with loading state', () => {
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    )

    render(
      <TestWrapper>
        <CustomerDashboard />
      </TestWrapper>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays dashboard stats when loaded successfully', async () => {
    const mockStats = {
      whatsappInstances: 2,
      totalContacts: 150,
      messagesSent: 1250,
      apiKeys: 1,
      queuedMessages: 5,
      activePackage: {
        name: 'Professional',
        expiryDate: '2024-12-31',
        status: 'Active'
      }
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    render(
      <TestWrapper>
        <CustomerDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // WhatsApp instances
      expect(screen.getByText('150')).toBeInTheDocument() // Total contacts
      expect(screen.getByText('1,250')).toBeInTheDocument() // Messages sent
      expect(screen.getByText('Professional')).toBeInTheDocument() // Package name
      expect(screen.getByText('Active')).toBeInTheDocument() // Package status
    })
  })

  it('displays error message when API fails', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(
      <TestWrapper>
        <CustomerDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard data/)).toBeInTheDocument()
    })
  })

  it('displays fallback data when API is unavailable', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(
      <TestWrapper>
        <CustomerDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      // Should show mock data
      expect(screen.getByText('2')).toBeInTheDocument() // Mock WhatsApp instances
      expect(screen.getByText('150')).toBeInTheDocument() // Mock total contacts
    })
  })

  it('renders quick action buttons', async () => {
    const mockStats = {
      whatsappInstances: 1,
      totalContacts: 10,
      messagesSent: 50,
      apiKeys: 1,
      queuedMessages: 2
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    render(
      <TestWrapper>
        <CustomerDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Manage WhatsApp')).toBeInTheDocument()
      expect(screen.getByText('Add Contacts')).toBeInTheDocument()
      expect(screen.getByText('Send Message')).toBeInTheDocument()
      expect(screen.getByText('API Documentation')).toBeInTheDocument()
    })
  })

  it('formats large numbers correctly', async () => {
    const mockStats = {
      whatsappInstances: 1,
      totalContacts: 15000,
      messagesSent: 1234567,
      apiKeys: 1,
      queuedMessages: 0
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    render(
      <TestWrapper>
        <CustomerDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument()
      expect(screen.getByText('1,234,567')).toBeInTheDocument()
    })
  })
})