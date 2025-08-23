'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Text,
  Image,
  Progress,
  Group,
  Button,
  Alert,
  Center,
  Title,
  Badge,
  ActionIcon,
  Box,
  Paper,
  Flex
} from '@mantine/core'
import {
  IconQrcode,
  IconRefresh,
  IconX,
  IconBrandWhatsapp,
  IconClock,
  IconScan,
  IconCheck,
  IconDeviceMobile
} from '@tabler/icons-react'

interface WhatsAppQRModalProps {
  opened: boolean
  onClose: () => void
  qrCode?: string
  accountName?: string
  serverName?: string
  autoClose?: boolean
  countdownSeconds?: number
}

export default function WhatsAppQRModal({
  opened,
  onClose,
  qrCode,
  accountName = 'WhatsApp Account',
  serverName = 'Server',
  autoClose = true,
  countdownSeconds = 1200
}: WhatsAppQRModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(countdownSeconds)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!opened || !autoClose) return

    setTimeRemaining(countdownSeconds)
    setIsExpired(false)

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [opened, autoClose, countdownSeconds])

  // Handle auto-close in a separate effect to avoid calling onClose during render
  useEffect(() => {
    if (isExpired && autoClose && opened) {
      // Use setTimeout to ensure this runs after the current render cycle
      const timeoutId = setTimeout(() => {
        onClose()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [isExpired, autoClose, opened, onClose])

  const handleRefresh = () => {
    setTimeRemaining(countdownSeconds)
    setIsExpired(false)
    // Trigger refresh callback if provided
  }

  const getTimeColor = () => {
    if (timeRemaining > 600) return 'green'  // > 10 minutes
    if (timeRemaining > 300) return 'yellow' // > 5 minutes
    return 'red'
  }

  const progressValue = (timeRemaining / countdownSeconds) * 100

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      size="xl"
      centered
      closeOnClickOutside={false}
      withCloseButton={false}
      padding={0}
      styles={{
        modal: {
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 17px 50px rgba(11, 20, 26, 0.19), 0 12px 15px rgba(11, 20, 26, 0.24)',
          overflow: 'hidden'
        },
        body: {
          padding: 0,
        }
      }}
    >
      {/* WhatsApp Web-style Layout */}
      <Flex direction="row" h={520}>
        {/* Left Side - QR Code */}
        <Box 
          style={{
            width: '480px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Stack align="center" gap="xl" p="xl">
            {/* WhatsApp Logo */}
            <Box ta="center">
              <IconBrandWhatsapp size={80} color="#25d366" />
              <Title order={3} mt="sm" c="#41525d" fw={300}>
                WhatsApp Web
              </Title>
            </Box>

            {/* QR Code Container - WhatsApp Web Style */}
            <Paper
              shadow="md"
              p={20}
              radius="md"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e9edef'
              }}
            >
              {qrCode && !isExpired ? (
                <Image
                  src={qrCode}
                  alt="QR code to link device"
                  width={350}
                  height={350}
                  style={{ 
                    borderRadius: '4px',
                    display: 'block'
                  }}
                />
              ) : isExpired ? (
                <Center
                  style={{
                    width: 350,
                    height: 350,
                    backgroundColor: '#f0f2f5',
                    borderRadius: '4px'
                  }}
                >
                  <Stack align="center" gap="md">
                    <IconQrcode size="3rem" color="#8696a0" />
                    <Text size="md" c="#8696a0" fw={400}>
                      QR code expired
                    </Text>
                    <Button
                      leftSection={<IconRefresh size="1rem" />}
                      onClick={handleRefresh}
                      variant="outline"
                      color="gray"
                      size="sm"
                    >
                      Click to refresh
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <Center
                  style={{
                    width: 350,
                    height: 350,
                    backgroundColor: '#f0f2f5',
                    borderRadius: '4px'
                  }}
                >
                  <Stack align="center" gap="md">
                    <Progress size="lg" animated color="teal" w={100} />
                    <Text size="sm" c="#8696a0">
                      Loading...
                    </Text>
                  </Stack>
                </Center>
              )}
            </Paper>

            {/* Timer - WhatsApp Web Style */}
            {autoClose && !isExpired && (
              <Group gap="xs">
                <IconClock size={16} color="#8696a0" />
                <Text size="sm" c="#8696a0">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </Text>
              </Group>
            )}
          </Stack>

          {/* Close Button */}
          <ActionIcon
            variant="transparent"
            color="gray"
            onClick={onClose}
            size="lg"
            style={{
              position: 'absolute',
              top: 16,
              right: 16
            }}
          >
            <IconX size="1.4rem" color="#8696a0" />
          </ActionIcon>
        </Box>

        {/* Right Side - Instructions (WhatsApp Web Style) */}
        <Box 
          style={{
            width: '380px',
            backgroundColor: '#f0f2f5',
            padding: '40px 32px'
          }}
        >
          <Stack gap="xl" h="100%">
            <Box>
              <Title order={2} c="#41525d" fw={300} mb="lg">
                Use WhatsApp on your computer
              </Title>
              
              <Stack gap="md">
                <Flex gap="md" align="flex-start">
                  <Text c="#8696a0" fw={500} style={{ minWidth: '20px' }}>1.</Text>
                  <Text size="sm" c="#667781" lh={1.6}>
                    Open WhatsApp on your phone
                  </Text>
                </Flex>
                
                <Flex gap="md" align="flex-start">
                  <Text c="#8696a0" fw={500} style={{ minWidth: '20px' }}>2.</Text>
                  <Text size="sm" c="#667781" lh={1.6}>
                    Tap <Text span fw={500}>Menu</Text> or <Text span fw={500}>Settings</Text> and select <Text span fw={500}>Linked Devices</Text>
                  </Text>
                </Flex>
                
                <Flex gap="md" align="flex-start">
                  <Text c="#8696a0" fw={500} style={{ minWidth: '20px' }}>3.</Text>
                  <Text size="sm" c="#667781" lh={1.6}>
                    Tap <Text span fw={500}>Link a Device</Text> and point your phone at this screen to capture the code
                  </Text>
                </Flex>
              </Stack>
            </Box>

            <Box style={{ marginTop: 'auto' }}>
              <Flex align="center" gap="sm" mb="sm">
                <IconDeviceMobile size={20} color="#8696a0" />
                <Text size="xs" c="#8696a0" fw={500}>
                  Keep your phone connected
                </Text>
              </Flex>
              
              <Text size="xs" c="#8696a0" lh={1.5}>
                For better performance and security, keep your phone connected to the internet.
              </Text>
              
              {accountName !== 'Test Account' && (
                <Paper p="sm" mt="md" radius="sm" bg="rgba(37, 211, 102, 0.1)">
                  <Text size="xs" c="#25d366" fw={500}>
                    Account: {accountName}
                  </Text>
                  <Text size="xs" c="#8696a0">
                    {serverName}
                  </Text>
                </Paper>
              )}
            </Box>
          </Stack>
        </Box>
      </Flex>
    </Modal>
  )
}