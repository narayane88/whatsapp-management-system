import Razorpay from 'razorpay'

interface RazorpayConfig {
  keyId: string
  keySecret: string
  isTestMode: boolean
}

interface PaymentOrder {
  amount: number
  currency: string
  receipt: string
  notes?: Record<string, any>
}

interface PaymentOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  offer_id: null | string
  status: string
  attempts: number
  notes: Record<string, any>
  created_at: number
}

class RazorpayService {
  private razorpay: Razorpay | null = null
  private config: RazorpayConfig | null = null

  async initialize(config: RazorpayConfig) {
    try {
      this.config = config
      this.razorpay = new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret
      })
      return true
    } catch (error) {
      console.error('Error initializing Razorpay:', error)
      return false
    }
  }

  async createOrder(orderData: PaymentOrder): Promise<PaymentOrderResponse> {
    if (!this.razorpay) {
      throw new Error('Razorpay not initialized')
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes || {}
      })

      return {
        ...order,
        amount: Number(order.amount)
      }
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error)
      
      // Handle specific Razorpay errors
      if (error.statusCode === 401) {
        throw new Error('Invalid Razorpay API credentials. Please check your Key ID and Secret.')
      }
      
      if (error.statusCode === 400) {
        throw new Error(`Razorpay API Error: ${error.error?.description || 'Invalid request parameters'}`)
      }
      
      throw new Error(error.error?.description || 'Failed to create payment order')
    }
  }

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<boolean> {
    if (!this.razorpay || !this.config) {
      throw new Error('Razorpay not initialized')
    }

    try {
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', this.config.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpaySignature)
      )
    } catch (error) {
      console.error('Error verifying payment:', error)
      return false
    }
  }

  async fetchPayment(paymentId: string) {
    if (!this.razorpay) {
      throw new Error('Razorpay not initialized')
    }

    try {
      return await this.razorpay.payments.fetch(paymentId)
    } catch (error) {
      console.error('Error fetching payment:', error)
      throw error
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    if (!this.razorpay) {
      throw new Error('Razorpay not initialized')
    }

    try {
      const refundData: any = {}
      if (amount) {
        refundData.amount = amount * 100 // Convert to paise
      }

      return await this.razorpay.payments.refund(paymentId, refundData)
    } catch (error) {
      console.error('Error processing refund:', error)
      throw error
    }
  }
}

export const razorpayService = new RazorpayService()
export default razorpayService