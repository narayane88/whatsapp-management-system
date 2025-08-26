export interface AdminNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  category: 'user' | 'transaction' | 'server' | 'system' | 'security' | 'subscription' | 'whatsapp'
  priority: 'low' | 'medium' | 'high' | 'critical'
  actions?: NotificationAction[]
  metadata?: Record<string, any>
  expiresAt?: Date
  persistent?: boolean
}

export interface NotificationAction {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'danger'
  action: string
  payload?: Record<string, any>
}

export interface NotificationPreferences {
  enableDesktop: boolean
  enableSound: boolean
  enableInApp: boolean
  categories: {
    user: boolean
    transaction: boolean
    server: boolean
    system: boolean
    security: boolean
    subscription: boolean
    whatsapp: boolean
  }
  priority: {
    low: boolean
    medium: boolean
    high: boolean
    critical: boolean
  }
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  recentActivity: number
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkTraffic: number
  activeUsers: number
  serverUptime: number
  lastUpdated: Date
}

export interface RealtimeEvent {
  type: 'notification' | 'metrics' | 'user_activity' | 'system_status' | 'whatsapp_event'
  data: any
  timestamp: Date
  userId?: string
  sessionId?: string
}