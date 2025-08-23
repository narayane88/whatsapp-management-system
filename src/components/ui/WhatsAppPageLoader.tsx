'use client'

import React from 'react'
import { Box, Text, Progress, Stack } from '@mantine/core'
import { FiMessageCircle, FiUsers, FiSend, FiCheck } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import WhatsAppLoader, { WhatsAppMessageLoader } from './WhatsAppLoader'

// Enhanced animations - inject keyframes
const injectPageLoaderKeyframes = () => {
  if (typeof document === 'undefined') return
  
  const styleId = 'whatsapp-page-loader-keyframes'
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes whatsapp-slide-up {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes whatsapp-phone-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }
    
    @keyframes whatsapp-wave {
      0% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.1); opacity: 0.4; }
      100% { transform: scale(1.2); opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

interface WhatsAppPageLoaderProps {
  variant?: 'connecting' | 'loading' | 'sending' | 'custom'
  customMessage?: string
  showProgress?: boolean
  fullScreen?: boolean
  backgroundColor?: string
}

export default function WhatsAppPageLoader({
  variant = 'loading',
  customMessage,
  showProgress = false,
  fullScreen = true,
  backgroundColor = 'rgba(0, 0, 0, 0.05)'
}: WhatsAppPageLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  // Inject keyframes on mount
  React.useEffect(() => {
    injectPageLoaderKeyframes()
  }, [])

  const loadingMessages = {
    connecting: [
      'Initializing WhatsApp connection...',
      'Establishing secure channel...',
      'Verifying authentication...',
      'Connection established!'
    ],
    loading: [
      'Loading your conversations...',
      'Fetching recent messages...',
      'Updating contact list...',
      'Ready to go!'
    ],
    sending: [
      'Preparing message...',
      'Connecting to server...',
      'Sending message...',
      'Message delivered!'
    ],
    custom: [customMessage || 'Loading...']
  }

  const messages = loadingMessages[variant]
  const icons = {
    connecting: FiMessageCircle,
    loading: FiUsers,
    sending: FiSend,
    custom: FiCheck
  }

  const Icon = icons[variant]

  useEffect(() => {
    if (showProgress) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 100
          return prev + Math.random() * 15
        })
      }, 300)

      return () => clearInterval(progressInterval)
    }
  }, [showProgress])

  useEffect(() => {
    if (messages.length > 1) {
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => {
          if (prev >= messages.length - 1) return prev
          return prev + 1
        })
      }, 2000)

      return () => clearInterval(messageInterval)
    }
  }, [messages.length])

  const containerStyle = fullScreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  } : {
    padding: 40,
    textAlign: 'center' as const,
  }

  return (
    <Box style={containerStyle}>
      <Stack align="center" gap="xl">
        {/* Main loading animation */}
        <Box style={{ position: 'relative' }}>
          {/* Animated waves */}
          {[...Array(3)].map((_, i) => (
            <Box
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 120 + (i * 40),
                height: 120 + (i * 40),
                borderRadius: '50%',
                border: '2px solid #25d366',
                opacity: 0.3 - (i * 0.1),
                animation: `whatsapp-wave 2s infinite ${i * 0.5}s`,
              }}
            />
          ))}
          
          {/* Phone icon container */}
          <Box
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: '#25d366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2,
              animation: variant === 'sending' ? 'whatsapp-phone-shake 0.5s infinite' : undefined,
              boxShadow: '0 8px 32px rgba(37, 211, 102, 0.3)',
            }}
          >
            <Icon size={48} color="white" />
          </Box>
        </Box>

        {/* Message bubble loader */}
        <Box
          style={{
            animation: 'whatsapp-slide-up 0.5s ease-out 0.5s both',
          }}
        >
          {variant === 'custom' && customMessage ? (
            <WhatsAppLoader 
              variant="default" 
              message={customMessage} 
              size="lg" 
              showIcon={false}
            />
          ) : (
            <WhatsAppMessageLoader 
              messages={messages} 
              currentIndex={currentMessageIndex}
            />
          )}
        </Box>

        {/* Progress bar */}
        {showProgress && (
          <Box
            style={{
              width: 280,
              animation: 'whatsapp-slide-up 0.5s ease-out 1s both',
            }}
          >
            <Progress
              value={progress}
              size="sm"
              radius="xl"
              color="teal"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }}
            />
            <Text size="xs" c="dimmed" mt={8} ta="center">
              {Math.round(progress)}% complete
            </Text>
          </Box>
        )}

        {/* Powered by WhatsApp text */}
        <Text
          size="xs"
          c="dimmed"
          style={{
            animation: 'whatsapp-slide-up 0.5s ease-out 1.5s both',
            opacity: 0.6,
          }}
        >
          Powered by WhatsApp Business API
        </Text>
      </Stack>
    </Box>
  )
}

// Loading screen for different sections
export function WhatsAppSectionLoader({ 
  title, 
  subtitle, 
  variant = 'default' 
}: { 
  title: string, 
  subtitle?: string, 
  variant?: 'default' | 'compact' 
}) {
  if (variant === 'compact') {
    return (
      <Box py="xl" style={{ textAlign: 'center' }}>
        <WhatsAppLoader variant="compact" message={title} />
        {subtitle && (
          <Text size="xs" c="dimmed" mt={8}>
            {subtitle}
          </Text>
        )}
      </Box>
    )
  }

  return (
    <Box py={60} style={{ textAlign: 'center' }}>
      <WhatsAppLoader variant="default" message={title} size="lg" />
      {subtitle && (
        <Text size="sm" c="dimmed" mt={16}>
          {subtitle}
        </Text>
      )}
    </Box>
  )
}