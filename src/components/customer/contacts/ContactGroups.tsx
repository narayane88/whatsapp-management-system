'use client'

import { useEffect, useState } from 'react'
import { 
  Stack,
  Group,
  Button,
  TextInput,
  Card,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Textarea,
  MultiSelect,
  Alert,
  LoadingOverlay,
  Grid,
  Avatar,
  Progress
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconInfoCircle,
  IconMessageCircle,
  IconUserPlus
} from '@tabler/icons-react'

interface ContactGroup {
  id: string
  name: string
  description?: string
  memberCount: number
  createdAt: string
  members?: GroupMember[]
}

interface GroupMember {
  id: string
  name: string
  phoneNumber: string
  avatar?: string
  joinedAt: string
}

interface GroupForm {
  name: string
  description: string
  contactIds: string[]
}

interface ContactsGroupsProps {
  onStatsChange: () => void
}

export default function ContactGroups({ onStatsChange }: ContactsGroupsProps) {
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [availableContacts, setAvailableContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null)
  
  const [opened, { open, close }] = useDisclosure(false)
  const [membersModalOpened, { open: openMembersModal, close: closeMembersModal }] = useDisclosure(false)

  const form = useForm<GroupForm>({
    initialValues: {
      name: '',
      description: '',
      contactIds: [],
    },
    validate: {
      name: (value) => (!value ? 'Group name is required' : null),
    },
  })

  useEffect(() => {
    fetchGroups()
    fetchAvailableContacts()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer/groups')
      if (response.ok) {
        const data = await response.json()
        // Map API response to component format
        const mappedGroups = data.data.map((group: any) => ({
          ...group,
          memberCount: group._count.contacts,
          members: group.contacts.map((m: any) => ({
            id: m.contact.id,
            name: m.contact.name,
            phoneNumber: m.contact.phoneNumber,
            joinedAt: group.createdAt
          }))
        }))
        setGroups(mappedGroups)
      } else {
        // Mock data for now
        setGroups([
          {
            id: '1',
            name: 'VIP Customers',
            description: 'High-value customers who receive priority support',
            memberCount: 25,
            createdAt: new Date().toISOString(),
            members: [
              {
                id: '1',
                name: 'John Smith',
                phoneNumber: '+1234567890',
                joinedAt: new Date().toISOString()
              },
              {
                id: '2',
                name: 'Jane Doe',
                phoneNumber: '+1234567891',
                joinedAt: new Date(Date.now() - 86400000).toISOString()
              }
            ]
          },
          {
            id: '2',
            name: 'Newsletter Subscribers',
            description: 'Customers who opted in for weekly newsletters',
            memberCount: 150,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            name: 'Support Leads',
            description: 'Potential customers from support inquiries',
            memberCount: 42,
            createdAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: '4',
            name: 'Product Updates',
            description: 'Users interested in product announcements',
            memberCount: 89,
            createdAt: new Date(Date.now() - 259200000).toISOString()
          },
          {
            id: '5',
            name: 'Beta Testers',
            description: 'Early adopters testing new features',
            memberCount: 15,
            createdAt: new Date(Date.now() - 432000000).toISOString()
          }
        ])
      }
    } catch (error) {
      console.error('Groups fetch error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load contact groups',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableContacts = async () => {
    try {
      const response = await fetch('/api/customer/contacts?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setAvailableContacts(data.data || [])
      } else {
        // Mock data for now
        setAvailableContacts([
          { id: '1', name: 'John Smith', phoneNumber: '+1234567890' },
          { id: '2', name: 'Jane Doe', phoneNumber: '+1234567891' },
          { id: '3', name: 'Bob Wilson', phoneNumber: '+1234567892' },
        ])
      }
    } catch (error) {
      console.error('Contacts fetch error:', error)
    }
  }

  const handleSubmit = async (values: GroupForm) => {
    try {
      const url = selectedGroup 
        ? `/api/customer/groups/${selectedGroup.id}` 
        : '/api/customer/groups'
      const method = selectedGroup ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: selectedGroup ? 'Group updated' : 'Group created',
          color: 'green',
        })
        close()
        form.reset()
        setSelectedGroup(null)
        fetchGroups()
        onStatsChange()
      } else {
        throw new Error('Failed to save group')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save group',
        color: 'red',
      })
    }
  }

  const handleEdit = (group: ContactGroup) => {
    setSelectedGroup(group)
    form.setValues({
      name: group.name,
      description: group.description || '',
      contactIds: group.members?.map(m => m.id) || [],
    })
    open()
  }

  const handleDelete = async (groupId: string) => {
    try {
      const response = await fetch(`/api/customer/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Group deleted',
          color: 'green',
        })
        fetchGroups()
        onStatsChange()
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete group',
        color: 'red',
      })
    }
  }

  const handleViewMembers = (group: ContactGroup) => {
    setSelectedGroup(group)
    openMembersModal()
  }

  const handleSendGroupMessage = (groupId: string) => {
    // Redirect to bulk messaging page with group pre-selected
    window.open(`/customer/whatsapp/bulk?group=${groupId}`, '_blank')
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {groups.length} contact groups
          </Text>
          <Button 
            leftSection={<IconPlus size="1rem" />}
            onClick={() => {
              setSelectedGroup(null)
              form.reset()
              open()
            }}
          >
            Create Group
          </Button>
        </Group>

        {/* Groups Grid */}
        {groups.length > 0 ? (
          <Grid>
            {groups.map((group) => (
              <Grid.Col key={group.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Card withBorder padding="lg" style={{ height: '100%' }}>
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="sm" mb="xs">
                          <IconUsers size={20} color="#339af0" />
                          <Text fw={600} size="lg" lineClamp={1}>
                            {group.name}
                          </Text>
                        </Group>
                        {group.description && (
                          <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                            {group.description}
                          </Text>
                        )}
                      </div>
                      
                      <Group gap="xs">
                        <ActionIcon 
                          variant="subtle" 
                          color="blue"
                          onClick={() => handleEdit(group)}
                        >
                          <IconEdit size="1rem" />
                        </ActionIcon>
                        <ActionIcon 
                          variant="subtle" 
                          color="red"
                          onClick={() => handleDelete(group.id)}
                        >
                          <IconTrash size="1rem" />
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Group justify="space-between">
                      <Badge variant="light" size="lg">
                        {group.memberCount} members
                      </Badge>
                      <Text size="xs" c="dimmed">
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>

                    {/* Member Avatars Preview */}
                    {group.members && group.members.length > 0 && (
                      <Group gap="xs">
                        {group.members.slice(0, 3).map((member) => (
                          <Avatar 
                            key={member.id}
                            src={member.avatar} 
                            size="sm" 
                            radius="xl"
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </Avatar>
                        ))}
                        {group.memberCount > 3 && (
                          <Text size="xs" c="dimmed">
                            +{group.memberCount - 3} more
                          </Text>
                        )}
                      </Group>
                    )}

                    <Group gap="xs">
                      <Button 
                        variant="light" 
                        size="xs"
                        fullWidth
                        leftSection={<IconUserPlus size="0.8rem" />}
                        onClick={() => handleViewMembers(group)}
                      >
                        View Members
                      </Button>
                      <Button 
                        variant="light" 
                        size="xs"
                        color="green"
                        fullWidth
                        leftSection={<IconMessageCircle size="0.8rem" />}
                        onClick={() => handleSendGroupMessage(group.id)}
                      >
                        Send Message
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            No contact groups found. Create your first group to organize your contacts.
          </Alert>
        )}
      </Stack>

      {/* Create/Edit Group Modal */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={selectedGroup ? 'Edit Group' : 'Create Group'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Group Name"
              placeholder="e.g., VIP Customers"
              leftSection={<IconUsers size="1rem" />}
              {...form.getInputProps('name')}
              required
            />

            <Textarea
              label="Description"
              placeholder="Describe this group's purpose"
              rows={3}
              {...form.getInputProps('description')}
            />

            <MultiSelect
              label="Add Contacts"
              placeholder="Select contacts to add to this group"
              data={availableContacts.map(contact => ({
                value: contact.id,
                label: `${contact.name} (${contact.phoneNumber})`,
              }))}
              searchable
              {...form.getInputProps('contactIds')}
            />

            <Group justify="flex-end">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button 
                type="submit"
                leftSection={<IconUsers size="1rem" />}
              >
                {selectedGroup ? 'Update' : 'Create'} Group
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* View Members Modal */}
      <Modal 
        opened={membersModalOpened} 
        onClose={closeMembersModal} 
        title={`${selectedGroup?.name} Members`}
        size="lg"
      >
        {selectedGroup && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {selectedGroup.memberCount} members
              </Text>
              <Button 
                variant="light"
                size="sm"
                leftSection={<IconMessageCircle size="1rem" />}
                onClick={() => handleSendGroupMessage(selectedGroup.id)}
              >
                Message Group
              </Button>
            </Group>

            {selectedGroup.members && selectedGroup.members.length > 0 ? (
              <Stack gap="xs">
                {selectedGroup.members.map((member) => (
                  <Card key={member.id} withBorder padding="sm">
                    <Group>
                      <Avatar src={member.avatar} radius="sm" size="md">
                        {member.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text fw={500} size="sm">{member.name}</Text>
                        <Text size="xs" c="dimmed">{member.phoneNumber}</Text>
                      </div>
                      <Text size="xs" c="dimmed">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                No members in this group yet.
              </Alert>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  )
}