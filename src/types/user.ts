export interface User {
  id: number
  name: string
  email: string
  mobile?: string
  phone?: string
  role: string
  status: string
  lastLogin: string
  messagesUsed: number
  messagesLimit: number
  parentId: number | null
  createdAt: string
  package: string
  totalTransactions: number
  language?: string
  isActive?: boolean
  dealerCode?: string | null  // Auto-generated for SUBDEALERs
  referredByDealerCode?: string | null  // For customers - which dealer code they used
}

export interface SessionUser {
  id: string
  email?: string | null
  name?: string | null
  role?: string
  parentId?: string | null
}

export interface ExtendedSession {
  user: SessionUser
}

export interface ApiWhereClause {
  instanceId?: string
  chatId?: string
}