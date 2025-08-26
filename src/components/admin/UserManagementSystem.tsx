'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Card,
  Table,
  SimpleGrid,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  Tabs,
  Alert,
  Switch,
  Loader,
  Divider,
  Menu,
  Checkbox,
  Tooltip
} from '@mantine/core'
import { 
  FiUsers, 
  FiShield, 
  FiKey, 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiEye,
  FiCheck,
  FiX,
  FiInfo,
  FiSettings,
  FiMoreVertical,
  FiUserX,
  FiUserCheck,
  FiUserPlus,
  FiLock,
  FiUnlock
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'
import RoleModal from './RoleModal'
import PermissionTemplateModal from './PermissionTemplateModal'
import PermissionFormModal from './PermissionFormModal'
import UserFormModal from './UserFormModal'

interface User {
  id: number
  name: string
  email: string
  isActive: boolean
  parentId?: number
  dealer_code: string
  phone?: string
  address?: string
  notes?: string
  language?: string
  created_at: string
  commission_rate?: number
  roles?: Role[]
  primary_role?: Role
  permissions?: Permission[]
  direct_permissions_count?: number
  role_permissions_count?: number
}

interface Role {
  id: number
  name: string
  description: string
  level: number
  is_system: boolean
  user_count: number
  permissions?: Permission[]
}

interface Permission {
  id: number
  name: string
  description: string
  category: string
  resource: string
  action: string
  is_system: boolean
  role_count: number
  user_count: number
}

interface PermissionTemplate {
  id: number
  name: string
  description: string
  permissions: number[]
  is_system: boolean
  created_at: string
}

interface UserPermission {
  id: number
  user_id: number
  permission_id: number
  granted: boolean
  reason?: string
  expires_at?: string
  assigned_at: string
  permission?: Permission
}

function UserManagementSystemContent() {
  const { data: session } = useSession()
  const { hasPermission } = useDynamicPermissions()
  
  // Derive role-based permissions from session
  const isOwner = session?.user?.role === 'OWNER'
  const isAdmin = session?.user?.role === 'ADMIN' || isOwner
  const [activeTab, setActiveTab] = useState<string>('users')
  const [loading, setLoading] = useState(false)
  
  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  
  // User filters state
  const [userFilters, setUserFilters] = useState({
    search: '',
    searchBy: 'name', // name, id, mobile, email
    role: '',
    status: ''
  })
  
  // Roles state
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  
  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
  
  // Permission Templates state
  const [permissionTemplates, setPermissionTemplates] = useState<PermissionTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  
  // User Permissions state
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([])
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null)
  const [isUserPermissionsModalOpen, setIsUserPermissionsModalOpen] = useState(false)

  // Current user roles state
  const [currentUserRoles, setCurrentUserRoles] = useState<{role: Role; is_primary: boolean}[]>([])

  // Statistics state
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    pending: 0,
    newThisMonth: 0,
    staffUsers: 0,
    customers: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Load statistics
  const loadUserStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/admin/users/stats')
      if (response.ok) {
        const data = await response.json()
        setUserStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load user statistics:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // Load data
  useEffect(() => {
    if (session?.user) {
      loadUsers()
      loadRoles()
      loadPermissions()
      loadPermissionTemplates()
      loadCurrentUserRoles()
      loadUserStats()
    }
  }, [session])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users?include_roles=true&include_permissions=true')
      const data = await response.json()
      
      if (response.ok) {
        const users = data.users || []
        
        // Load direct permission counts for each user (only if user has permission to view)
        const hasPermissionView = hasPermission('permissions.view')
        
        for (const user of users) {
          try {
            if (hasPermissionView) {
              const userPermsResponse = await fetch(`/api/user-permissions?user_id=${user.id}`)
              if (userPermsResponse.ok) {
                const userPermsData = await userPermsResponse.json()
                user.direct_permissions_count = userPermsData.permissions?.length || 0
              } else {
                user.direct_permissions_count = 0
              }
            } else {
              user.direct_permissions_count = 0
            }
            
            // Calculate role permissions count
            user.role_permissions_count = user.roles?.reduce((acc, role) => acc + (role.permissions?.length || 0), 0) || 0
          } catch {
            user.direct_permissions_count = 0
            user.role_permissions_count = 0
          }
        }
        
        setUsers(users)
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to load users',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to API',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles?include_permissions=true')
      const data = await response.json()
      
      if (response.ok) {
        setRoles(data.roles || [])
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to load roles',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to API',
        color: 'red'
      })
    }
  }

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      const data = await response.json()
      
      if (response.ok) {
        setPermissions(data.permissions || [])
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to load permissions',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to API',
        color: 'red'
      })
    }
  }

  const loadPermissionTemplates = async () => {
    try {
      const response = await fetch('/api/permission-templates')
      const data = await response.json()
      
      if (response.ok) {
        setPermissionTemplates(data.templates || [])
      } else {

      }
    } catch (error) {

    }
  }

  const loadUserPermissions = async (userId: number) => {
    try {
      const response = await fetch(`/api/user-permissions?user_id=${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        // Only use direct permissions - ignore role-based permissions
        const directPerms = data.directPermissions || []
        
        // Mark all as direct permissions since we only use template-based direct permissions
        const allPermissions = directPerms.map((p: any) => ({ ...p, source_type: 'direct' }))
        
        setUserPermissions(allPermissions)
        
        console.log(`📊 Loaded permissions for user ${userId}:`, {
          directPermissions: directPerms.length,
          totalPermissions: allPermissions.length
        })
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to load user permissions',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Failed to load user permissions:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to API',
        color: 'red'
      })
    }
  }

  const loadCurrentUserRoles = async () => {
    if (!session?.user?.email) return

    try {
      // Get current user's information including roles
      const response = await fetch('/api/users?include_roles=true')
      const data = await response.json()

      if (response.ok) {
        // Find current user in the list
        const currentUser = data.users?.find((user: User) => 
          user.email.toLowerCase() === session.user.email.toLowerCase()
        )

        if (currentUser?.roles) {
          // Convert to expected format
          const userRoles = currentUser.roles.map((role: Role) => ({
            role: role,
            is_primary: true // For simplicity, we'll treat first role as primary
          }))
          setCurrentUserRoles(userRoles)
        }
      }
    } catch (error) {
      console.error('Failed to load current user roles:', error)
    }
  }

  const handleUserSave = async (userData: any) => {
    try {
      const url = '/api/users'
      const method = userData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `User ${userData.id ? 'updated' : 'created'} successfully`,
          color: 'green'
        })
        setIsUserModalOpen(false)
        setSelectedUser(null)
        loadUsers() // Reload users to show changes
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to save user',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.isActive
      
      // TODO: Replace with actual API call
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `User ${user.name} has been ${newStatus ? 'activated' : 'deactivated'}`,
          color: newStatus ? 'green' : 'orange'
        })
        loadUsers() // Refresh the users list
      } else {
        throw new Error('Failed to update user status')
      }
    } catch (error) {
      notifications.show({
        title: 'Status Update',
        message: `User ${user.name} status would be ${!user.isActive ? 'activated' : 'deactivated'}`,
        color: 'blue'
      })
      // Simulate status change for demo
      setTimeout(loadUsers, 1000)
    }
  }

  const handleManagePermissions = (user: User) => {
    setSelectedUserForPermissions(user)
    loadUserPermissions(user.id)
    setIsUserPermissionsModalOpen(true)
  }

  const handleDeleteUser = async (user: User) => {
    const confirmMessage = `Are you sure you want to delete user "${user.name}" (${user.email})?\n\nThis action cannot be undone and will:\n- Permanently remove the user account\n- Remove all user roles and permissions\n- Deactivate all related data\n\nType "DELETE" to confirm:`
    
    const confirmation = prompt(confirmMessage)
    if (confirmation !== 'DELETE') {
      return
    }

    try {
      const response = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Delete response data:', data)
        
        notifications.show({
          title: 'Success',
          message: data.message || `User ${user.name} has been deleted successfully`,
          color: 'green'
        })
        
        // Automatically refresh the page after successful deletion
        setTimeout(() => {
          window.location.reload()
        }, 1500) // Allow time for success notification to be seen
        
        // Close user permissions modal if this user was selected
        if (selectedUserForPermissions?.id === user.id) {
          setSelectedUserForPermissions(null)
        }
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Delete error response:', data)
        
        notifications.show({
          title: 'Error',
          message: data.error || `Failed to delete user (Status: ${response.status})`,
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Delete request error:', error)
      notifications.show({
        title: 'Error',
        message: `Failed to connect to server: ${error instanceof Error ? error.message : 'Unknown error'}`,
        color: 'red'
      })
    }
  }

  const handleApplyTemplate = async (userId: number, templateId: number) => {
    try {
      const response = await fetch('/api/user-permissions/apply-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, templateId, mode: 'additive' })
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Permission template applied successfully',
          color: 'green'
        })
        loadUserPermissions(userId)
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to apply template',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handleCompleteRevokePermissions = async (userId: number) => {
    try {
      // Get all user's direct permissions first
      const permissionsResponse = await fetch(`/api/user-permissions?user_id=${userId}`)
      const permissionsData = await permissionsResponse.json()
      
      if (!permissionsResponse.ok || !permissionsData.permissions) {
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch user permissions',
          color: 'red'
        })
        return
      }

      // Delete each direct permission
      const deletePromises = permissionsData.permissions.map((permission: any) =>
        fetch(`/api/user-permissions?id=${permission.id}`, {
          method: 'DELETE'
        })
      )

      const deleteResults = await Promise.all(deletePromises)
      const failedDeletes = deleteResults.filter(result => !result.ok)

      if (failedDeletes.length === 0) {
        notifications.show({
          title: 'Success',
          message: `All ${permissionsData.permissions.length} template permissions revoked successfully`,
          color: 'green'
        })
        loadUserPermissions(userId)
      } else {
        notifications.show({
          title: 'Partial Success',
          message: `${deleteResults.length - failedDeletes.length} permissions revoked, ${failedDeletes.length} failed`,
          color: 'yellow'
        })
        loadUserPermissions(userId)
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to revoke permissions',
        color: 'red'
      })
    }
  }

  const getRoleBadgeColor = (level: number) => {
    switch (level) {
      case 1: return 'red'      // Owner - Red (Highest Authority)
      case 2: return 'purple'   // Admin - Purple (High Authority) 
      case 3: return 'blue'     // Level 3 - Blue (Commission Users)
      case 4: return 'green'    // Level 4 - Green (Standard Users)
      case 5: return 'gray'     // Level 5+ - Gray (Limited Access)
      default: return 'gray'
    }
  }

  const getRoleGradient = (level: number) => {
    switch (level) {
      case 1: return { from: 'red.6', to: 'pink.5', deg: 135 }      // Owner - Red to Pink
      case 2: return { from: 'purple.6', to: 'violet.5', deg: 135 }  // Admin - Purple to Violet
      case 3: return { from: 'blue.6', to: 'cyan.5', deg: 135 }      // Level 3 - Blue to Cyan
      case 4: return { from: 'green.6', to: 'teal.5', deg: 135 }     // Level 4 - Green to Teal
      case 5: return { from: 'gray.6', to: 'gray.4', deg: 135 }      // Level 5+ - Gray gradient
      default: return { from: 'gray.6', to: 'gray.4', deg: 135 }
    }
  }

  const getStatusGradient = (isActive: boolean) => {
    if (isActive) {
      return { from: 'green.6', to: 'lime.5', deg: 135 }  // Active - Green to Lime
    } else {
      return { from: 'red.6', to: 'orange.5', deg: 135 }  // Inactive - Red to Orange
    }
  }

  // Filter users based on current filter criteria
  const filteredUsers = users.filter((user) => {
    // Level filter: Only show users with level ≤4
    if (user.primary_role && user.primary_role.level > 4) {
      return false
    }
    
    // Search filter
    if (userFilters.search) {
      const searchTerm = userFilters.search.toLowerCase()
      let matchFound = false
      
      switch (userFilters.searchBy) {
        case 'name':
          matchFound = user.name.toLowerCase().includes(searchTerm)
          break
        case 'id':
          matchFound = user.id.toString().includes(searchTerm)
          break
        case 'mobile':
          matchFound = (user.phone || '').toLowerCase().includes(searchTerm)
          break
        case 'email':
          matchFound = user.email.toLowerCase().includes(searchTerm)
          break
        default:
          // Search in all fields
          matchFound = user.name.toLowerCase().includes(searchTerm) ||
                      user.id.toString().includes(searchTerm) ||
                      (user.phone || '').toLowerCase().includes(searchTerm) ||
                      user.email.toLowerCase().includes(searchTerm)
      }
      
      if (!matchFound) return false
    }
    
    // Role filter
    if (userFilters.role) {
      if (!user.primary_role || user.primary_role.name !== userFilters.role) {
        return false
      }
    }
    
    // Status filter
    if (userFilters.status) {
      if (userFilters.status === 'active' && !user.isActive) return false
      if (userFilters.status === 'inactive' && user.isActive) return false
    }
    
    return true
  })

  const handleRoleSave = async (roleData: any) => {
    try {
      const url = '/api/roles'
      const method = roleData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData)
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Role ${roleData.id ? 'updated' : 'created'} successfully`,
          color: 'green'
        })
        loadRoles()
        setSelectedRole(null)
        setIsRoleModalOpen(false)
      } else {
        notifications.show({
          title: 'Error', 
          message: data.error || 'Operation failed',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handleRoleDelete = async (roleId: number) => {
    try {
      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Role deleted successfully',
          color: 'green'
        })
        loadRoles()
        setSelectedRole(null)
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to delete role',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handleApplyTemplateToRole = async (roleId: number, templateId: number) => {
    try {
      const template = permissionTemplates.find(t => t.id === templateId)
      if (!template) {
        notifications.show({
          title: 'Error',
          message: 'Template not found',
          color: 'red'
        })
        return
      }

      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roleId,
          permissions: template.permissions
        })
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Permission template "${template.name}" applied to role successfully`,
          color: 'green'
        })
        loadRoles() // Reload roles to show updated permission count
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to apply template to role',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handlePermissionSave = async (permissionData: any) => {
    try {
      const url = '/api/permissions'
      const method = permissionData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionData)
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Permission ${permissionData.id ? 'updated' : 'created'} successfully`,
          color: 'green'
        })
        loadPermissions() // Reload permissions
        setSelectedPermission(null)
        setIsPermissionModalOpen(false)
      } else {
        notifications.show({
          title: 'Error', 
          message: data.error || 'Operation failed',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handlePermissionDelete = async (permissionId: number) => {
    try {
      const response = await fetch(`/api/permissions?id=${permissionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Permission deleted successfully',
          color: 'green'
        })
        loadPermissions()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to delete permission',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handleTemplateSave = async (templateData: any) => {
    try {
      const url = '/api/permission-templates'
      const method = templateData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Template ${templateData.id ? 'updated' : 'created'} successfully`,
          color: 'green'
        })
        loadPermissionTemplates() // Reload templates
        setSelectedTemplate(null)
        setIsTemplateModalOpen(false)
      } else {
        notifications.show({
          title: 'Error', 
          message: data.error || 'Operation failed',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handleTemplateDelete = async (templateId: number) => {
    try {
      const response = await fetch(`/api/permission-templates?id=${templateId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Template deleted successfully',
          color: 'green'
        })
        loadPermissionTemplates()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to delete template',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  if (loading && users.length === 0) {
    return (
      <Box ta="center" p="xl">
        <Loader size="xs" />
        <Text mt="md">Loading user management system...</Text>
      </Box>
    )
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="md">
              <Box component={FiUsers} size={28} c="blue.6" />
              <Title order={2} c="dark.8" fw={600}>
                User Management System
              </Title>
            </Group>
            <Text c="dimmed">
              Complete user permission hierarchy: User Permissions ⟹ Roles ⟹ Users
            </Text>
          </Stack>
          <Badge color="blue" size="xs">
            Hierarchy System
          </Badge>
        </Group>
      </Card>

      {/* Enhanced Stats Cards with Real Data */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.03) 100%)',
            border: '2px solid rgba(59, 130, 246, 0.15)'
          }}
        >
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiUsers} size={24} c="blue.5" />
              <Text size="1.75rem" fw={700} c="blue.6">
                {statsLoading ? '-' : userStats.total.toLocaleString()}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" ta="center">Total Users</Text>
            <Text size="xs" c="blue.6" ta="center" fw={500}>
              {statsLoading ? '' : `+${userStats.newThisMonth} this month`}
            </Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(134, 239, 172, 0.03) 100%)',
            border: '2px solid rgba(34, 197, 94, 0.15)'
          }}
        >
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiUserCheck} size={24} c="green.5" />
              <Text size="1.75rem" fw={700} c="green.6">
                {statsLoading ? '-' : userStats.active.toLocaleString()}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" ta="center">Active Users</Text>
            <Text size="xs" c="green.6" ta="center" fw={500}>
              {statsLoading ? '' : `${Math.round((userStats.active / Math.max(userStats.total, 1)) * 100)}% of total`}
            </Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(254, 215, 170, 0.03) 100%)',
            border: '2px solid rgba(251, 146, 60, 0.15)'
          }}
        >
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiShield} size={24} c="orange.5" />
              <Text size="1.75rem" fw={700} c="orange.6">
                {statsLoading ? '-' : userStats.staffUsers.toLocaleString()}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" ta="center">Staff Users</Text>
            <Text size="xs" c="orange.6" ta="center" fw={500}>
              {statsLoading ? '' : `${roles.length} roles`}
            </Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(252, 165, 165, 0.03) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.15)'
          }}
        >
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiUserX} size={24} c="red.5" />
              <Text size="1.75rem" fw={700} c="red.6">
                {statsLoading ? '-' : (userStats.blocked + userStats.pending).toLocaleString()}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" ta="center">Inactive Users</Text>
            <Text size="xs" c="red.6" ta="center" fw={500}>
              {statsLoading ? '' : `${userStats.blocked} blocked, ${userStats.pending} pending`}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Main Tabs */}
      <Card shadow="sm" radius="md" withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List bg="gray.1" p="md">
            <Tabs.Tab value="users">
              <Group gap="xs">
                <Box component={FiUsers} size={16} />
                <Text>Users</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="permissions">
              <Group gap="xs">
                <Box component={FiKey} size={16} />
                <Text>Permissions</Text>
              </Group>
            </Tabs.Tab>
          </Tabs.List>

          {/* Users Tab */}
          <Tabs.Panel value="users" p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>User Management</Title>
                {hasPermission('users.create') && (
                  <Button
                    leftSection={<Box component={FiPlus} />}
                    onClick={() => setIsUserModalOpen(true)}
                    color="blue"
                  >
                    Add User
                  </Button>
                )}
              </Group>

              {/* User Filters */}
              <Card withBorder p="md">
                <Title order={5} mb="md">Filters</Title>
                <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md">
                  <TextInput
                    label="Search"
                    placeholder={`Search by ${userFilters.searchBy}...`}
                    value={userFilters.search}
                    onChange={(event) => setUserFilters({...userFilters, search: event.currentTarget.value})}
                  />
                  <Select
                    label="Search By"
                    value={userFilters.searchBy}
                    onChange={(value) => setUserFilters({...userFilters, searchBy: value || 'name'})}
                    data={[
                      { value: 'name', label: 'Name' },
                      { value: 'id', label: 'User ID' },
                      { value: 'mobile', label: 'Mobile/Phone' },
                      { value: 'email', label: 'Email' }
                    ]}
                  />
                  <Select
                    label="Role"
                    placeholder="All roles"
                    value={userFilters.role}
                    onChange={(value) => setUserFilters({...userFilters, role: value || ''})}
                    data={[
                      { value: '', label: 'All roles' },
                      ...roles.map(role => ({
                        value: role.name,
                        label: `${role.name} (Level ${role.level})`
                      }))
                    ]}
                    clearable
                  />
                  <Select
                    label="Status"
                    placeholder="All statuses"
                    value={userFilters.status}
                    onChange={(value) => setUserFilters({...userFilters, status: value || ''})}
                    data={[
                      { value: '', label: 'All statuses' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                    clearable
                  />
                </SimpleGrid>
                
                {/* Filter Summary */}
                <Group justify="space-between" mt="md">
                  <Text size="xs" c="dimmed">
                    Showing {filteredUsers.length} of {users.length} users
                  </Text>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => setUserFilters({ search: '', searchBy: 'name', role: '', status: '' })}
                    color="gray"
                  >
                    Clear Filters
                  </Button>
                </Group>
              </Card>

              <Card 
                withBorder
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                  border: '1px solid rgba(226, 232, 240, 0.6)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02)',
                  overflow: 'hidden'
                }}
              >
                <Table.ScrollContainer minWidth={1000}>
                  <Table 
                    striped 
                    highlightOnHover
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      borderSpacing: '0 2px',
                      borderCollapse: 'separate'
                    }}
                  >
                  <Table.Thead
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                      borderBottom: '2px solid rgba(59, 130, 246, 0.1)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10
                    }}
                  >
                    <Table.Tr>
                      <Table.Th style={{ 
                        fontWeight: 700, 
                        color: 'var(--mantine-color-blue-7)', 
                        padding: '12px 10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '180px'
                      }}>User</Table.Th>
                      <Table.Th style={{ 
                        fontWeight: 700, 
                        color: 'var(--mantine-color-blue-7)', 
                        padding: '12px 10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}>ID</Table.Th>
                      <Table.Th style={{ 
                        fontWeight: 700, 
                        color: 'var(--mantine-color-blue-7)', 
                        padding: '12px 10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '200px'
                      }}>Email</Table.Th>
                      <Table.Th style={{ 
                        fontWeight: 700, 
                        color: 'var(--mantine-color-blue-7)', 
                        padding: '12px 10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '140px'
                      }}>Mobile/Phone</Table.Th>
                      <Table.Th style={{ 
                        fontWeight: 700, 
                        color: 'var(--mantine-color-blue-7)', 
                        padding: '12px 10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '120px',
                        textAlign: 'center'
                      }}>Primary Role</Table.Th>
                      <Table.Th style={{ 
                        fontWeight: 700, 
                        color: 'var(--mantine-color-blue-7)', 
                        padding: '12px 10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '100px',
                        textAlign: 'center'
                      }}>Commission</Table.Th>
                      <Table.Th style={{ 
                        fontWeight: 700, 
                        color: 'var(--mantine-color-blue-7)', 
                        padding: '12px 10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '100px',
                        textAlign: 'center'
                      }}>Status</Table.Th>
                      <Table.Th style={{ 
                        fontWeight: 700, 
                        color: 'var(--mantine-color-blue-7)', 
                        padding: '12px 10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '120px',
                        textAlign: 'center'
                      }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredUsers.map((user, index) => (
                      <Table.Tr 
                        key={user.id}
                        style={{
                          borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
                          background: index % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white',
                          transition: 'all 0.2s ease',
                          height: '60px'
                        }}
                        onMouseEnter={(e: any) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)'
                          e.currentTarget.style.transform = 'scale(1.002)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseLeave={(e: any) => {
                          e.currentTarget.style.background = index % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white'
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                          <Group gap="xs">
                            <Box
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '6px',
                                backgroundColor: '#339af0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              {user.name?.charAt(0) || 'U'}
                            </Box>
                            <Stack gap={1}>
                              <Text fw={600} size="xs">{user.name}</Text>
                              <Text size="xs" c="dimmed">{user.dealer_code}</Text>
                            </Stack>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <Box
                            style={{
                              padding: '4px 8px',
                              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                              borderRadius: '8px',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              display: 'inline-block'
                            }}
                          >
                            <Text size="xs" fw={700} c="blue.7">{user.id}</Text>
                          </Box>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                          <Text size="xs" fw={500}>{user.email}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                          <Text size="xs" fw={500}>{user.phone || 'Not provided'}</Text>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                          {user.primary_role ? (
                            <Badge 
                              variant="gradient"
                              gradient={getRoleGradient(user.primary_role.level)}
                              size="xs"
                              style={{
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                padding: '6px 12px',
                                boxShadow: `0 4px 12px rgba(var(--mantine-color-${getRoleBadgeColor(user.primary_role.level)}-6-rgb), 0.4)`,
                                border: `1px solid rgba(var(--mantine-color-${getRoleBadgeColor(user.primary_role.level)}-4-rgb), 0.3)`,
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {user.primary_role.name}
                            </Badge>
                          ) : (
                            <Badge 
                              variant="light" 
                              color="gray" 
                              size="xs"
                              style={{
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              No Role
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                          {user.primary_role?.level === 3 ? (
                            <Group gap="xs" justify="center">
                              <Badge 
                                variant="gradient"
                                gradient={{ from: 'green.6', to: 'teal.5', deg: 135 }}
                                size="xs"
                                style={{
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.8px',
                                  padding: '4px 10px',
                                  boxShadow: '0 3px 10px rgba(34, 197, 94, 0.35)',
                                  border: '1px solid rgba(34, 197, 94, 0.25)',
                                }}
                              >
                                💰 {user.commission_rate || 0}%
                              </Badge>
                              <Badge 
                                variant="filled" 
                                color="blue" 
                                size="xs"
                                style={{
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                }}
                              >
                                L3
                              </Badge>
                            </Group>
                          ) : (
                            <Badge 
                              variant="light" 
                              color="gray" 
                              size="xs"
                              style={{
                                fontWeight: 500,
                                letterSpacing: '0.5px'
                              }}
                            >
                              N/A
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <Badge 
                            variant="gradient"
                            gradient={getStatusGradient(user.isActive)}
                            size="xs"
                            style={{
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.8px',
                              padding: '6px 12px',
                              boxShadow: user.isActive 
                                ? '0 4px 12px rgba(34, 197, 94, 0.4)' 
                                : '0 4px 12px rgba(239, 68, 68, 0.4)',
                              border: user.isActive 
                                ? '1px solid rgba(34, 197, 94, 0.3)' 
                                : '1px solid rgba(239, 68, 68, 0.3)',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <span style={{ 
                              position: 'relative', 
                              zIndex: 1,
                              textShadow: '0 1px 2px rgba(0,0,0,0.1)' 
                            }}>
                              {user.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                            </span>
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <Group gap="xs" justify="center">
                            {/* Quick Actions */}
                            {hasPermission('users.read') && (
                              <Tooltip label="View user details">
                                <ActionIcon
                                  size="xs"
                                  variant="gradient"
                                  gradient={{ from: 'blue.5', to: 'cyan.4', deg: 135 }}
                                  onClick={() => setSelectedUser(user)}
                                  style={{
                                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '6px'
                                  }}
                                >
                                  <Box component={FiEye} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                            
                            {hasPermission('users.update') && (
                              <Tooltip label="Edit user">
                                <ActionIcon
                                  size="xs"
                                  variant="gradient"
                                  gradient={{ from: 'orange.5', to: 'yellow.4', deg: 135 }}
                                  style={{
                                    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '6px'
                                  }}
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsUserModalOpen(true)
                                  }}
                                >
                                  <Box component={FiEdit3} />
                                </ActionIcon>
                              </Tooltip>
                            )}

                            {/* More Actions Menu */}
                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <Tooltip label="More actions">
                                  <ActionIcon 
                                    size="xs"
                                    variant="gradient"
                                    gradient={{ from: 'gray.5', to: 'gray.4', deg: 135 }}
                                    style={{
                                      boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)',
                                      transition: 'all 0.2s ease',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    <Box component={FiMoreVertical} />
                                  </ActionIcon>
                                </Tooltip>
                              </Menu.Target>

                              <Menu.Dropdown>
                                {/* Status Toggle */}
                                {user.isActive ? (
                                  hasPermission('users.suspend') && (
                                    <Menu.Item
                                      color="orange"
                                      onClick={() => handleToggleUserStatus(user)}
                                      leftSection={<Box component={FiUserX} size={14} />}
                                    >
                                      Deactivate User
                                    </Menu.Item>
                                  )
                                ) : (
                                  hasPermission('users.activate') && (
                                    <Menu.Item
                                      color="green"
                                      onClick={() => handleToggleUserStatus(user)}
                                      leftSection={<Box component={FiUserCheck} size={14} />}
                                    >
                                      Activate User
                                    </Menu.Item>
                                  )
                                )}

                                {/* Permission Management */}
                                {hasPermission('permissions.manage') && (
                                  <Menu.Item
                                    onClick={() => handleManagePermissions(user)}
                                    leftSection={<Box component={FiKey} size={14} />}
                                  >
                                    Manage Permissions
                                  </Menu.Item>
                                )}

                                {/* Apply Permission Template */}
                                {hasPermission('permissions.manage') && permissionTemplates.length > 0 && (
                                  <Menu.Label>Permission Templates</Menu.Label>
                                )}
                                {hasPermission('permissions.manage') && permissionTemplates.slice(0, 3).map((template) => (
                                  <Menu.Item
                                    key={template.id}
                                    onClick={() => handleApplyTemplate(user.id, template.id)}
                                    leftSection={<Box component={FiSettings} size={14} />}
                                  >
                                    Apply: {template.name}
                                  </Menu.Item>
                                ))}

                                <Menu.Divider />

                                {/* Delete */}
                                {hasPermission('users.delete') && !user.roles?.some(role => role.level === 1) && (
                                  <Menu.Item
                                    color="red"
                                    onClick={() => handleDeleteUser(user)}
                                    leftSection={<Box component={FiTrash2} size={14} />}
                                  >
                                    Delete User
                                  </Menu.Item>
                                )}
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* Roles Tab */}
          <Tabs.Panel value="roles" p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Role Management</Title>
                {hasPermission('roles.create') && (
                  <Button
                    leftSection={<Box component={FiPlus} />}
                    onClick={() => setIsRoleModalOpen(true)}
                    color="violet"
                  >
                    Add Role
                  </Button>
                )}
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                {roles.map((role) => (
                  <Card key={role.id} shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Badge 
                          color={getRoleBadgeColor(role.level)} 
                          size="xs"
                          variant="filled"
                        >
                          Level {role.level}
                        </Badge>
                        {role.is_system && (
                          <Badge color="gray" variant="outline" size="xs">
                            System
                          </Badge>
                        )}
                      </Group>

                      <Stack gap="xs">
                        <Title order={5}>{role.name}</Title>
                        <Text size="xs" c="dimmed">{role.description}</Text>
                      </Stack>

                      <Group justify="space-between">
                        <Text size="xs">
                          <strong>{role.user_count}</strong> users
                        </Text>
                        <Text size="xs">
                          <strong>{role.permissions?.length || 0}</strong> permissions
                        </Text>
                      </Group>

                      <Group gap="xs">
                        <Button
                          variant="subtle"
                          size="xs"
                          leftSection={<Box component={FiEye} />}
                          onClick={() => setSelectedRole(role)}
                          color="blue"
                        >
                          View
                        </Button>
                        {!role.is_system && (
                          <>
                            <Button
                              variant="subtle"
                              size="xs"
                              color="yellow"
                              leftSection={<Box component={FiEdit3} />}
                              onClick={() => {
                                setSelectedRole(role)
                                setIsRoleModalOpen(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Menu shadow="md" width={220}>
                              <Menu.Target>
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  color="green"
                                  leftSection={<Box component={FiSettings} />}
                                >
                                  Templates
                                </Button>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Apply Permission Template</Menu.Label>
                                {permissionTemplates.map((template) => (
                                  <Menu.Item
                                    key={template.id}
                                    leftSection={<Box component={FiKey} size={14} />}
                                    onClick={() => handleApplyTemplateToRole(role.id, template.id)}
                                  >
                                    <Stack gap={2}>
                                      <Text size="xs" fw={500}>{template.name}</Text>
                                      <Text size="xs" c="dimmed">
                                        {template.permissions.length} permissions
                                      </Text>
                                    </Stack>
                                  </Menu.Item>
                                ))}
                                {permissionTemplates.length === 0 && (
                                  <Menu.Item disabled>
                                    <Text size="xs" c="dimmed">No templates available</Text>
                                  </Menu.Item>
                                )}
                              </Menu.Dropdown>
                            </Menu>
                          </>
                        )}
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          {/* Permissions Tab */}
          <Tabs.Panel value="permissions" p="md">
            <Tabs defaultValue="templates">
              <Tabs.List>
                <Tabs.Tab value="templates">Permission Templates</Tabs.Tab>
                <Tabs.Tab value="user-permissions">User Permissions</Tabs.Tab>
              </Tabs.List>

              {/* Permission Templates Sub-tab */}
              <Tabs.Panel value="templates" pt="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={4}>Permission Templates</Title>
                    {hasPermission('permissions.create') && (
                      <Button
                        leftSection={<Box component={FiPlus} />}
                        onClick={() => setIsTemplateModalOpen(true)}
                      >
                        Create Template
                      </Button>
                    )}
                  </Group>

                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                    {permissionTemplates.map((template) => (
                      <Card key={template.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Stack gap="md">
                          <Group justify="space-between">
                            <Title order={5}>{template.name}</Title>
                            {template.is_system && (
                              <Badge color="blue" variant="outline" size="xs">
                                System
                              </Badge>
                            )}
                          </Group>

                          <Text size="xs" c="dimmed">{template.description}</Text>

                          <Group justify="space-between">
                            <Text size="xs">
                              <strong>{template.permissions.length}</strong> permissions
                            </Text>
                          </Group>

                          <Group gap="xs">
                            <Button
                              variant="subtle"
                              size="xs"
                              leftSection={<Box component={FiEye} />}
                              onClick={() => setSelectedTemplate(template)}
                            >
                              View
                            </Button>
                            {!template.is_system && (
                              <>
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  color="yellow"
                                  leftSection={<Box component={FiEdit3} />}
                                  onClick={() => {
                                    setSelectedTemplate(template)
                                    setIsTemplateModalOpen(true)
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  color="red"
                                  leftSection={<Box component={FiTrash2} />}
                                  onClick={() => {
                                    if (confirm(`Delete template "${template.name}"?`)) {
                                      handleTemplateDelete(template.id)
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Tabs.Panel>

              {/* User Permissions Sub-tab */}
              <Tabs.Panel value="user-permissions" pt="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={4}>User Permission Management</Title>
                  </Group>

                  <Card withBorder>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>User</Table.Th>
                          <Table.Th>Email</Table.Th>
                          <Table.Th>Role Permissions</Table.Th>
                          <Table.Th>Direct Permissions</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {users.map((user) => (
                          <Table.Tr key={user.id}>
                            <Table.Td>
                              <Group gap="md">
                                <Box
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '6px',
                                    backgroundColor: '#339af0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 600
                                  }}
                                >
                                  {user.name?.charAt(0) || 'U'}
                                </Box>
                                <Stack gap="xs">
                                  <Text fw={500}>{user.name}</Text>
                                  <Text size="xs" c="dimmed">{user.dealer_code}</Text>
                                </Stack>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs">{user.email}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="blue" variant="outline">
                                {user.role_permissions_count || 0} from roles
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="green" variant="outline">
                                {user.direct_permissions_count || 0} direct
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <ActionIcon
                                  variant="subtle"
                                  color="blue"
                                  onClick={() => {
                                    setSelectedUserForPermissions(user)
                                    loadUserPermissions(user.id)
                                    setIsUserPermissionsModalOpen(true)
                                  }}
                                >
                                  <Box component={FiKey} />
                                </ActionIcon>
                                <Menu shadow="md" width={200}>
                                  <Menu.Target>
                                    <ActionIcon
                                      variant="subtle"
                                      color="green"
                                    >
                                      <Box component={FiSettings} />
                                    </ActionIcon>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Label>Apply Template</Menu.Label>
                                    {permissionTemplates.map((template) => (
                                      <Menu.Item
                                        key={template.id}
                                        onClick={() => handleApplyTemplate(user.id, template.id)}
                                      >
                                        {template.name}
                                      </Menu.Item>
                                    ))}
                                  </Menu.Dropdown>
                                </Menu>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Card>
                </Stack>
              </Tabs.Panel>

            </Tabs>
          </Tabs.Panel>

        </Tabs>
      </Card>

      {/* User Detail Modal */}
      <Modal
        opened={!!selectedUser && !isUserModalOpen}
        onClose={() => setSelectedUser(null)}
        title={`User Details: ${selectedUser?.name}`}
        size="xs"
      >
        {selectedUser && (
          <Stack gap="md">
            {/* User Initial */}
            <Group justify="center">
              <Box
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '12px',
                  backgroundColor: '#339af0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 700
                }}
              >
                {selectedUser.name?.charAt(0) || 'U'}
              </Box>
            </Group>

            <SimpleGrid cols={2} spacing="md">
              <Stack gap="xs">
                <Text size="xs" c="dimmed">User ID</Text>
                <Text fw={500} c="blue">{selectedUser.id}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Email</Text>
                <Text>{selectedUser.email}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Phone/Mobile</Text>
                <Text>{selectedUser.phone || 'Not provided'}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Dealer Code</Text>
                <Text>{selectedUser.dealer_code || 'Not assigned'}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Language</Text>
                <Text>{selectedUser.language || 'English'}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Address</Text>
                <Text>{selectedUser.address || 'Not provided'}</Text>
              </Stack>
            </SimpleGrid>

            <Divider />

            <Stack gap="xs">
              <Text fw={500}>Assigned Roles</Text>
              <Group gap="xs">
                {selectedUser.roles?.map((role) => (
                  <Badge 
                    key={role.id} 
                    variant="gradient"
                    gradient={getRoleGradient(role.level)}
                    size="sm"
                    style={{
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: `0 2px 8px rgba(var(--mantine-color-${getRoleBadgeColor(role.level)}-6-rgb), 0.3)`
                    }}
                  >
                    {role.name}
                  </Badge>
                )) || <Text size="xs" c="dimmed">No roles assigned</Text>}
              </Group>
            </Stack>

            {/* Commission Information for Level 3 users */}
            {selectedUser.roles?.some(role => role.level === 3) && (
              <>
                <Divider />
                <Stack gap="xs">
                  <Group gap="xs">
                    <Text fw={500}>Commission Settings</Text>
                    <Badge color="green" variant="light" size="xs">Level 3 User</Badge>
                  </Group>
                  <SimpleGrid cols={2} spacing="md">
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">Commission Rate</Text>
                      <Group gap="xs">
                        <Text fw={500} c="green.7" size="xs">
                          {selectedUser.commission_rate || 0}%
                        </Text>
                        <Badge color="blue" variant="outline" size="xs">
                          Per Transaction
                        </Badge>
                      </Group>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">Commission Type</Text>
                      <Text size="xs" c="dimmed">
                        Percentage of customer payments
                      </Text>
                    </Stack>
                  </SimpleGrid>
                  <Alert color="blue" size="xs" title="Commission Info">
                    <Text size="xs">
                      This user earns {selectedUser.commission_rate || 0}% commission on all payments made by their customers. 
                      Commission is automatically calculated and credited to their account.
                    </Text>
                  </Alert>
                </Stack>
              </>
            )}

            <Divider />

            <Stack gap="xs">
              <Text fw={500}>Effective Permissions</Text>
              <Text size="xs" c="dimmed">
                {selectedUser.permissions?.length || 0} permissions from roles and direct assignments
              </Text>
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* Role View/Edit Modal */}
      <RoleModal
        opened={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        role={selectedRole}
        permissions={permissions}
        isEditMode={isRoleModalOpen}
        onSave={handleRoleSave}
        onDelete={handleRoleDelete}
      />

      {/* Role Create Modal */}
      <RoleModal
        opened={isRoleModalOpen && !selectedRole}
        onClose={() => setIsRoleModalOpen(false)}
        role={null}
        permissions={permissions}
        isEditMode={true}
        onSave={handleRoleSave}
      />

      {/* User Permissions Modal */}
      <Modal
        opened={isUserPermissionsModalOpen}
        onClose={() => {
          setIsUserPermissionsModalOpen(false)
          setSelectedUserForPermissions(null)
          setUserPermissions([])
        }}
        title={`Template-based Permissions: ${selectedUserForPermissions?.name}`}
        size="xl"
      >
        {selectedUserForPermissions && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Managing template-based permissions for {selectedUserForPermissions.email}
              </Text>
              <Badge variant="outline" color="blue">
                {userPermissions.length} template permissions
              </Badge>
            </Group>

            <Divider />

            {userPermissions.length > 0 ? (
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Permission</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th>Assigned</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {userPermissions.map((userPerm, index) => (
                    <Table.Tr key={`${userPerm.permission_id || userPerm.permission_name || 'unknown'}-${index}`}>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text size="xs" fw={500}>{userPerm.permission_name}</Text>
                          <Text size="xs" c="dimmed">{userPerm.permission_description}</Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" size="xs" color="gray">
                          {userPerm.permission_category}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={userPerm.granted ? 'green' : 'red'} 
                          variant="filled" 
                          size="xs"
                        >
                          {userPerm.granted ? 'Granted' : 'Denied'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {userPerm.reason || 'No reason specified'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(userPerm.assigned_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          size="xs"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/user-permissions?id=${userPerm.id}`, {
                                method: 'DELETE'
                              })
                              if (response.ok) {
                                notifications.show({
                                  title: 'Success',
                                  message: 'Permission removed successfully',
                                  color: 'green'
                                })
                                loadUserPermissions(selectedUserForPermissions.id)
                                loadUsers() // Refresh user list to update counts
                              } else {
                                const errorData = await response.json()
                                notifications.show({
                                  title: 'Error',
                                  message: errorData.error || 'Failed to remove permission',
                                  color: 'red'
                                })
                              }
                            } catch (error) {
                              notifications.show({
                                title: 'Error',
                                message: 'Failed to remove permission',
                                color: 'red'
                              })
                            }
                          }}
                        >
                          <Box component={FiTrash2} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Alert color="blue" title="No Template Permissions">
                <Text size="xs">
                  This user has no template-based permissions assigned. 
                  You can apply a permission template from the main User Permissions tab to grant bulk permissions.
                </Text>
              </Alert>
            )}

            <Group justify="space-between" mt="md">
              <Text size="xs" c="dimmed">
                Template-based Permissions: {userPermissions.length}
              </Text>
              <Group>
                <Button 
                  variant="filled" 
                  color="red"
                  leftSection={<Box component={FiTrash2} />}
                  onClick={() => {
                    if (selectedUserForPermissions && window.confirm(
                      `Are you sure you want to revoke all template permissions for ${selectedUserForPermissions.name}? This will remove ${userPermissions.length} template-based permissions.`
                    )) {
                      handleCompleteRevokePermissions(selectedUserForPermissions.id)
                    }
                  }}
                  disabled={userPermissions.length === 0}
                >
                  Revoke All Template Permissions
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsUserPermissionsModalOpen(false)
                    setSelectedUserForPermissions(null)
                    setUserPermissions([])
                  }}
                >
                  Close
                </Button>
              </Group>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Permission Detail Modal */}
      <Modal
        opened={!!selectedPermission && !isPermissionModalOpen}
        onClose={() => setSelectedPermission(null)}
        title={`Permission Details: ${selectedPermission?.name}`}
        size="xs"
      >
        {selectedPermission && (
          <Stack gap="md">
            <SimpleGrid cols={2} spacing="md">
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Name</Text>
                <Text fw={500}>{selectedPermission.name}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Category</Text>
                <Badge variant="outline" color="violet">{selectedPermission.category}</Badge>
              </Stack>
            </SimpleGrid>

            <SimpleGrid cols={2} spacing="md">
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Resource</Text>
                <Badge color="blue" variant="light">{selectedPermission.resource}</Badge>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Action</Text>
                <Badge color="green" variant="light">{selectedPermission.action}</Badge>
              </Stack>
            </SimpleGrid>

            <Stack gap="xs">
              <Text size="xs" c="dimmed">Description</Text>
              <Text>{selectedPermission.description || 'No description available'}</Text>
            </Stack>

            <Divider />

            <SimpleGrid cols={2} spacing="md">
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Assigned to Roles</Text>
                <Badge color="blue" variant="outline">{selectedPermission.role_count} roles</Badge>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Direct User Assignments</Text>
                <Badge color="green" variant="outline">{selectedPermission.user_count} users</Badge>
              </Stack>
            </SimpleGrid>

            <Stack gap="xs">
              <Text size="xs" c="dimmed">Type</Text>
              <Badge color={selectedPermission.is_system ? 'red' : 'green'} variant="outline">
                {selectedPermission.is_system ? 'System Permission' : 'Custom Permission'}
              </Badge>
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* Template Detail Modal */}
      <Modal
        opened={!!selectedTemplate && !isTemplateModalOpen}
        onClose={() => setSelectedTemplate(null)}
        title={`Template Details: ${selectedTemplate?.name}`}
        size="xl"
      >
        {selectedTemplate && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">{selectedTemplate.description}</Text>
              <Badge color={selectedTemplate.is_system ? 'blue' : 'green'} variant="outline">
                {selectedTemplate.is_system ? 'System Template' : 'Custom Template'}
              </Badge>
            </Group>

            <Divider />

            <Stack gap="xs">
              <Text fw={500}>Included Permissions ({selectedTemplate.permissions.length})</Text>
              {selectedTemplate.permission_details && (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
                  {selectedTemplate.permission_details.map((perm: any) => (
                    <Card key={perm.id} p="xs" withBorder radius="sm">
                      <Group justify="space-between">
                        <Stack gap={2}>
                          <Text size="xs" fw={500}>{perm.name}</Text>
                          <Text size="xs" c="dimmed">{perm.description}</Text>
                        </Stack>
                        <Badge size="xs" variant="outline">{perm.category}</Badge>
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* Permission Template Create/Edit Modal */}
      <Modal
        opened={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false)
          setSelectedTemplate(null)
        }}
        title={selectedTemplate ? `Edit Template: ${selectedTemplate.name}` : "Create Permission Template"}
        size="xl"
      >
        <PermissionTemplateModal
          template={selectedTemplate}
          permissions={permissions}
          onSave={handleTemplateSave}
          onClose={() => {
            setIsTemplateModalOpen(false)
            setSelectedTemplate(null)
          }}
        />
      </Modal>

      {/* Permission Create/Edit Modal */}
      <Modal
        opened={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false)
          setSelectedPermission(null)
        }}
        title={selectedPermission ? `Edit Permission: ${selectedPermission.name}` : "Create New Permission"}
        size="xs"
      >
        <PermissionFormModal
          permission={selectedPermission}
          permissions={permissions}
          onSave={handlePermissionSave}
          onClose={() => {
            setIsPermissionModalOpen(false)
            setSelectedPermission(null)
          }}
        />
      </Modal>

      {/* User Create/Edit Modal */}
      <Modal
        opened={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false)
          setSelectedUser(null)
        }}
        title={selectedUser ? `Edit User: ${selectedUser.name}` : "Create New User"}
        size="xl"
      >
        <UserFormModal
          user={selectedUser}
          roles={roles}
          currentUserRoles={currentUserRoles}
          onSave={handleUserSave}
          onClose={() => {
            setIsUserModalOpen(false)
            setSelectedUser(null)
          }}
        />
      </Modal>
    </Stack>
  )
}

// Export with permission guard
export default function UserManagementSystem() {
  // Permission check is now handled at the page level
  return <UserManagementSystemContent />
}