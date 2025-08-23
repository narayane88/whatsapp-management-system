'use client'

import React from 'react'
import { Box, Text } from '@mantine/core'
import { FiMessageCircle, FiWifi, FiCheck } from 'react-icons/fi'

// CSS-in-JS Animation styles
const animations = {
  pulse: {
    animation: 'whatsapp-pulse 1.5s infinite',
  },
  bounce: {
    animation: 'whatsapp-bounce 1.4s infinite ease-in-out',
  },
  spin: {
    animation: 'whatsapp-spin 2s linear infinite',
  },
  fadeIn: {
    animation: 'whatsapp-fade-in 0.5s ease-in-out',
  },
  typing: {
    animation: 'whatsapp-typing-dots 1.5s infinite',
  },
}

// CSS keyframes (will be injected)
const injectKeyframes = () => {
  if (typeof document === 'undefined') return
  
  const styleId = 'whatsapp-loader-keyframes'
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes whatsapp-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    
    @keyframes whatsapp-bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    @keyframes whatsapp-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes whatsapp-fade-in {
      0% { opacity: 0; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    @keyframes whatsapp-typing-dots {
      0%, 20% { color: transparent; text-shadow: .25em 0 0 transparent, .5em 0 0 transparent; }
      40% { color: #25d366; text-shadow: .25em 0 0 transparent, .5em 0 0 transparent; }
      60% { color: #25d366; text-shadow: .25em 0 0 #25d366, .5em 0 0 transparent; }
      80%, 100% { color: #25d366; text-shadow: .25em 0 0 #25d366, .5em 0 0 #25d366; }
    }
  `
  document.head.appendChild(style)
}

interface WhatsAppLoaderProps {
  variant?: 'default' | 'typing' | 'connecting' | 'sending' | 'compact'
  message?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function WhatsAppLoader({ 
  variant = 'default', 
  message = 'Loading...', 
  size = 'md',
  showIcon = true 
}: WhatsAppLoaderProps) {
  // Inject keyframes on mount
  React.useEffect(() => {
    injectKeyframes()
  }, [])

  const sizeStyles = {
    sm: { containerSize: 60, iconSize: 20, textSize: 'sm' },
    md: { containerSize: 80, iconSize: 24, textSize: 'md' },
    lg: { containerSize: 100, iconSize: 32, textSize: 'lg' },
  }

  const currentSize = sizeStyles[size]

  const renderLoader = () => {
    switch (variant) {
      case 'typing':
        return (
          <Box style={{ textAlign: 'center' }}>
            <Box
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#e5ddd5',
                borderRadius: 18,
                padding: '8px 16px',
                marginBottom: 16,
              }}
            >
              <Box
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#9e9e9e',
                  borderRadius: '50%',
                  marginRight: 4,
                  animation: 'whatsapp-bounce 1.4s infinite ease-in-out',
                  animationDelay: '0s',
                }}
              />
              <Box
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#9e9e9e',
                  borderRadius: '50%',
                  marginRight: 4,
                  animation: 'whatsapp-bounce 1.4s infinite ease-in-out',
                  animationDelay: '0.2s',
                }}
              />
              <Box
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#9e9e9e',
                  borderRadius: '50%',
                  animation: 'whatsapp-bounce 1.4s infinite ease-in-out',
                  animationDelay: '0.4s',
                }}
              />
            </Box>
            {message && (
              <Text size={currentSize.textSize as any} c="dimmed">
                {message}
              </Text>
            )}
          </Box>
        )

      case 'connecting':
        return (
          <Box style={{ textAlign: 'center' }}>
            <Box
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: currentSize.containerSize,
                height: currentSize.containerSize,
                borderRadius: '50%',
                backgroundColor: '#25d366',
                marginBottom: 16,
                animation: 'whatsapp-pulse 2s infinite',
              }}
            >
              <FiWifi 
                size={currentSize.iconSize} 
                color="white"
                style={{ animation: 'whatsapp-spin 2s linear infinite' }}
              />
            </Box>
            {message && (
              <Text size={currentSize.textSize as any} c="dimmed">
                {message}
              </Text>
            )}
          </Box>
        )

      case 'sending':
        return (
          <Box style={{ textAlign: 'center' }}>
            <Box
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: currentSize.containerSize,
                height: currentSize.containerSize,
                borderRadius: '50%',
                backgroundColor: '#128c7e',
                marginBottom: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                  animation: 'whatsapp-spin 1.5s linear infinite',
                }}
              />
              <Box style={{ position: 'relative', display: 'inline-flex' }}>
                <FiCheck 
                  size={currentSize.iconSize} 
                  color="white"
                />
                <FiCheck 
                  size={currentSize.iconSize} 
                  color="white"
                  style={{ 
                    position: 'absolute', 
                    left: Math.round(currentSize.iconSize * 0.3),
                    opacity: 0.7 
                  }}
                />
              </Box>
            </Box>
            {message && (
              <Text size={currentSize.textSize as any} c="dimmed">
                {message}
              </Text>
            )}
          </Box>
        )

      case 'compact':
        return (
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Box
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#25d366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'whatsapp-pulse 1.5s infinite',
              }}
            >
              <FiMessageCircle size={12} color="white" />
            </Box>
            {message && (
              <Text size="sm" c="dimmed">
                {message}
              </Text>
            )}
          </Box>
        )

      default:
        return (
          <Box style={{ textAlign: 'center' }}>
            {showIcon && (
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: currentSize.containerSize,
                  height: currentSize.containerSize,
                  borderRadius: '50%',
                  backgroundColor: '#25d366',
                  marginBottom: 16,
                  animation: 'whatsapp-fade-in 0.5s ease-in-out',
                }}
              >
                <FiMessageCircle 
                  size={currentSize.iconSize} 
                  color="white"
                  style={{ animation: 'whatsapp-pulse 1.5s infinite' }}
                />
              </Box>
            )}
            {message && (
              <Box style={{ position: 'relative', overflow: 'hidden' }}>
                <Text size={currentSize.textSize as any} c="dimmed">
                  {message}
                </Text>
                <Text
                  size={currentSize.textSize as any}
                  c="dimmed"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    fontFamily: 'monospace',
                    animation: 'whatsapp-typing-dots 1.5s infinite',
                  }}
                >
                  ...
                </Text>
              </Box>
            )}
          </Box>
        )
    }
  }

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: variant === 'compact' ? 8 : 20,
      }}
    >
      {renderLoader()}
    </Box>
  )
}

// Additional WhatsApp-style message bubble loader
export function WhatsAppMessageLoader({ 
  messages = ['Connecting to WhatsApp...', 'Loading conversations...', 'Almost ready...'],
  currentIndex = 0 
}: { 
  messages?: string[], 
  currentIndex?: number 
}) {
  return (
    <Box style={{ maxWidth: 280, margin: '0 auto' }}>
      {messages.map((msg, index) => (
        <Box
          key={index}
          style={{
            display: 'flex',
            marginBottom: 8,
            opacity: index <= currentIndex ? 1 : 0.3,
            transition: 'opacity 0.3s ease',
          }}
        >
          <Box
            style={{
              backgroundColor: index === currentIndex ? '#dcf8c6' : '#f0f0f0',
              borderRadius: '18px 18px 18px 4px',
              padding: '8px 12px',
              maxWidth: '80%',
              position: 'relative',
              animation: index === currentIndex ? 'whatsapp-fade-in 0.3s ease-in-out' : undefined,
            }}
          >
            <Text size="sm">{msg}</Text>
            {index === currentIndex && (
              <Box
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <FiCheck size={12} color="#4fc3f7" />
                <FiCheck size={12} color="#4fc3f7" style={{ marginLeft: -8 }} />
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}