'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Stack, Text, Button, Loader, Alert } from '@mantine/core'
import { useSearchParams } from 'next/navigation'
import * as Icons from 'react-icons/fi'
import BizCoinIcon from '@/components/icons/BizCoinIcon'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function BizCoinsRazorpayIframePage() {
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
          type: 'BIZCOINS_IFRAME_READY',
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

    const initializeBizCoinsPayment = async () => {
      try {
        // Fetch order details from our API
        const response = await fetch(`/api/payments/order-details/${orderId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch BizCoins order details')
        }
        
        const orderData = await response.json()
        
        // Configure Razorpay options for BizCoins
        const options = {
          key: keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'BizCoins Purchase',
          description: `Purchase ${orderData.notes?.totalCoins || 'BizCoins'} BizCoins`,
          order_id: orderId,
          handler: async (response: any) => {
            console.log('🪙 BizCoins payment successful, verifying with backend:', response)
            
            try {
              // Verify payment with BizCoins-specific verification endpoint
              const verifyResponse = await fetch('/api/admin/bizpoints/purchase/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  purchase_details: {
                    baseAmount: orderData.notes?.baseAmount || 0,
                    commissionBonus: orderData.notes?.commissionBonus || 0,
                    totalCoins: orderData.notes?.totalCoins || 0,
                    description: orderData.notes?.description || 'BizCoins purchase'
                  }
                })
              })

              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json()
                console.log('✅ BizCoins payment verification successful:', verifyData)
                
                // Notify parent window of successful BizCoins purchase
                window.parent.postMessage({
                  type: 'BIZCOINS_PAYMENT_SUCCESS',
                  data: {
                    success: true,
                    payment: {
                      id: response.razorpay_payment_id,
                      orderId: response.razorpay_order_id,
                      signature: response.razorpay_signature
                    },
                    verification: verifyData,
                    purchase: {
                      baseAmount: verifyData.purchase?.baseAmount || 0,
                      commissionBonus: verifyData.purchase?.commissionBonus || 0,
                      totalCoins: verifyData.purchase?.totalCoins || 0,
                      finalBalance: verifyData.purchase?.finalBalance || 0
                    },
                    sessionId
                  }
                }, '*')
              } else {
                const errorData = await verifyResponse.json()
                console.error('❌ BizCoins payment verification failed:', errorData)
                
                // Notify parent window of verification failure
                window.parent.postMessage({
                  type: 'BIZCOINS_PAYMENT_FAILURE',
                  data: {
                    error: 'VERIFICATION_FAILED',
                    message: errorData.error || 'BizCoins payment verification failed',
                    sessionId
                  }
                }, '*')
              }
            } catch (error) {
              console.error('❌ Error during BizCoins payment verification:', error)
              
              // Notify parent window of error
              window.parent.postMessage({
                type: 'BIZCOINS_PAYMENT_FAILURE',
                data: {
                  error: 'VERIFICATION_ERROR',
                  message: 'Failed to verify BizCoins payment with server',
                  sessionId
                }
              }, '*')
            }
          },
          prefill: {
            name: orderData.notes?.userName || 'User',
            email: orderData.notes?.userEmail || '',
            contact: ''
          },
          notes: {
            baseAmount: orderData.notes?.baseAmount,
            commissionBonus: orderData.notes?.commissionBonus,
            totalCoins: orderData.notes?.totalCoins,
            purchaseType: 'BIZCOINS'
          },
          theme: {
            color: '#059669'
          },
          modal: {
            ondismiss: () => {
              // Notify parent window of cancellation
              window.parent.postMessage({
                type: 'BIZCOINS_PAYMENT_FAILURE',
                data: {
                  error: 'PAYMENT_CANCELLED',
                  message: 'BizCoins payment was cancelled by user',
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
        console.error('Error initializing BizCoins payment:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize BizCoins payment')
        
        // Notify parent window of error
        window.parent.postMessage({
          type: 'BIZCOINS_PAYMENT_FAILURE',
          data: {
            error: 'INITIALIZATION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to initialize BizCoins payment',
            sessionId
          }
        }, '*')
      }
    }

    initializeBizCoinsPayment()
  }, [razorpayLoaded, orderId, keyId, sessionId])

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Card withBorder p="xl">
          <Stack align="center" gap="lg">
            <BizCoinIcon size={64} color="#059669" />
            <Loader size="xl" color="green" />
            <Text size="lg" fw={500}>Loading BizCoins Payment Gateway...</Text>
            <Text size="sm" c="dimmed" ta="center">
              Please wait while we prepare your secure BizCoins purchase
            </Text>
          </Stack>
        </Card>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Card withBorder p="lg">
          <Alert icon={<Icons.FiAlertTriangle />} color="red" title="BizCoins Payment Error">
            <Stack gap="sm">
              <Text size="sm">{error}</Text>
              <Button 
                variant="light" 
                size="sm"
                onClick={() => {
                  window.parent.postMessage({
                    type: 'BIZCOINS_PAYMENT_FAILURE',
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
          <BizCoinIcon size={64} color="#059669" />
          <Text size="lg" fw={500}>BizCoins Purchase</Text>
          <Text size="sm" c="dimmed" ta="center">
            The Razorpay payment window should open automatically. If it doesn't, please check if pop-ups are blocked.
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            🔒 Secure payment powered by Razorpay • 🪙 Instant BizCoins delivery
          </Text>
        </Stack>
      </Card>
    </Container>
  )
}