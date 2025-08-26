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
  NumberInput
} from '@mantine/core'
import {
  IconBrandWhatsapp,
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
  IconList
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import CustomerHeader from '@/components/customer/CustomerHeader'
import { useWhatsAppRealTime } from '@/hooks/useWhatsAppRealTime'

interface ConnectedDevice {
  id: string
  accountName: string
  phoneNumber?: string
  status: string
  serverName: string
}

export default function SendMessagePage() {
  // Device and message state
  const [devices, setDevices] = useState<ConnectedDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState('')
  const [realTimeConnected, setRealTimeConnected] = useState(false)
  const [recipientNumber, setRecipientNumber] = useState('')
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
  
  // Queue functionality state
  const [addToQueue, setAddToQueue] = useState(false)
  const [priority, setPriority] = useState(0)
  const [scheduledDateTime, setScheduledDateTime] = useState('')

  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [subscriptionChecking, setSubscriptionChecking] = useState(false)

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

  // Real-time message sent handler  
  const handleMessageSent = useCallback((data: any) => {
    if (data.message) {
      notifications.show({
        title: '✅ Message Delivered',
        message: `Message sent to ${data.message.to}`,
        color: 'green'
      })
    }
  }, [])

  // Initialize real-time connection
  const { isConnected } = useWhatsAppRealTime({
    onDeviceStatus: handleDeviceStatusUpdate,
    onMessageSent: handleMessageSent,
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

  const addMessageToQueue = async () => {
    // Check subscription first
    if (!subscriptionStatus || !subscriptionStatus.valid) {
      const errorMessage = subscriptionStatus?.message || 'Please check your subscription status'
      notifications.show({
        title: '❌ Subscription Required',
        message: errorMessage,
        color: 'red',
        autoClose: false
      })
      return
    }

    // Validation
    if (!selectedDevice || !recipientNumber) {
      notifications.show({
        title: 'Missing Information',
        message: 'Please select a device and enter recipient number',
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
        toNumber: recipientNumber.trim(),
        message: messageContent,
        messageType,
        attachmentUrl: messageType !== 'text' ? (imageUrl || documentUrl || videoUrl || audioUrl) : undefined,
        priority,
        instanceId: device.accountName,
        instanceName: device.accountName,
        scheduledAt: scheduledDateTime || undefined,
        metadata: {
          messageType,
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
        notifications.show({
          title: '📋 Added to Queue Successfully',
          message: `Message queued for ${recipientNumber}${scheduledDateTime ? ` at ${new Date(scheduledDateTime).toLocaleString()}` : ' (immediate)'} - Queue ID: ${result.data.id}`,
          color: 'green',
          autoClose: 5000
        })
      } else {
        throw new Error(result.error || 'Failed to add to queue')
      }

      // Clear form
      clearAllFields()
      setAddToQueue(false)
      setPriority(0)
      setScheduledDateTime('')

    } catch (error) {
      notifications.show({
        title: 'Queue Error',
        message: 'Failed to add message to queue',
        color: 'red'
      })
    }
  }

  const sendMessage = async () => {
    // If add to queue is enabled, use queue function instead
    if (addToQueue) {
      await addMessageToQueue()
      return
    }
    // Validation
    if (!selectedDevice || !recipientNumber) {
      notifications.show({
        title: 'Missing Information',
        message: 'Please select a device and enter recipient number',
        color: 'red'
      })
      return
    }

    // Type-specific validation
    if (messageType === 'text' && !messageText.trim()) {
      notifications.show({
        title: 'Missing Message Text',
        message: 'Please enter message text',
        color: 'red'
      })
      return
    }

    if (messageType === 'image' && !imageUrl.trim()) {
      notifications.show({
        title: 'Missing Image URL',
        message: 'Please enter image URL',
        color: 'red'
      })
      return
    }

    if (messageType === 'document' && (!documentUrl.trim() || !documentFilename.trim())) {
      notifications.show({
        title: 'Missing Document Info',
        message: 'Please enter document URL and filename',
        color: 'red'
      })
      return
    }

    if (messageType === 'video' && !videoUrl.trim()) {
      notifications.show({
        title: 'Missing Video URL',
        message: 'Please enter video URL',
        color: 'red'
      })
      return
    }

    if (messageType === 'audio' && !audioUrl.trim()) {
      notifications.show({
        title: 'Missing Audio URL',
        message: 'Please enter audio URL',
        color: 'red'
      })
      return
    }

    if (messageType === 'location' && (!locationLat.trim() || !locationLon.trim())) {
      notifications.show({
        title: 'Missing Location Data',
        message: 'Please enter latitude and longitude',
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
      // Format phone number
      let formattedRecipient = recipientNumber.trim()
      if (!recipientNumber.includes('@')) {
        let cleanNumber = recipientNumber.replace(/\D/g, '')
        
        // Handle Indian numbers
        if (cleanNumber.length === 10 && cleanNumber.match(/^[6-9]/)) {
          cleanNumber = '91' + cleanNumber
        }
        
        formattedRecipient = `${cleanNumber}@s.whatsapp.net`
      }

      // Build message object based on type
      let messageObject: any = {}

      switch (messageType) {
        case 'text':
          messageObject = { text: messageText.trim() }
          break
        case 'image':
          messageObject = {
            image: {
              url: imageUrl.trim(),
              caption: imageCaption.trim() || undefined
            }
          }
          break
        case 'document':
          messageObject = {
            document: {
              url: documentUrl.trim(),
              filename: documentFilename.trim(),
              caption: documentCaption.trim() || undefined
            }
          }
          break
        case 'video':
          messageObject = {
            video: {
              url: videoUrl.trim(),
              caption: videoCaption.trim() || undefined
            }
          }
          break
        case 'audio':
          messageObject = {
            audio: { url: audioUrl.trim() }
          }
          break
        case 'location':
          messageObject = {
            location: {
              latitude: parseFloat(locationLat),
              longitude: parseFloat(locationLon),
              name: locationName.trim() || undefined,
              address: locationAddress.trim() || undefined
            }
          }
          break
        default:
          throw new Error('Invalid message type')
      }

      // Use the device's account ID (server account ID) for API calls
      const serverAccountId = device.accountId

      // Send via our API which will route to the correct server
      const response = await fetch(`/api/customer/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceName: serverAccountId,
          to: formattedRecipient,
          message: messageObject
        })
      })

      const result = await response.json()

      if (result.success) {
        const messageTypeLabel = messageType === 'text' ? 'Text Message' : 
                               messageType === 'image' ? 'Image' :
                               messageType === 'document' ? 'Document' :
                               messageType === 'video' ? 'Video' :
                               messageType === 'audio' ? 'Audio' :
                               messageType === 'location' ? 'Location' : 'Message'

        // Log successful message to sent_messages table
        try {
          let messageContent = ''
          let attachmentUrl: string | undefined = undefined

          switch (messageType) {
            case 'text':
              messageContent = messageText.trim()
              break
            case 'image':
              messageContent = imageCaption.trim() || '[Image]'
              attachmentUrl = imageUrl.trim()
              break
            case 'document':
              messageContent = documentCaption.trim() || `[Document: ${documentFilename}]`
              attachmentUrl = documentUrl.trim()
              break
            case 'video':
              messageContent = videoCaption.trim() || '[Video]'
              attachmentUrl = videoUrl.trim()
              break
            case 'audio':
              messageContent = '[Audio]'
              attachmentUrl = audioUrl.trim()
              break
            case 'location':
              messageContent = `[Location: ${locationLat}, ${locationLon}]${locationName ? ` - ${locationName}` : ''}`
              break
          }

          const logData = {
            recipientNumber: recipientNumber.trim(),
            recipientName: null, // No name available from direct send
            message: messageContent,
            messageType,
            deviceName: device.accountName,
            status: 'sent',
            attachmentUrl,
            metadata: {
              messageType,
              messageId: result.data?.messageId,
              ...(messageType === 'image' && { imageUrl, imageCaption }),
              ...(messageType === 'document' && { documentUrl, documentFilename, documentCaption }),
              ...(messageType === 'video' && { videoUrl, videoCaption }),
              ...(messageType === 'audio' && { audioUrl }),
              ...(messageType === 'location' && { lat: locationLat, lon: locationLon, locationName, locationAddress })
            }
          }

          // Log to sent_messages table
          await fetch('/api/customer/whatsapp/sent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(logData)
          })

        } catch (logError) {
          console.warn('Failed to log sent message:', logError)
          // Don't show error to user, just log it
        }

        notifications.show({
          title: `✅ ${messageTypeLabel} Sent!`,
          message: `${messageTypeLabel} sent successfully to ${recipientNumber}${result.data?.messageId ? ` (ID: ${result.data.messageId})` : ''}`,
          color: 'green',
          autoClose: 7000
        })
        
        // Clear form fields after successful send
        if (messageType === 'text') setMessageText('')
        if (messageType === 'image') {
          setImageUrl('')
          setImageCaption('')
        }
        if (messageType === 'document') {
          setDocumentUrl('')
          setDocumentFilename('')
          setDocumentCaption('')
        }
        if (messageType === 'video') {
          setVideoUrl('')
          setVideoCaption('')
        }
        if (messageType === 'audio') setAudioUrl('')
        if (messageType === 'location') {
          setLocationLat('')
          setLocationLon('')
          setLocationName('')
          setLocationAddress('')
        }
      } else {
        notifications.show({
          title: '❌ Message Failed',
          message: result.error || 'Failed to send message',
          color: 'red',
          autoClose: 8000
        })
      }
    } catch (error) {
      notifications.show({
        title: '🚨 Network Error',
        message: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        color: 'red',
        autoClose: 8000
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
    setAddToQueue(false)
    setPriority(0)
    setScheduledDateTime('')
  }

  const loadQuickTemplate = (type: string) => {
    switch (type) {
      case 'basic':
        setMessageType('text')
        setMessageText('Hello! This is a test message from WhatsApp API.')
        break
      case 'emoji':
        setMessageType('text')
        setMessageText('🤖 Automated message test\n\nTimestamp: ' + new Date().toLocaleString())
        break
      case 'image':
        setMessageType('image')
        setImageUrl('https://picsum.photos/400/300?random=' + Date.now())
        setImageCaption('📸 Test Image from Picsum\n\nThis is a random test image!')
        break
      case 'location':
        setMessageType('location')
        setLocationLat('19.0760')
        setLocationLon('72.8777')
        setLocationName('Mumbai, Maharashtra')
        setLocationAddress('Mumbai, Maharashtra, India')
        break
    }
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  return (
    <div>
      <CustomerHeader 
        title="Send Messages"
        subtitle="Send WhatsApp messages, images, documents, and more from your connected devices"
        badge={{ 
          label: realTimeConnected ? 'Live • Message Center' : 'Message Center', 
          color: realTimeConnected ? 'green' : 'blue' 
        }}
      />
      
      <Container size="xl" py="md">
        <Stack gap="lg">
          {/* Subscription Status */}
          {subscriptionStatus && (
            <Card withBorder padding="lg" style={{ 
              backgroundColor: subscriptionStatus.valid ? 
                'var(--mantine-color-green-0)' : 'var(--mantine-color-red-0)',
              borderColor: subscriptionStatus.valid ? 
                'var(--mantine-color-green-3)' : 'var(--mantine-color-red-3)'
            }}>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <Badge 
                    color={subscriptionStatus.valid ? 'green' : 'red'}
                    size="lg"
                  >
                    {subscriptionStatus.valid ? '✅ Active' : '❌ Invalid'}
                  </Badge>
                  <div>
                    <Text size="lg" fw={600}>
                      {subscriptionStatus.subscription?.packageName || 'No Package'}
                    </Text>
                    <Text size="sm" c={subscriptionStatus.valid ? 'green' : 'red'}>
                      {subscriptionStatus.message}
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
              
              {subscriptionStatus.subscription && (
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">Messages Used</Text>
                    <Text fw={500}>
                      {subscriptionStatus.subscription.messagesUsed || 0}
                      {subscriptionStatus.subscription.messageLimit && 
                        ` / ${subscriptionStatus.subscription.messageLimit}`
                      }
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">Days Remaining</Text>
                    <Text fw={500}>
                      {subscriptionStatus.subscription.daysRemaining || 0} days
                    </Text>
                  </Grid.Col>
                </Grid>
              )}
            </Card>
          )}
          
          {/* Connected Devices Status */}
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <IconBrandWhatsapp size={24} color="#25D366" />
                <div>
                  <Text size="lg" fw={600}>Connected Devices</Text>
                  <Text size="sm" c="dimmed">
                    Select a device to send messages from
                    {realTimeConnected && (
                      <Text component="span" size="xs" c="green" ml="xs">
                        • Live updates active
                      </Text>
                    )}
                  </Text>
                </div>
              </Group>
              <Group gap="sm">
                {realTimeConnected && (
                  <Badge size="sm" color="green" variant="dot">
                    Live Updates
                  </Badge>
                )}
                <Button
                  variant="light"
                  onClick={fetchConnectedDevices}
                  leftSection={<IconDeviceMobile size="1rem" />}
                  size="sm"
                >
                  Refresh Devices
                </Button>
              </Group>
            </Group>
            
            {devices.length > 0 ? (
              <Group gap="md">
                <Badge size="lg" color="green" variant="light">
                  📱 {devices.length} Connected Device{devices.length !== 1 ? 's' : ''}
                </Badge>
                <Text size="sm" c="dimmed">
                  Ready to send messages
                </Text>
              </Group>
            ) : (
              <Alert icon={<IconX size="1rem" />} color="yellow">
                <Text size="sm" fw={500}>No Connected Devices</Text>
                <Text size="xs">
                  Please connect at least one WhatsApp device from the "My Devices" page before sending messages.
                </Text>
              </Alert>
            )}
          </Card>

          {/* Message Sending Form */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card withBorder padding="lg">
                <Title order={3} mb="lg">Send WhatsApp Message</Title>
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
                    leftSection={<IconBrandWhatsapp size="1rem" color="#25d366" />}
                    disabled={devices.length === 0}
                  />

                  {/* Recipient Number */}
                  <TextInput
                    label="Recipient Phone Number"
                    placeholder="e.g., 919876543210 or 8983063144"
                    value={recipientNumber}
                    onChange={(e) => setRecipientNumber(e.target.value)}
                    leftSection={<IconPhone size="1rem" />}
                    description="Enter the recipient's WhatsApp number (with country code)"
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

                  {/* Content Fields based on message type */}
                  {messageType === 'text' && (
                    <Textarea
                      label="Message Text"
                      placeholder="Enter your message here..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      minRows={3}
                      maxRows={6}
                      autosize
                      leftSection={<IconMessage size="1rem" />}
                    />
                  )}

                  {messageType === 'image' && (
                    <Stack gap="sm">
                      <TextInput
                        label="Image URL"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        leftSection={<IconPhoto size="1rem" />}
                        description="Enter a valid image URL (JPG, PNG, GIF)"
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

                  {messageType === 'document' && (
                    <Stack gap="sm">
                      <TextInput
                        label="Document URL"
                        placeholder="https://example.com/document.pdf"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        leftSection={<IconFile size="1rem" />}
                        description="Enter a valid document URL (PDF, DOC, TXT, etc.)"
                      />
                      <TextInput
                        label="Filename"
                        placeholder="document.pdf"
                        value={documentFilename}
                        onChange={(e) => setDocumentFilename(e.target.value)}
                        leftSection={<IconFile size="1rem" />}
                        description="Filename to display in WhatsApp"
                      />
                      <Textarea
                        label="Document Caption (Optional)"
                        placeholder="Enter caption for the document..."
                        value={documentCaption}
                        onChange={(e) => setDocumentCaption(e.target.value)}
                        minRows={2}
                        maxRows={4}
                        autosize
                      />
                    </Stack>
                  )}

                  {messageType === 'video' && (
                    <Stack gap="sm">
                      <TextInput
                        label="Video URL"
                        placeholder="https://example.com/video.mp4"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        leftSection={<IconVideo size="1rem" />}
                        description="Enter a valid video URL (MP4, AVI, MOV, etc.)"
                      />
                      <Textarea
                        label="Video Caption (Optional)"
                        placeholder="Enter caption for the video..."
                        value={videoCaption}
                        onChange={(e) => setVideoCaption(e.target.value)}
                        minRows={2}
                        maxRows={4}
                        autosize
                      />
                    </Stack>
                  )}

                  {messageType === 'audio' && (
                    <TextInput
                      label="Audio URL"
                      placeholder="https://example.com/audio.mp3"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      leftSection={<IconMusic size="1rem" />}
                      description="Enter a valid audio URL (MP3, WAV, M4A, etc.)"
                    />
                  )}

                  {messageType === 'location' && (
                    <Stack gap="sm">
                      <Group grow>
                        <TextInput
                          label="Latitude"
                          placeholder="19.0760"
                          value={locationLat}
                          onChange={(e) => setLocationLat(e.target.value)}
                          leftSection={<IconMapPin size="1rem" />}
                          description="Latitude coordinate"
                        />
                        <TextInput
                          label="Longitude"
                          placeholder="72.8777"
                          value={locationLon}
                          onChange={(e) => setLocationLon(e.target.value)}
                          leftSection={<IconMapPin size="1rem" />}
                          description="Longitude coordinate"
                        />
                      </Group>
                      <TextInput
                        label="Location Name (Optional)"
                        placeholder="Mumbai, Maharashtra"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        leftSection={<IconMapPin size="1rem" />}
                      />
                      <TextInput
                        label="Address (Optional)"
                        placeholder="Mumbai, Maharashtra, India"
                        value={locationAddress}
                        onChange={(e) => setLocationAddress(e.target.value)}
                        leftSection={<IconMapPin size="1rem" />}
                      />
                    </Stack>
                  )}

                  {/* Queue Options */}
                  <Card withBorder padding="md" style={{ backgroundColor: addToQueue ? '#e3f2fd' : '#f8f9fa' }}>
                    <Stack gap="md">
                      <Switch
                        label="Add to Message Queue"
                        description="Schedule or queue this message instead of sending immediately"
                        checked={addToQueue}
                        onChange={(event) => setAddToQueue(event.currentTarget.checked)}
                        color="blue"
                      />

                      {addToQueue && (
                        <Stack gap="sm">
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
                            placeholder="Leave empty for immediate queue processing"
                            type="datetime-local"
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            leftSection={<IconClock size="1rem" />}
                            description="If not specified, message will be processed immediately by the queue"
                          />
                        </Stack>
                      )}
                    </Stack>
                  </Card>

                  {/* Action Buttons */}
                  <Group gap="md" mt="lg">
                    <Button
                      leftSection={addToQueue ? <IconClock size="1rem" /> : <IconSend size="1rem" />}
                      onClick={sendMessage}
                      loading={messageSending}
                      disabled={
                        !selectedDevice || 
                        !recipientNumber || 
                        devices.length === 0 || 
                        !subscriptionStatus?.valid
                      }
                      size="md"
                      variant="gradient"
                      gradient={addToQueue ? { from: 'blue', to: 'cyan', deg: 45 } : { from: 'teal', to: 'green', deg: 45 }}
                      flex={1}
                    >
                      {messageSending ? (addToQueue ? 'Adding to Queue...' : 'Sending...') : 
                       addToQueue ? (scheduledDateTime ? 'Schedule Message' : 'Add to Queue') :
                       `Send ${messageType === 'text' ? 'Message' : messageType.charAt(0).toUpperCase() + messageType.slice(1)}`}
                    </Button>
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
              </Card>
            </Grid.Col>

            {/* Quick Templates & Help */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                {/* Quick Templates */}
                <Card withBorder padding="md">
                  <Title order={5} mb="md">🚀 Quick Templates</Title>
                  <Stack gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      fullWidth
                      onClick={() => loadQuickTemplate('basic')}
                      disabled={messageSending}
                    >
                      Basic Test Message
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      fullWidth
                      onClick={() => loadQuickTemplate('emoji')}
                      disabled={messageSending}
                    >
                      Message with Emoji & Time
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      fullWidth
                      leftSection={<IconPhoto size="0.8rem" />}
                      onClick={() => loadQuickTemplate('image')}
                      disabled={messageSending}
                    >
                      Sample Image
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="teal"
                      fullWidth
                      leftSection={<IconMapPin size="0.8rem" />}
                      onClick={() => loadQuickTemplate('location')}
                      disabled={messageSending}
                    >
                      Mumbai Location
                    </Button>
                  </Stack>
                </Card>

                {/* Message Guide */}
                <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
                  <Title order={6} mb="sm">📱 Message Guide</Title>
                  <Stack gap={4}>
                    <Text size="xs">
                      • <strong>Device Status:</strong> Only connected devices can send messages
                    </Text>
                    <Text size="xs">
                      • <strong>Phone Format:</strong> Enter with country code (e.g., 919876543210)
                    </Text>
                    <Text size="xs">
                      • <strong>Images:</strong> JPG, PNG, GIF URLs work best
                    </Text>
                    <Text size="xs">
                      • <strong>Documents:</strong> PDF, DOC, TXT - specify filename
                    </Text>
                    <Text size="xs">
                      • <strong>Videos:</strong> MP4 format recommended
                    </Text>
                    <Text size="xs">
                      • <strong>Location:</strong> Use decimal coordinates
                    </Text>
                    <Text size="xs">
                      • <strong>Rate Limits:</strong> Wait between messages to avoid limits
                    </Text>
                  </Stack>
                </Card>

                {/* Status */}
                <Card withBorder padding="md" style={{ backgroundColor: '#e8f5e8' }}>
                  <Title order={6} mb="sm">✅ Feature Status</Title>
                  <Stack gap={2}>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Text messages: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Image attachments: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Document attachments: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Video attachments: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Audio attachments: Working</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size="0.8rem" color="green" />
                      <Text size="xs" c="green">Location sharing: Working</Text>
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