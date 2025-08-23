export interface PaymentMethodConfig {
  value: string
  label: string
  color: string
  icon?: string
  description?: string
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    value: 'CASH',
    label: 'Cash',
    color: 'green',
    icon: '💵',
    description: 'Cash payment method'
  },
  {
    value: 'BANK',
    label: 'Bank Transfer',
    color: 'blue',
    icon: '🏦',
    description: 'Direct bank transfer'
  },
  {
    value: 'UPI',
    label: 'UPI',
    color: 'orange',
    icon: '📱',
    description: 'Unified Payments Interface'
  },
  {
    value: 'RAZORPAY',
    label: 'Razorpay',
    color: 'indigo',
    icon: '💳',
    description: 'Razorpay payment gateway'
  },
  {
    value: 'GATEWAY',
    label: 'Payment Gateway',
    color: 'purple',
    icon: '🌐',
    description: 'Generic payment gateway'
  },
  {
    value: 'WALLET',
    label: 'Wallet',
    color: 'teal',
    icon: '👛',
    description: 'Digital wallet payment'
  },
  {
    value: 'CREDIT',
    label: 'Credit Balance',
    color: 'cyan',
    icon: '💳',
    description: 'Account credit balance'
  },
  {
    value: 'BIZPOINTS',
    label: 'BizCoins',
    color: 'yellow',
    icon: '🪙',
    description: 'BizCoins payment method'
  }
]

export function getPaymentMethodConfig(method: string): PaymentMethodConfig {
  return PAYMENT_METHODS.find(pm => pm.value === method.toUpperCase()) || {
    value: method,
    label: method,
    color: 'gray',
    description: 'Unknown payment method'
  }
}

export function getPaymentMethodColor(method: string): string {
  return getPaymentMethodConfig(method).color
}

export function getPaymentMethodLabel(method: string): string {
  return getPaymentMethodConfig(method).label
}

export function getPaymentMethodIcon(method: string): string {
  return getPaymentMethodConfig(method).icon || '💰'
}

export function getAllPaymentMethods(): PaymentMethodConfig[] {
  return PAYMENT_METHODS
}

export function getPaymentMethodsForSelect(): { value: string; label: string }[] {
  return PAYMENT_METHODS.map(pm => ({
    value: pm.value,
    label: pm.label
  }))
}

export function getPaymentMethodsWithIcons(): { value: string; label: string }[] {
  return PAYMENT_METHODS.map(pm => ({
    value: pm.value,
    label: `${pm.icon} ${pm.label}`
  }))
}