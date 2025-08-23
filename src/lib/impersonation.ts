import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from './db-config'

const pool = new Pool(getDatabaseConfig())

interface ImpersonationResult {
  isImpersonating: boolean
  targetUserId: number | null
  targetUserEmail: string | null
  adminUserId: number | null
  adminUserEmail: string | null
}

/**
 * Utility function to handle impersonation context in API routes
 * Checks if the request is from an admin impersonating a customer
 * Returns the appropriate user data to use for database queries
 */
export async function getImpersonationContext(request: NextRequest): Promise<ImpersonationResult> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return {
      isImpersonating: false,
      targetUserId: null,
      targetUserEmail: null,
      adminUserId: null,
      adminUserEmail: null
    }
  }

  // Check if this is an impersonation request
  const impersonationCookie = request.cookies.get('impersonation_active')?.value
  const isImpersonating = impersonationCookie === 'true'
  
  if (isImpersonating && ['OWNER', 'ADMIN'].includes(session.user.role || '')) {
    // During impersonation, get the impersonated customer ID from query parameter
    const { searchParams } = new URL(request.url)
    const impersonatedCustomerId = searchParams.get('impersonatedCustomerId')
    
    if (impersonatedCustomerId) {
      try {
        // Get customer data
        const customerResult = await pool.query(
          'SELECT id, email FROM users WHERE id = $1',
          [impersonatedCustomerId]
        )
        
        if (customerResult.rows.length > 0) {
          // Get admin data
          const adminResult = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [session.user.email]
          )
          
          return {
            isImpersonating: true,
            targetUserId: customerResult.rows[0].id,
            targetUserEmail: customerResult.rows[0].email,
            adminUserId: adminResult.rows[0]?.id || null,
            adminUserEmail: session.user.email
          }
        }
      } catch (error) {
        console.error('Error getting impersonation context:', error)
      }
    }
  }
  
  // Normal customer access or failed impersonation
  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )
    
    return {
      isImpersonating: false,
      targetUserId: userResult.rows[0]?.id || null,
      targetUserEmail: session.user.email,
      adminUserId: null,
      adminUserEmail: null
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    return {
      isImpersonating: false,
      targetUserId: null,
      targetUserEmail: null,
      adminUserId: null,
      adminUserEmail: null
    }
  }
}

/**
 * Check if the current session has permission to access customer data
 * Either the user is a customer or an admin impersonating a customer
 */
export function hasCustomerAccess(session: any, isImpersonating: boolean): boolean {
  if (!session?.user?.email) return false
  
  if (session.user.role === 'CUSTOMER') return true
  
  if (isImpersonating && ['OWNER', 'ADMIN'].includes(session.user.role)) return true
  
  return false
}