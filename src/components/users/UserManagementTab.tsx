'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Badge,
  Card,
  Table,
  SimpleGrid,
  ActionIcon,
  Modal,
  Switch,
  Select,
  Textarea,
  Container,
  Tabs,
} from '@mantine/core'
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiEye, 
  FiKey, 
  FiUserCheck, 
  FiUserX, 
  FiActivity, 
  FiCreditCard,
  FiShield,
  FiInfo,
  FiPhone,
  FiMail,
  FiCamera,
  FiGlobe,
  FiPackage
} from 'react-icons/fi'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { User } from '@/types/user'
import { generateDealerCode, validateDealerCodeFormat, getDealerByCode, formatDealerCode, normalizeDealerCode, DealerCodeInfo } from '@/utils/dealerCode'
import DealerCodeManager from './DealerCodeManager'
import UserStats from './user-management/UserStats'
import UserFilters from './user-management/UserFilters'
import UserTable from './user-management/UserTable'
import CreateUserModal from './user-management/CreateUserModal'

export default function UserManagementTab() {
  const { data: session } = useSession()
  const { permissions, canManageUser, getAllowedRoles } = useUserPermissions()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [dealerCodeInput, setDealerCodeInput] = useState('')
  const [dealerCodeValidation, setDealerCodeValidation] = useState<{ isValid: boolean; dealerInfo: DealerCodeInfo | null; error: string }>({ isValid: false, dealerInfo: null, error: '' })
  const [selectedRole, setSelectedRole] = useState('')
  const [showDealerCodeManager, setShowDealerCodeManager] = useState(false)

  // Sample users data with Indian localization
  const users = [
    { 
      id: 1, 
      name: 'Rajesh Kumar', 
      email: 'rajesh@example.com',
      mobile: '+91-98765-43210',
      role: 'OWNER', 
      status: 'Active',
      lastLogin: '2 hours ago',
      messagesUsed: 15420,
      messagesLimit: 50000,
      parentId: null,
      createdAt: '2024-01-01',
      package: 'Enterprise',
      totalTransactions: 156,
      language: 'Hindi',
      isActive: true,
      dealerCode: null, // Owner doesn't have dealer code
      referredByDealerCode: null
    },
    { 
      id: 2, 
      name: 'Priya Sharma', 
      email: 'priya@example.com',
      mobile: '+91-87654-32109',
      role: 'SUBDEALER', 
      status: 'Active',
      lastLogin: '1 day ago',
      messagesUsed: 8500,
      messagesLimit: 25000,
      parentId: 1,
      createdAt: '2024-01-15',
      package: 'Professional',
      totalTransactions: 89,
      language: 'Hindi',
      isActive: true,
      dealerCode: 'WA-PRSH-0002',
      referredByDealerCode: null
    },
    { 
      id: 3, 
      name: 'Amit Patel', 
      email: 'amit@example.com',
      mobile: '+91-76543-21098',
      role: 'EMPLOYEE', 
      status: 'Active',
      lastLogin: '5 minutes ago',
      messagesUsed: 2100,
      messagesLimit: 10000,
      parentId: 1,
      createdAt: '2024-02-01',
      package: 'Basic',
      totalTransactions: 23,
      language: 'English',
      isActive: true,
      dealerCode: null,
      referredByDealerCode: null
    },
    { 
      id: 4, 
      name: 'Sunita Gupta', 
      email: 'sunita@example.com',
      mobile: '+91-65432-10987',
      role: 'CUSTOMER', 
      status: 'Active',
      lastLogin: '3 days ago',
      messagesUsed: 450,
      messagesLimit: 1000,
      parentId: 2,
      createdAt: '2024-02-10',
      package: 'Basic',
      totalTransactions: 8,
      language: 'Hindi',
      isActive: true,
      dealerCode: null,
      referredByDealerCode: 'WA-PRSH-0002'
    },
    { 
      id: 5, 
      name: 'Vikram Singh', 
      email: 'vikram@example.com',
      mobile: '+91-54321-09876',
      role: 'CUSTOMER', 
      status: 'Inactive',
      lastLogin: '1 week ago',
      messagesUsed: 0,
      messagesLimit: 1000,
      parentId: 2,
      createdAt: '2024-01-25',
      package: 'Basic',
      totalTransactions: 2,
      language: 'English',
      isActive: false,
      dealerCode: null,
      referredByDealerCode: 'WA-PRSH-0002'
    }
  ]

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile.includes(searchTerm) ||
      (user.dealerCode && user.dealerCode.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = !filterRole || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsDetailsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    if (!canManageUser(user)) return
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    if (!canManageUser(user) || user.role === 'OWNER') return
    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {

      // In real app, make API call to delete user
    }
  }

  const handleToggleUserStatus = (user: User) => {
    if (!canManageUser(user)) return

    // In real app, make API call to toggle user status
  }

  const handleResetPassword = (user: User) => {
    if (!canManageUser(user)) return
    setSelectedUser(user)
    setIsResetPasswordModalOpen(true)
  }

  const handleCreateUser = (userData: {name: string, email: string, role: string, phone?: string}) => {

    // In real app, make API call to create user
  }

  // Show Dealer Code Manager if requested
  if (showDealerCodeManager) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <Box>
            <Title order={2}>Dealer Code Management</Title>
            <Text c="dimmed">Manage dealer codes and referral system</Text>
          </Box>
          <Button
            variant="outline"
            onClick={() => setShowDealerCodeManager(false)}
          >
            Back to Users
          </Button>
        </Group>
        <DealerCodeManager />
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      {/* Stats Section */}
      <UserStats users={users} />

      {/* Filters Section */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onRoleChange={setFilterRole}
        onCreateUser={() => setIsCreateModalOpen(true)}
        onManageDealerCodes={() => setShowDealerCodeManager(true)}
      />

      {/* Users Table */}
      <UserTable
        users={filteredUsers}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleUserStatus}
        onResetPassword={handleResetPassword}
        canManageUser={canManageUser}
      />

      {/* Create User Modal */}
      <CreateUserModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        allowedRoles={getAllowedRoles()}
        onSubmit={handleCreateUser}
      />

      {/* User Details Modal */}
      <Modal
        opened={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`User Details - ${selectedUser?.name}`}
        size="xl"
      >
        {selectedUser && (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Group>
                    <Stack gap="xs">
                      <Text fw={500} size="lg">{selectedUser.name}</Text>
                      <Badge color={selectedUser.isActive ? 'green' : 'red'} variant="light">
                        {selectedUser.status}
                      </Badge>
                    </Stack>
                  </Group>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <Box component={FiMail} size={14} c="gray.6" />
                      <Text size="sm">{selectedUser.email}</Text>
                    </Group>
                    <Group gap="xs">
                      <Box component={FiPhone} size={14} c="gray.6" />
                      <Text size="sm">{selectedUser.mobile}</Text>
                    </Group>
                    {selectedUser.dealerCode && (
                      <Group gap="xs">
                        <Box component={FiKey} size={14} c="blue.6" />
                        <Text size="sm" ff="monospace" c="blue.6">
                          {selectedUser.dealerCode}
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Stack>
              </Card>

              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Text fw={500} size="md">Account Information</Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Role:</Text>
                      <Badge color="blue" variant="light">
                        {selectedUser.role}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Package:</Text>
                      <Text size="sm" fw={500}>{selectedUser.package}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Language:</Text>
                      <Text size="sm" fw={500}>{selectedUser.language}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Created:</Text>
                      <Text size="sm" fw={500}>
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Last Login:</Text>
                      <Text size="sm" fw={500}>{selectedUser.lastLogin}</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </SimpleGrid>

            <Group justify="flex-end" mt="lg">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
              {canManageUser(selectedUser) && (
                <Button color="blue" onClick={() => {
                  setIsDetailsModalOpen(false)
                  handleEditUser(selectedUser)
                }}>
                  Edit User
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        opened={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Password"
        size="md"
      >
        {selectedUser && (
          <Stack gap="md">
            <Text>
              Are you sure you want to reset the password for <strong>{selectedUser.name}</strong>?
            </Text>
            <Text size="sm" c="dimmed">
              A new password will be generated and sent to {selectedUser.email}
            </Text>
            
            <Group justify="flex-end" mt="lg">
              <Button variant="outline" onClick={() => setIsResetPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button color="orange" onClick={() => {

                setIsResetPasswordModalOpen(false)
              }}>
                Reset Password
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}