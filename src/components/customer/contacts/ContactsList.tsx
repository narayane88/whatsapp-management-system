'use client'

import { useEffect, useState } from 'react'
import { 
  Stack,
  Group,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Modal,
  Grid,
  Textarea,
  MultiSelect,
  Alert,
  Pagination,
  LoadingOverlay,
  Text,
  Avatar,
  FileInput
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUser,
  IconPhone,
  IconMail,
  IconDownload,
  IconUpload,
  IconInfoCircle,
  IconLink,
  IconCopy,
  IconMessages,
  IconUsers
} from '@tabler/icons-react'

interface Contact {
  id: string
  name: string
  phoneNumber: string
  email?: string
  avatar?: string
  isBlocked: boolean
  isSubscribed: boolean
  tags: string[]
  notes?: string
  createdAt: string
  groupNames?: string[]
}

interface ContactForm {
  name: string
  phoneNumber: string
  email: string
  tags: string[]
  notes: string
}

interface ContactsListProps {
  onStatsChange: () => void
}

export default function ContactsList({ onStatsChange }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  
  const [opened, { open, close }] = useDisclosure(false)
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false)

  const form = useForm<ContactForm>({
    initialValues: {
      name: '',
      phoneNumber: '',
      email: '',
      tags: [],
      notes: '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      phoneNumber: (value) => (!value ? 'Phone number is required' : null),
    },
  })

  useEffect(() => {
    fetchContacts()
  }, [currentPage, searchTerm, statusFilter])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        ...(statusFilter === 'subscribed' && { isSubscribed: 'true' }),
        ...(statusFilter === 'unsubscribed' && { isSubscribed: 'false' }),
        ...(statusFilter === 'blocked' && { isBlocked: 'true' }),
      })

      const response = await fetch(`/api/customer/contacts?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Map API response to expected format
        const mappedContacts = data.data.map((contact: any) => ({
          ...contact,
          groupNames: contact.groups ? contact.groups.map((g: any) => g.group.name) : []
        }))
        setContacts(mappedContacts)
        setTotalPages(data.pagination.totalPages)
      } else {
        console.error('Failed to fetch contacts')
        notifications.show({
          title: 'Error',
          message: 'Failed to load contacts',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Contacts fetch error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load contacts',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: ContactForm) => {
    try {
      const url = selectedContact 
        ? `/api/customer/contacts/${selectedContact.id}` 
        : '/api/customer/contacts'
      const method = selectedContact ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: selectedContact ? 'Contact updated' : 'Contact added',
          color: 'green',
        })
        close()
        form.reset()
        setSelectedContact(null)
        fetchContacts()
        onStatsChange()
      } else {
        throw new Error('Failed to save contact')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save contact',
        color: 'red',
      })
    }
  }

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact)
    form.setValues({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || '',
      tags: contact.tags,
      notes: contact.notes || '',
    })
    open()
  }

  const handleDelete = async (contactId: string) => {
    try {
      const response = await fetch(`/api/customer/contacts/${contactId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Contact deleted',
          color: 'green',
        })
        fetchContacts()
        onStatsChange()
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete contact',
        color: 'red',
      })
    }
  }

  const handleToggleSubscription = async (contactId: string, isSubscribed: boolean) => {
    try {
      const action = isSubscribed ? 'unsubscribe' : 'subscribe'
      const response = await fetch(`/api/customer/contacts/${contactId}/${action}`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchContacts()
        onStatsChange()
        notifications.show({
          title: 'Success',
          message: `Contact ${!isSubscribed ? 'subscribed' : 'unsubscribed'}`,
          color: 'green',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update subscription')
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update subscription',
        color: 'red',
      })
    }
  }

  const handleExportContacts = async () => {
    try {
      const response = await fetch('/api/customer/contacts/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contacts.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to export contacts',
        color: 'red',
      })
    }
  }

  const handleImportContacts = async () => {
    if (!csvFile) return

    try {
      const formData = new FormData()
      formData.append('file', csvFile)

      const response = await fetch('/api/customer/contacts/import', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        notifications.show({
          title: 'Success',
          message: `Imported ${result.imported} contacts`,
          color: 'green',
        })
        closeImportModal()
        setCsvFile(null)
        fetchContacts()
        onStatsChange()
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to import contacts',
        color: 'red',
      })
    }
  }

  const handleCopySubscriptionLink = async (phoneNumber: string) => {
    try {
      // Create subscription link with the phone number
      const baseUrl = window.location.origin
      const subscriptionLink = `${baseUrl}/subscribe?phone=${encodeURIComponent(phoneNumber)}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(subscriptionLink)
      
      notifications.show({
        title: 'Success',
        message: 'Subscription link copied to clipboard!',
        color: 'green',
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      const baseUrl = window.location.origin
      const subscriptionLink = `${baseUrl}/subscribe?phone=${encodeURIComponent(phoneNumber)}`
      textArea.value = subscriptionLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      notifications.show({
        title: 'Success',
        message: 'Subscription link copied to clipboard!',
        color: 'green',
      })
    }
  }

  const handleBroadcastToAll = () => {
    // Get all subscribed contacts
    const subscribedContacts = contacts.filter(c => c.isSubscribed && !c.isBlocked)
    
    if (subscribedContacts.length === 0) {
      notifications.show({
        title: 'No Contacts Available',
        message: 'No subscribed, unblocked contacts available for broadcast',
        color: 'yellow',
      })
      return
    }
    
    // Create URL with contact phone numbers
    const phoneNumbers = subscribedContacts.map(c => c.phoneNumber).join(',')
    const url = `/customer/whatsapp/bulk?contacts=${encodeURIComponent(phoneNumbers)}`
    window.open(url, '_blank')
  }

  const handleBroadcastToSubscribed = () => {
    // Filter for subscribed contacts only
    const subscribedContacts = contacts.filter(c => c.isSubscribed && !c.isBlocked)
    
    if (subscribedContacts.length === 0) {
      notifications.show({
        title: 'No Subscribed Contacts',
        message: 'No subscribed contacts available for broadcast',
        color: 'yellow',
      })
      return
    }
    
    // Create URL with subscribed contact phone numbers
    const phoneNumbers = subscribedContacts.map(c => c.phoneNumber).join(',')
    const url = `/customer/whatsapp/bulk?contacts=${encodeURIComponent(phoneNumbers)}&type=subscribed`
    window.open(url, '_blank')
  }

  const getSubscriptionColor = (isSubscribed: boolean) => {
    return isSubscribed ? 'green' : 'red'
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        {/* Filters and Actions */}
        <Group justify="space-between">
          <Group gap="sm">
            <TextInput
              placeholder="Search contacts..."
              leftSection={<IconSearch size="1rem" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ minWidth: 250 }}
            />
            <Select
              placeholder="Filter by status"
              data={[
                { value: '', label: 'All Contacts' },
                { value: 'subscribed', label: 'Subscribed' },
                { value: 'unsubscribed', label: 'Unsubscribed' },
                { value: 'blocked', label: 'Blocked' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
            />
          </Group>
          
          <Group gap="sm">
            <Button 
              variant="light"
              color="green"
              leftSection={<IconMessages size="1rem" />}
              onClick={handleBroadcastToSubscribed}
              disabled={contacts.filter(c => c.isSubscribed && !c.isBlocked).length === 0}
            >
              Broadcast to Subscribed ({contacts.filter(c => c.isSubscribed && !c.isBlocked).length})
            </Button>
            <Button 
              variant="light"
              leftSection={<IconUpload size="1rem" />}
              onClick={openImportModal}
            >
              Import
            </Button>
            <Button 
              variant="light"
              leftSection={<IconDownload size="1rem" />}
              onClick={handleExportContacts}
            >
              Export
            </Button>
            <Button 
              leftSection={<IconPlus size="1rem" />}
              onClick={() => {
                setSelectedContact(null)
                form.reset()
                open()
              }}
            >
              Add Contact
            </Button>
          </Group>
        </Group>

        {/* Contacts Table */}
        {contacts.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Tags</Table.Th>
                <Table.Th>Groups</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {contacts.map((contact) => (
                <Table.Tr key={contact.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar src={contact.avatar} radius="sm" size="sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text fw={500} size="sm">{contact.name}</Text>
                        {contact.notes && (
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {contact.notes}
                          </Text>
                        )}
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{contact.phoneNumber}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{contact.email || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Badge 
                        color={getSubscriptionColor(contact.isSubscribed)} 
                        size="sm"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleToggleSubscription(contact.id, contact.isSubscribed)}
                      >
                        {contact.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                      </Badge>
                      {contact.isBlocked && (
                        <Badge color="red" size="xs">
                          Blocked
                        </Badge>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {contact.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="light" size="xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="light" size="xs" c="dimmed">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {contact.groupNames?.length ? 
                        `${contact.groupNames.length} groups` : 
                        'No groups'
                      }
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon 
                        variant="subtle" 
                        color="green"
                        title="Copy Subscription Link"
                        onClick={() => handleCopySubscriptionLink(contact.phoneNumber)}
                      >
                        <IconLink size="1rem" />
                      </ActionIcon>
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => handleEdit(contact)}
                      >
                        <IconEdit size="1rem" />
                      </ActionIcon>
                      <ActionIcon 
                        variant="subtle" 
                        color="red"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <IconTrash size="1rem" />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            No contacts found. Add your first contact to get started.
          </Alert>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center">
            <Pagination 
              total={totalPages} 
              value={currentPage} 
              onChange={setCurrentPage}
            />
          </Group>
        )}
      </Stack>

      {/* Add/Edit Contact Modal */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={selectedContact ? 'Edit Contact' : 'Add Contact'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Name"
                  placeholder="Contact name"
                  leftSection={<IconUser size="1rem" />}
                  {...form.getInputProps('name')}
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Phone Number"
                  placeholder="+1234567890"
                  leftSection={<IconPhone size="1rem" />}
                  {...form.getInputProps('phoneNumber')}
                  required
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Email"
              placeholder="contact@example.com"
              leftSection={<IconMail size="1rem" />}
              {...form.getInputProps('email')}
            />

            <MultiSelect
              label="Tags"
              placeholder="Add tags"
              data={['customer', 'lead', 'premium', 'vip', 'support']}
              searchable
              {...form.getInputProps('tags')}
            />

            <Textarea
              label="Notes"
              placeholder="Additional notes about this contact"
              rows={3}
              {...form.getInputProps('notes')}
            />

            <Group justify="flex-end">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button 
                type="submit"
                leftSection={<IconUser size="1rem" />}
              >
                {selectedContact ? 'Update' : 'Add'} Contact
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal 
        opened={importModalOpened} 
        onClose={closeImportModal} 
        title="Import Contacts"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            Upload a CSV file with columns: name, phoneNumber, email, tags, notes
          </Alert>

          <FileInput
            label="CSV File"
            placeholder="Choose file"
            accept=".csv"
            value={csvFile}
            onChange={setCsvFile}
            leftSection={<IconUpload size="1rem" />}
          />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeImportModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportContacts}
              disabled={!csvFile}
              leftSection={<IconUpload size="1rem" />}
            >
              Import Contacts
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}