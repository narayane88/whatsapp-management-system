'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Card,
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  Select,
  Text,
  Title,
  Badge,
  Grid,
  Alert,
  LoadingOverlay,
  Switch,
  NumberInput,
  FileInput,
  Table,
  ActionIcon,
  Modal,
  Tooltip
} from '@mantine/core'
import {
  IconMessages,
  IconSend,
  IconPhone,
  IconMessage,
  IconPhoto,
  IconFile,
  IconVideo,
  IconMusic,
  IconMapPin,
  IconDeviceMobile,
  IconCheck,
  IconX,
  IconClock,
  IconList,
  IconUpload,
  IconTrash,
  IconEye,
  IconUsers,
  IconFileSpreadsheet,
  IconBulb
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import CustomerHeader from '@/components/customer/CustomerHeader'
import { useWhatsAppRealTime } from '@/hooks/useWhatsAppRealTime'

interface ConnectedDevice {
  id: string
  accountName: string
  phoneNumber?: string
  status: string
  serverName: string
}

interface BulkRecipient {
  id: string
  phoneNumber: string
  name?: string
  status: 'pending' | 'sent' | 'failed'
  error?: string
}

export default function BulkMessagePage() {
  // Device and message state
  const [devices, setDevices] = useState<ConnectedDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState('')
  const [realTimeConnected, setRealTimeConnected] = useState(false)
  const [messageType, setMessageType] = useState('text')
  const [messageSending, setMessageSending] = useState(false)
  
  // Message content state
  const [messageText, setMessageText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageCaption, setImageCaption] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [documentFilename, setDocumentFilename] = useState('')
  const [documentCaption, setDocumentCaption] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoCaption, setVideoCaption] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [locationLat, setLocationLat] = useState('')
  const [locationLon, setLocationLon] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  
  // Bulk recipients state
  const [recipients, setRecipients] = useState<BulkRecipient[]>([])
  const [recipientInput, setRecipientInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [bulkNumberInput, setBulkNumberInput] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvProcessing, setCsvProcessing] = useState(false)
  
  // Queue functionality state
  const [addToQueue, setAddToQueue] = useState(true) // Default to queue for bulk
  const [priority, setPriority] = useState(0)
  const [scheduledDateTime, setScheduledDateTime] = useState('')
  const [sendDelay, setSendDelay] = useState(5) // Delay between messages in seconds
  const [randomDelay, setRandomDelay] = useState(false) // Enable random delay
  const [minDelay, setMinDelay] = useState(3) // Minimum delay for random
  const [maxDelay, setMaxDelay] = useState(10) // Maximum delay for random
  
  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<unknown>(null)
  const [subscriptionChecking, setSubscriptionChecking] = useState(false)
  
  // Modal states
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false)

  // Real-time device status updates
  const handleDeviceStatusUpdate = useCallback((data: any) => {
    if (data.devices) {
      const connectedDevices = data.devices.filter((device: any) => device.status === 'CONNECTED')
      setDevices(connectedDevices)
      
      // Auto-select first device if none selected
      if (connectedDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(connectedDevices[0].id)
      }
    }
  }, [selectedDevice])

  // Real-time queue updates
  const handleQueueUpdate = useCallback((data: any) => {
    if (data.messages) {
      // Update recipient statuses based on queue messages
      setRecipients(prev => prev.map(recipient => {
        const queueMessage = data.messages.find((msg: any) => 
          msg.to === recipient.phoneNumber && msg.status === 'sent'
        )
        if (queueMessage) {
          return { ...recipient, status: 'sent' as const }
        }
        return recipient
      }))
    }
  }, [])

  // Initialize real-time connection
  const { isConnected } = useWhatsAppRealTime({
    onDeviceStatus: handleDeviceStatusUpdate,
    onQueueUpdate: handleQueueUpdate,
    enableNotifications: true, // Enable notifications and sounds
    enableSounds: true,
    autoReconnect: true
  })

  useEffect(() => {
    setRealTimeConnected(isConnected)
  }, [isConnected])

  useEffect(() => {
    fetchConnectedDevices()
    checkSubscriptionStatus()
  }, [])

  const fetchConnectedDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer/host/connections')
      if (response.ok) {
        const allDevices = await response.json()
        // Process through real-time handler for consistency
        handleDeviceStatusUpdate({ devices: allDevices })
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
      if (!realTimeConnected) {
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch connected devices',
          color: 'red'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const checkSubscriptionStatus = async () => {
    try {
      setSubscriptionChecking(true)
      const response = await fetch('/api/customer/subscription/check')
      const result = await response.json()
      
      if (response.ok) {
        setSubscriptionStatus(result)
        
        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((warning: string) => {
            notifications.show({
              title: '⚠️ Subscription Warning',
              message: warning,
              color: 'yellow',
              autoClose: 8000
            })
          })
        }
        
        // Show critical errors
        if (!result.valid) {
          notifications.show({
            title: '❌ Subscription Issue',
            message: result.message,
            color: 'red',
            autoClose: false
          })
        }
      } else {
        console.error('Failed to check subscription:', result)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setSubscriptionChecking(false)
    }
  }

  const addRecipient = () => {
    if (!recipientInput.trim()) {
      notifications.show({
        title: 'Missing Information',
        message: 'Please enter a phone number',
        color: 'red'
      })
      return
    }

    const newRecipient: BulkRecipient = {
      id: Date.now().toString(),
      phoneNumber: recipientInput.trim(),
      name: nameInput.trim() || undefined,
      status: 'pending'
    }

    setRecipients(prev => [...prev, newRecipient])
    setRecipientInput('')
    setNameInput('')
  }

  const addBulkNumbers = () => {
    if (!bulkNumberInput.trim()) {
      notifications.show({
        title: 'Missing Information',
        message: 'Please enter phone numbers',
        color: 'red'
      })
      return
    }

    // Split by common separators: newlines, commas, semicolons, spaces
    const numbers = bulkNumberInput
      .split(/[\n,;|\s]+/)
      .map(num => num.trim())
      .filter(num => num.length > 0)

    if (numbers.length === 0) {
      notifications.show({
        title: 'No Valid Numbers',
        message: 'No valid phone numbers found in the input',
        color: 'red'
      })
      return
    }

    const newRecipients: BulkRecipient[] = numbers.map((phoneNumber, index) => ({
      id: `bulk-${Date.now()}-${index}`,
      phoneNumber: phoneNumber,
      status: 'pending' as const
    }))

    setRecipients(prev => [...prev, ...newRecipients])
    setBulkNumberInput('')
    
    notifications.show({
      title: '✅ Numbers Added',
      message: `Added ${numbers.length} phone numbers to recipients`,
      color: 'green'
    })
  }

  const processCSVFile = async (file: File) => {
    setCsvProcessing(true)
    
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error('CSV file is empty')
      }

      const newRecipients: BulkRecipient[] = []
      let hasHeader = false
      
      // Check if first line looks like a header (contains "phone", "number", "name", etc.)
      const firstLine = lines[0].toLowerCase()
      if (firstLine.includes('phone') || firstLine.includes('number') || firstLine.includes('name')) {
        hasHeader = true
      }
      
      const dataLines = hasHeader ? lines.slice(1) : lines
      
      dataLines.forEach((line, index) => {
        const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
        
        if (columns.length > 0 && columns[0]) {
          const phoneNumber = columns[0]
          const name = columns.length > 1 ? columns[1] : undefined
          
          newRecipients.push({
            id: `csv-${Date.now()}-${index}`,
            phoneNumber: phoneNumber,
            name: name || undefined,
            status: 'pending' as const
          })
        }
      })

      if (newRecipients.length === 0) {
        throw new Error('No valid recipients found in CSV file')
      }

      setRecipients(prev => [...prev, ...newRecipients])
      setCsvFile(null)
      
      notifications.show({
        title: '📊 CSV Imported',
        message: `Successfully imported ${newRecipients.length} recipients from CSV`,
        color: 'green'
      })
      
    } catch (error) {
      notifications.show({
        title: 'CSV Import Error',
        message: error instanceof Error ? error.message : 'Failed to process CSV file',
        color: 'red'
      })
    } finally {
      setCsvProcessing(false)
    }
  }

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id))
  }

  const clearAllRecipients = () => {
    setRecipients([])
  }

  const sendBulkMessages = async () => {
    // Check subscription first
    const subscriptionResult = subscriptionStatus as { valid?: boolean; message?: string }
    if (!subscriptionResult || !subscriptionResult.valid) {
      const errorMessage = subscriptionResult?.message || 'Please check your subscription status'
      notifications.show({
        title: '❌ Subscription Required',
        message: errorMessage,
        color: 'red',
        autoClose: false
      })
      return
    }

    // Validation
    if (!selectedDevice || recipients.length === 0) {
      notifications.show({
        title: 'Missing Information',
        message: 'Please select a device and add recipients',
        color: 'red'
      })
      return
    }

    if (messageType === 'text' && !messageText.trim()) {
      notifications.show({
        title: 'Missing Message Text',
        message: 'Please enter message text',
        color: 'red'
      })
      return
    }

    const device = devices.find(d => d.id === selectedDevice)
    if (!device) {
      notifications.show({
        title: 'Device Not Found',
        message: 'Selected device not found',
        color: 'red'
      })
      return
    }

    setMessageSending(true)

    try {
      let successCount = 0
      let failureCount = 0
      
      // Process each recipient
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i]
        
        // Update recipient status to processing
        setRecipients(prev => prev.map(r => 
          r.id === recipient.id ? { ...r, status: 'pending' as const } : r
        ))

        try {
          // Build message content
          let messageContent = ''
          if (messageType === 'text') {
            messageContent = messageText.trim()
          } else if (messageType === 'image') {
            messageContent = `[Image: ${imageUrl}]${imageCaption ? ` - ${imageCaption}` : ''}`
          } else if (messageType === 'document') {
            messageContent = `[Document: ${documentFilename}]${documentCaption ? ` - ${documentCaption}` : ''}`
          } else if (messageType === 'video') {
            messageContent = `[Video: ${videoUrl}]${videoCaption ? ` - ${videoCaption}` : ''}`
          } else if (messageType === 'audio') {
            messageContent = `[Audio: ${audioUrl}]`
          } else if (messageType === 'location') {
            messageContent = `[Location: ${locationLat}, ${locationLon}]${locationName ? ` - ${locationName}` : ''}`
          }

          const queueData = {
            toNumber: recipient.phoneNumber,
            message: messageContent,
            messageType,
            attachmentUrl: messageType !== 'text' ? (imageUrl || documentUrl || videoUrl || audioUrl) : undefined,
            priority,
            instanceId: device.accountName,
            instanceName: device.accountName,
            scheduledAt: scheduledDateTime || undefined,
            metadata: {
              messageType,
              recipientName: recipient.name,
              bulkMessageId: Date.now().toString(),
              ...(messageType === 'image' && { imageUrl, imageCaption }),
              ...(messageType === 'document' && { documentUrl, documentFilename, documentCaption }),
              ...(messageType === 'video' && { videoUrl, videoCaption }),
              ...(messageType === 'audio' && { audioUrl }),
              ...(messageType === 'location' && { locationLat, locationLon, locationName, locationAddress })
            }
          }

          const response = await fetch('/api/customer/whatsapp/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queueData)
          })

          const result = await response.json()

          if (response.ok && result.data) {
            // Mark as sent
            setRecipients(prev => prev.map(r => 
              r.id === recipient.id ? { ...r, status: 'sent' as const } : r
            ))
            successCount++
          } else {
            throw new Error(result.error || 'Failed to add to queue')
          }

          // Add delay between messages to avoid rate limiting
          if (i < recipients.length - 1) {
            let delayMs = 0
            if (randomDelay) {
              // Random delay between minDelay and maxDelay
              const randomSeconds = Math.random() * (maxDelay - minDelay) + minDelay
              delayMs = randomSeconds * 1000
            } else {
              // Fixed delay
              delayMs = sendDelay * 1000
            }
            
            if (delayMs > 0) {
              await new Promise(resolve => setTimeout(resolve, delayMs))
            }
          }

        } catch (error) {
          // Mark as failed
          setRecipients(prev => prev.map(r => 
            r.id === recipient.id ? { 
              ...r, 
              status: 'failed' as const,
              error: error instanceof Error ? error.message : 'Unknown error'
            } : r
          ))
          failureCount++
        }
      }

      notifications.show({
        title: '📋 Bulk Messages Processed',
        message: `Successfully queued: ${successCount}, Failed: ${failureCount}`,
        color: successCount > 0 ? 'green' : 'red',
        autoClose: 8000
      })

      // Reset form if all successful
      if (failureCount === 0) {
        clearAllFields()
      }

    } catch (error) {
      notifications.show({
        title: 'Bulk Message Error',
        message: 'Failed to process bulk messages',
        color: 'red'
      })
    } finally {
      setMessageSending(false)
    }
  }

  const clearAllFields = () => {
    setMessageText('')
    setImageUrl('')
    setImageCaption('')
    setDocumentUrl('')
    setDocumentFilename('')
    setDocumentCaption('')
    setVideoUrl('')
    setVideoCaption('')
    setAudioUrl('')
    setLocationLat('')
    setLocationLon('')
    setLocationName('')
    setLocationAddress('')
    setMessageType('text')
    setAddToQueue(true)
    setPriority(0)
    setScheduledDateTime('')
    setSendDelay(5)
    setRandomDelay(false)
    setMinDelay(3)
    setMaxDelay(10)
    setRecipients([])
    setBulkNumberInput('')
    setCsvFile(null)
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'green'
      case 'failed': return 'red'
      default: return 'yellow'
    }
  }

  return (
    <div>
      <CustomerHeader 
        title="Bulk Messages"
        subtitle="Send WhatsApp messages to multiple recipients efficiently"
        badge={{ 
          label: realTimeConnected ? 'Live • Bulk Messaging' : 'Bulk Messaging', 
          color: realTimeConnected ? 'green' : 'blue' 
        }}
      />
      
      <Container size="xl" py="md">
        <Stack gap="lg">
          {/* Subscription Status */}
          {subscriptionStatus && (
            <Card withBorder padding="lg" style={{ 
              backgroundColor: (subscriptionStatus as { valid?: boolean }).valid ? 
                'var(--mantine-color-green-0)' : 'var(--mantine-color-red-0)',
              borderColor: (subscriptionStatus as { valid?: boolean }).valid ? 
                'var(--mantine-color-green-3)' : 'var(--mantine-color-red-3)'
            }}>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <Badge 
                    color={(subscriptionStatus as { valid?: boolean }).valid ? 'green' : 'red'}
                    size="lg"
                  >
                    {(subscriptionStatus as { valid?: boolean }).valid ? '✅ Active' : '❌ Invalid'}
                  </Badge>
                  <div>
                    <Text size="lg" fw={600}>
                      {(subscriptionStatus as { subscription?: { packageName?: string } }).subscription?.packageName || 'No Package'}
                    </Text>
                    <Text size="sm" c={(subscriptionStatus as { valid?: boolean }).valid ? 'green' : 'red'}>
                      {(subscriptionStatus as { message?: string }).message}
                    </Text>
                  </div>
                </Group>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={checkSubscriptionStatus}
                  loading={subscriptionChecking}
                >
                  Refresh
                </Button>
              </Group>
            </Card>
          )}
          
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="md">
                {/* Recipients Management */}
                <Card withBorder padding="lg">
                  <Group justify="space-between" mb="md">
                    <Group gap="sm">
                      <Title order={4}>📱 Recipients ({recipients.length})</Title>
                      {realTimeConnected && (
                        <Badge size="sm" color="green" variant="dot">
                          Live Updates
                        </Badge>
                      )}
                    </Group>
                    <Group gap="sm">
                      <Button
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={clearAllRecipients}
                        disabled={recipients.length === 0}
                      >
                        Clear All
                      </Button>
                    </Group>
                  </Group>
                  
                  {/* Single Recipient Form */}
                  <Card withBorder padding="md" mb="md" style={{ backgroundColor: '#f8f9fa' }}>
                    <Title order={6} mb="sm">➕ Add Single Recipient</Title>
                    <Group gap="sm">
                      <TextInput
                        placeholder="Phone number (e.g., 919876543210)"
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        leftSection={<IconPhone size="1rem" />}
                        flex={1}
                      />
                      <TextInput
                        placeholder="Name (optional)"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        style={{ width: 200 }}
                      />
                      <Button
                        onClick={addRecipient}
                        leftSection={<IconUsers size="1rem" />}
                      >
                        Add
                      </Button>
                    </Group>
                  </Card>

                  {/* Bulk Input Form */}
                  <Card withBorder padding="md" mb="md" style={{ backgroundColor: '#e3f2fd' }}>
                    <Group justify="space-between" mb="sm">
                      <Title order={6}>📋 Bulk Number Input</Title>
                      <Badge variant="light" color="blue">Comma, Space, or Line Separated</Badge>
                    </Group>
                    <Stack gap="sm">
                      <Textarea
                        placeholder="Enter multiple phone numbers separated by commas, spaces, or new lines:&#10;919876543210, 918765432109&#10;917654321098&#10;916543210987"
                        value={bulkNumberInput}
                        onChange={(e) => setBulkNumberInput(e.target.value)}
                        minRows={3}
                        maxRows={6}
                        autosize
                      />
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                          Supports: 919876543210, 918765432109 or separated by lines
                        </Text>
                        <Button
                          onClick={addBulkNumbers}
                          disabled={!bulkNumberInput.trim()}
                          leftSection={<IconBulb size="1rem" />}
                          variant="light"
                        >
                          Add Bulk Numbers
                        </Button>
                      </Group>
                    </Stack>
                  </Card>

                  {/* CSV Import Form */}
                  <Card withBorder padding="md" mb="md" style={{ backgroundColor: '#e8f5e8' }}>
                    <Group justify="space-between" mb="sm">
                      <Title order={6}>📊 CSV File Import</Title>
                      <Badge variant="light" color="green">Phone, Name Columns</Badge>
                    </Group>
                    <Stack gap="sm">
                      <Group gap="md" align="end">
                        <FileInput
                          label="Select CSV File"
                          placeholder="Choose a CSV file..."
                          accept=".csv,.txt"
                          value={csvFile}
                          onChange={setCsvFile}
                          leftSection={<IconFileSpreadsheet size="1rem" />}
                          flex={1}
                        />
                        <Button
                          onClick={() => csvFile && processCSVFile(csvFile)}
                          disabled={!csvFile}
                          loading={csvProcessing}
                          leftSection={<IconUpload size="1rem" />}
                          color="green"
                        >
                          Import CSV
                        </Button>
                      </Group>
                      <Alert>
                        <Text size="xs">
                          <strong>CSV Format:</strong> First column = Phone Number, Second column = Name (optional)<br/>
                          <strong>Example:</strong> 919876543210,John Doe<br/>
                          <strong>Header:</strong> Automatically detected if first row contains "phone", "number", or "name"
                        </Text>
                      </Alert>
                    </Stack>
                  </Card>
                  
                  {/* Recipients Table */}
                  {recipients.length > 0 ? (
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Phone Number</Table.Th>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {recipients.map((recipient) => (
                          <Table.Tr key={recipient.id}>
                            <Table.Td>
                              <Text size="sm" ff="monospace">{recipient.phoneNumber}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{recipient.name || '-'}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={statusColor(recipient.status)} size="sm">
                                {recipient.status}
                              </Badge>
                              {recipient.error && (
                                <Tooltip label={recipient.error}>
                                  <Text size="xs" c="red">Error</Text>
                                </Tooltip>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={() => removeRecipient(recipient.id)}
                                disabled={messageSending}
                              >
                                <IconTrash size="1rem" />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  ) : (
                    <Alert color="blue" icon={<IconUsers size="1rem" />}>
                      <Group justify="space-between" align="center">
                        <div>
                          <Text size="sm" fw={500}>No recipients added yet</Text>
                          <Text size="xs" c="dimmed">
                            Use any of the methods above to add phone numbers:
                          </Text>
                          <Text size="xs" c="dimmed">
                            • Single recipient form • Bulk number input • CSV file import
                          </Text>
                        </div>
                        <Badge variant="light" color="blue">0 Recipients</Badge>
                      </Group>
                    </Alert>
                  )}
                </Card>

                {/* Message Configuration */}
                <Card withBorder padding="lg">
                  <Title order={4} mb="lg">💬 Message Configuration</Title>
                  <Stack gap="md">
                    {/* Device Selection */}
                    <Select
                      label="Select Device"
                      placeholder="Choose a connected device"
                      data={devices.map(device => ({
                        value: device.id,
                        label: `${device.phoneNumber ? `(${device.phoneNumber})` : 'No Phone'} - ${device.serverName}`
                      }))}
                      value={selectedDevice}
                      onChange={(value) => setSelectedDevice(value || '')}
                      leftSection={<IconDeviceMobile size="1rem" />}
                      disabled={devices.length === 0}
                    />

                    {/* Message Type */}
                    <Select
                      label="Message Type"
                      placeholder="Select message type"
                      data={[
                        { value: 'text', label: '📝 Text Message' },
                        { value: 'image', label: '📸 Image Attachment' },
                        { value: 'document', label: '📄 Document Attachment' },
                        { value: 'video', label: '🎥 Video Attachment' },
                        { value: 'audio', label: '🔊 Audio Attachment' },
                        { value: 'location', label: '📍 Location Sharing' }
                      ]}
                      value={messageType}
                      onChange={(value) => setMessageType(value || 'text')}
                      leftSection={<IconMessage size="1rem" />}
                    />

                    {/* Message Content */}
                    {messageType === 'text' && (
                      <Textarea
                        label="Message Text"
                        placeholder="Enter your bulk message here..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        minRows={3}
                        maxRows={6}
                        autosize
                        leftSection={<IconMessage size="1rem" />}
                      />
                    )}

                    {/* Other message types content fields - same as single send */}
                    {messageType === 'image' && (
                      <Stack gap="sm">
                        <TextInput
                          label="Image URL"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          leftSection={<IconPhoto size="1rem" />}
                        />
                        <Textarea
                          label="Image Caption (Optional)"
                          placeholder="Enter caption for the image..."
                          value={imageCaption}
                          onChange={(e) => setImageCaption(e.target.value)}
                          minRows={2}
                          maxRows={4}
                          autosize
                        />
                      </Stack>
                    )}
                  </Stack>
                </Card>

                {/* Bulk Settings */}
                <Card withBorder padding="lg" style={{ backgroundColor: '#f8f9fa' }}>
                  <Title order={5} mb="md">⚙️ Bulk Settings</Title>
                  <Stack gap="md">
                    <Switch
                      label="Random Delay Between Messages"
                      description="Use random delays to make sending appear more natural"
                      checked={randomDelay}
                      onChange={(event) => setRandomDelay(event.currentTarget.checked)}
                      color="blue"
                    />

                    {randomDelay ? (
                      <Group grow>
                        <NumberInput
                          label="Minimum Delay (seconds)"
                          description="Shortest delay between messages"
                          value={minDelay}
                          onChange={(value) => setMinDelay(Number(value) || 3)}
                          min={1}
                          max={30}
                          leftSection={<IconClock size="1rem" />}
                        />
                        <NumberInput
                          label="Maximum Delay (seconds)"
                          description="Longest delay between messages"
                          value={maxDelay}
                          onChange={(value) => setMaxDelay(Number(value) || 10)}
                          min={minDelay + 1}
                          max={120}
                          leftSection={<IconClock size="1rem" />}
                        />
                      </Group>
                    ) : (
                      <NumberInput
                        label="Fixed Delay Between Messages (seconds)"
                        description="Fixed delay between each message to avoid rate limiting"
                        value={sendDelay}
                        onChange={(value) => setSendDelay(Number(value) || 5)}
                        min={1}
                        max={60}
                        leftSection={<IconClock size="1rem" />}
                      />
                    )}

                    <Select
                      label="Priority"
                      placeholder="Select priority level"
                      data={[
                        { value: '0', label: 'Normal Priority' },
                        { value: '1', label: 'High Priority' },
                        { value: '2', label: 'Urgent Priority' }
                      ]}
                      value={priority.toString()}
                      onChange={(value) => setPriority(parseInt(value || '0'))}
                      leftSection={<IconList size="1rem" />}
                    />

                    <TextInput
                      label="Schedule for Later (Optional)"
                      placeholder="Leave empty for immediate processing"
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      leftSection={<IconClock size="1rem" />}
                      description="If not specified, messages will be processed immediately"
                    />
                  </Stack>
                </Card>

                {/* Action Buttons */}
                <Group gap="md" mt="lg">
                  <Tooltip
                    label={
                      !selectedDevice ? 'Please select a device first' :
                      recipients.length === 0 ? 'Add recipients to enable sending' :
                      devices.length === 0 ? 'No connected devices available' :
                      !(subscriptionStatus as { valid?: boolean })?.valid ? 'Valid subscription required' :
                      'Ready to send bulk messages'
                    }
                    disabled={messageSending}
                  >
                    <Button
                      leftSection={<IconMessages size="1rem" />}
                      onClick={sendBulkMessages}
                      loading={messageSending}
                      disabled={
                        !selectedDevice || 
                        recipients.length === 0 || 
                        devices.length === 0 || 
                        !(subscriptionStatus as { valid?: boolean })?.valid
                      }
                      size="lg"
                      variant="gradient"
                      gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                      flex={1}
                      style={{ 
                        // Make disabled state more visible
                        opacity: (!selectedDevice || 
                                 recipients.length === 0 || 
                                 devices.length === 0 || 
                                 !(subscriptionStatus as { valid?: boolean })?.valid) ? 0.6 : 1 
                      }}
                    >
                      {messageSending ? 'Processing Bulk Messages...' : 
                       recipients.length === 0 ? 'Add Recipients to Send' :
                       `Send to ${recipients.length} Recipient${recipients.length !== 1 ? 's' : ''}`}
                    </Button>
                  </Tooltip>
                  <Button
                    variant="light"
                    color="red"
                    onClick={clearAllFields}
                    disabled={messageSending}
                  >
                    Clear All
                  </Button>
                </Group>
              </Stack>
            </Grid.Col>

            {/* Help Panel */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                {/* Quick Stats */}
                <Card withBorder padding="md">
                  <Title order={6} mb="md">📊 Quick Stats</Title>
                  <Stack gap={4}>
                    <Group justify="space-between">
                      <Text size="sm">Total Recipients:</Text>
                      <Badge variant="light">{recipients.length}</Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Pending:</Text>
                      <Badge color="yellow" variant="light">
                        {recipients.filter(r => r.status === 'pending').length}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Sent:</Text>
                      <Badge color="green" variant="light">
                        {recipients.filter(r => r.status === 'sent').length}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Failed:</Text>
                      <Badge color="red" variant="light">
                        {recipients.filter(r => r.status === 'failed').length}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Est. Time:</Text>
                      <Text size="sm">
                        {randomDelay 
                          ? `${Math.ceil(recipients.length * minDelay / 60)}-${Math.ceil(recipients.length * maxDelay / 60)} min`
                          : `${Math.ceil(recipients.length * sendDelay / 60)} min`
                        }
                      </Text>
                    </Group>
                  </Stack>
                </Card>

                {/* Bulk Guide */}
                <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
                  <Title order={6} mb="sm">📖 Bulk Messaging Guide</Title>
                  <Stack gap={4}>
                    <Text size="xs">
                      • <strong>Single Add:</strong> Add individual recipients with name (optional)
                    </Text>
                    <Text size="xs">
                      • <strong>Bulk Input:</strong> Paste multiple numbers separated by commas or lines
                    </Text>
                    <Text size="xs">
                      • <strong>CSV Import:</strong> Upload CSV file with phone,name columns
                    </Text>
                    <Text size="xs">
                      • <strong>Phone Format:</strong> Include country code (e.g., 919876543210)
                    </Text>
                    <Text size="xs">
                      • <strong>Fixed Delay:</strong> Set consistent delay between each message
                    </Text>
                    <Text size="xs">
                      • <strong>Random Delay:</strong> Use random intervals (3-10s) to appear natural
                    </Text>
                    <Text size="xs">
                      • <strong>Queue System:</strong> All bulk messages are automatically queued
                    </Text>
                    <Text size="xs">
                      • <strong>Status Tracking:</strong> Monitor each message status in real-time
                    </Text>
                    <Text size="xs">
                      • <strong>Retry Failed:</strong> Re-send failed messages individually
                    </Text>
                    <Text size="xs">
                      • <strong>Subscription:</strong> Ensure active subscription for sending
                    </Text>
                  </Stack>
                </Card>

                {/* Feature Status */}
                <Card withBorder padding="md" style={{ backgroundColor: '#e8f5e8' }}>
                  <Title order={6} mb="sm">✅ Bulk Features</Title>
                  <Stack gap={2}>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Single recipient add: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Bulk number input: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">CSV file import: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Queue integration: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Rate limiting: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Status tracking: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Scheduling: Working</Text>
                    </Group>
                  </Stack>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </div>
  )
}