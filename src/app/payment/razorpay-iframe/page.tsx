'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Stack, Text, Button, Loader, Alert } from '@mantine/core'
import { useSearchParams } from 'next/navigation'
import * as Icons from 'react-icons/fi'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function RazorpayIframePage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const sessionId = searchParams.get('session') 
  const keyId = searchParams.get('key')
  
  const [loading, setLoading] = useState(true)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true)
          return
        }

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.head.appendChild(script)
      })
    }

    loadRazorpayScript().then((loaded) => {
      setRazorpayLoaded(!!loaded)
      if (loaded) {
        setLoading(false)
        // Notify parent that iframe is ready
        window.parent.postMessage({
          type: 'IFRAME_READY',
          data: { sessionId, orderId }
        }, '*')
      } else {
        setError('Failed to load Razorpay payment gateway')
        setLoading(false)
      }
    })
  }, [sessionId, orderId])

  // Fetch order details and initialize payment
  useEffect(() => {
    if (!razorpayLoaded || !orderId || !keyId) return

    const initializePayment = async () => {
      try {
        // Fetch order details from our API
        const response = await fetch(`/api/payments/order-details/${orderId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch order details')
        }
        
        const orderData = await response.json()
        
        // Configure Razorpay options
        const options = {
          key: keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'WhatsApp Business Manager',
          description: orderData.description || 'Subscription Payment',
          order_id: orderId,
          handler: async (response: any) => {
            console.log('💳 Payment successful, verifying with backend:', response)
            
            try {
              // Verify payment with backend
              const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  customer_id: orderData.customer?.id || 'demo-customer-id',
                  package_id: orderData.package?.id || 'unknown'
                })
              })

              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json()
                console.log('✅ Payment verification successful:', verifyData)
                
                // Notify parent window of successful payment with verification data
                window.parent.postMessage({
                  type: 'PAYMENT_SUCCESS',
                  data: {
                    success: true,
                    payment: {
                      id: response.razorpay_payment_id,
                      orderId: response.razorpay_order_id,
                      signature: response.razorpay_signature
                    },
                    verification: verifyData,
                    sessionId
                  }
                }, '*')
              } else {
                const errorData = await verifyResponse.json()
                console.error('❌ Payment verification failed:', errorData)
                
                // Notify parent window of verification failure
                window.parent.postMessage({
                  type: 'PAYMENT_FAILURE',
                  data: {
                    error: 'VERIFICATION_FAILED',
                    message: errorData.error || 'Payment verification failed',
                    sessionId
                  }
                }, '*')
              }
            } catch (error) {
              console.error('❌ Error during payment verification:', error)
              
              // Notify parent window of error
              window.parent.postMessage({
                type: 'PAYMENT_FAILURE',
                data: {
                  error: 'VERIFICATION_ERROR',
                  message: 'Failed to verify payment with server',
                  sessionId
                }
              }, '*')
            }
          },
          prefill: {
            name: orderData.customer?.name || 'Customer',
            email: orderData.customer?.email || '',
            contact: orderData.customer?.phone || ''
          },
          theme: {
            color: '#3b82f6'
          },
          modal: {
            ondismiss: () => {
              // Notify parent window of cancellation
              window.parent.postMessage({
                type: 'PAYMENT_FAILURE',
                data: {
                  error: 'PAYMENT_CANCELLED',
                  message: 'Payment was cancelled by user',
                  sessionId
                }
              }, '*')
            }
          }
        }

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(options)
        razorpay.open()
        
      } catch (error) {
        console.error('Error initializing payment:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize payment')
        
        // Notify parent window of error
        window.parent.postMessage({
          type: 'PAYMENT_FAILURE',
          data: {
            error: 'INITIALIZATION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to initialize payment',
            sessionId
          }
        }, '*')
      }
    }

    initializePayment()
  }, [razorpayLoaded, orderId, keyId, sessionId])

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Card withBorder p="xl">
          <Stack align="center" gap="lg">
            <Loader size="xl" />
            <Text size="lg">Loading Razorpay Payment Gateway...</Text>
            <Text size="sm" c="dimmed">Please wait while we prepare your secure payment</Text>
          </Stack>
        </Card>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Card withBorder p="lg">
          <Alert icon={<Icons.FiAlertTriangle />} color="red" title="Payment Error">
            <Stack gap="sm">
              <Text size="sm">{error}</Text>
              <Button 
                variant="light" 
                size="sm"
                onClick={() => {
                  window.parent.postMessage({
                    type: 'PAYMENT_FAILURE',
                    data: {
                      error: 'IFRAME_ERROR',
                      message: error,
                      sessionId
                    }
                  }, '*')
                }}
              >
                Close Payment Window
              </Button>
            </Stack>
          </Alert>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Card withBorder p="lg">
        <Stack align="center" gap="md">
          <Icons.FiCreditCard size={48} color="#3b82f6" />
          <Text size="lg" fw={500}>Razorpay Payment Gateway</Text>
          <Text size="sm" c="dimmed" ta="center">
            The payment window should open automatically. If it doesn't, please check if pop-ups are blocked.
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            🔒 Secure payment powered by Razorpay
          </Text>
        </Stack>
      </Card>
    </Container>
  )
}