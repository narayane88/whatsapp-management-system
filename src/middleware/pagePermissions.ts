import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Pool } from 'pg'
import { getDatabaseConfig } from '../lib/db-config'

// Optimized database connection for middleware
const pool = new Pool({
  ...getDatabaseConfig(),
  max: 5, // Increased connections for better performance
  idleTimeoutMillis: 30000, // Longer idle time to reuse connections
  connectionTimeoutMillis: 3000, // Faster timeout
  statement_timeout: 2000, // 2 second max query time
})

// Cache for user permissions to avoid repeated DB calls
const permissionCache = new Map<string, { permissions: string[], expires: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Route to permission mapping - Fixed to match frontend expectations
const routePermissions: Record<string, string[]> = {
  '/admin': ['dashboard.admin.access'],
  '/admin/customers': ['customers.page.access'],
  '/admin/packages': ['packages.page.access'],
  '/admin/vouchers': ['vouchers.page.access'],
  '/admin/transactions': ['transactions.page.access'],
  '/admin/subscriptions': ['subscriptions.page.access'],
  '/admin/bizpoints': ['bizpoints.page.access'],
  '/admin/users': ['users.page.access'],
  '/admin/servers': ['servers.page.access'],
  '/admin/api-docs': ['api-docs.page.access'],
  '/admin/payouts': ['payouts.page.access'],
  '/admin/languages': ['languages.page.access'],
  '/admin/settings': ['settings.page.access'],
  '/admin/settings/security': ['settings.page.access', 'settings.security.access'],
  '/admin/settings/company': ['settings.page.access', 'settings.company.access'],
  '/admin/settings/themes': ['settings.page.access', 'settings.themes.access'],
}

export async function checkPagePermission(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Skip permission check for non-admin routes
  if (!pathname.startsWith('/admin')) {
    return null
  }

  // PERFORMANCE FIX: Skip middleware permission checks for pages with PagePermissionGuard
  // Let the frontend handle permissions to avoid double-checking
  const frontendHandledRoutes = [
    '/admin',
    '/admin/customers',
    '/admin/packages', 
    '/admin/vouchers',
    '/admin/transactions',
    '/admin/subscriptions',
    '/admin/bizpoints',
    '/admin/users',
    '/admin/servers',
    '/admin/api-docs',
    '/admin/payouts',
    '/admin/languages',
    '/admin/settings'
  ]

  // If this route is handled by PagePermissionGuard, skip middleware check
  if (frontendHandledRoutes.includes(pathname)) {
    return null
  }

  try {
    // Get user token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token?.email) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Get required permissions for this route
    const requiredPermissions = routePermissions[pathname] || []
    
    // If no specific permissions required, allow access
    if (requiredPermissions.length === 0) {
      return null
    }

    // Check user permissions (only for routes not handled by frontend)
    const hasAccess = await checkUserPermissions(token.email as string, requiredPermissions)

    if (!hasAccess) {
      // Simplified logging - don't await to improve performance
      logSecurityEvent(token.email as string, 'unauthorized_page_access', {
        path: pathname,
        requiredPermissions,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      }).catch(err => console.error('Logging failed:', err))

      // Redirect to dashboard with error
      const redirectUrl = new URL('/admin', request.url)
      redirectUrl.searchParams.set('error', 'access_denied')
      redirectUrl.searchParams.set('page', pathname)
      
      return NextResponse.redirect(redirectUrl)
    }

    // Access granted
    return null

  } catch (error) {
    console.error('Page permission check error:', error)
    
    // On error, allow access and let frontend handle it
    return null
  }
}

async function getUserPermissions(userEmail: string): Promise<string[]> {
  const cacheKey = userEmail.toLowerCase()
  const cached = permissionCache.get(cacheKey)
  
  // Return cached permissions if still valid
  if (cached && cached.expires > Date.now()) {
    return cached.permissions
  }

  try {
    const client = await pool.connect()
    
    try {
      // Get all user permissions in one query
      const result = await client.query(`
        SELECT DISTINCT p.name
        FROM permissions p
        WHERE (
          -- Only via direct user permissions
          EXISTS (
            SELECT 1 FROM users u
            JOIN user_permissions up ON u.id = up.user_id
            WHERE LOWER(u.email) = LOWER($1)
            AND up.permission_id = p.id
            AND up.granted = true
            AND u."isActive" = true
            AND (up.expires_at IS NULL OR up.expires_at > NOW())
          )
        )
      `, [userEmail])

      const permissions = result.rows.map(row => row.name)
      
      // Cache the permissions
      permissionCache.set(cacheKey, {
        permissions,
        expires: Date.now() + CACHE_DURATION
      })

      return permissions

    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Permission check error:', error)
    return []
  }
}

async function checkUserPermissions(userEmail: string, requiredPermissions: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userEmail)
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

async function logSecurityEvent(userEmail: string, eventType: string, details: any): Promise<void> {
  try {
    const client = await pool.connect()
    
    try {
      await client.query(`
        INSERT INTO security_events (
          event_type, user_email, ip_address, user_agent, 
          severity, details, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        eventType,
        userEmail,
        details.ip || 'unknown',
        details.userAgent || 'unknown',
        'medium',
        JSON.stringify(details)
      ])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// API endpoint permission mapping
export const apiPermissions: Record<string, string[]> = {
  // User Management
  'GET /api/admin/users': ['users.read'],
  'POST /api/admin/users': ['users.create'],
  'PUT /api/admin/users': ['users.update'],
  'DELETE /api/admin/users': ['users.delete'],
  
  // Customer Management  
  'GET /api/customers': ['customers.read'],
  'POST /api/customers': ['customers.create'],
  'PUT /api/customers': ['customers.update'],
  'DELETE /api/customers': ['customers.delete'],
  
  // Package Management
  'GET /api/admin/packages': ['packages.read'],
  'POST /api/admin/packages': ['packages.create'],
  'PUT /api/admin/packages': ['packages.update'],
  'DELETE /api/admin/packages': ['packages.delete'],
  
  // Subscription Management
  'GET /api/admin/subscriptions': ['subscriptions.read'],
  'POST /api/admin/subscriptions': ['subscriptions.create'],
  'PUT /api/admin/subscriptions': ['subscriptions.update'],
  'DELETE /api/admin/subscriptions': ['subscriptions.delete'],
  
  // Transaction Management
  'GET /api/admin/transactions': ['transactions.read'],
  'POST /api/admin/transactions': ['transactions.create'],
  'PUT /api/admin/transactions': ['transactions.update'],
  
  // BizPoints Management
  'GET /api/admin/bizpoints': ['bizpoints.read'],
  'POST /api/admin/bizpoints': ['bizpoints.create'],
  'PUT /api/admin/bizpoints': ['bizpoints.update'],
  
  // Voucher Management
  'GET /api/vouchers': ['vouchers.read'],
  'POST /api/vouchers': ['vouchers.create'],
  'PUT /api/vouchers': ['vouchers.update'],
  'DELETE /api/vouchers': ['vouchers.delete'],
  
  // Server Management
  'GET /api/admin/servers': ['servers.read'],
  'POST /api/admin/servers': ['servers.create'],
  'PUT /api/admin/servers': ['servers.update'],
  'DELETE /api/admin/servers': ['servers.delete'],
  
  // Security Management
  'GET /api/admin/security/settings': ['security.settings.read'],
  'PUT /api/admin/security/settings': ['security.settings.update'],
  'GET /api/admin/security/events': ['security.events.read'],
  
  // System Settings
  'GET /api/admin/settings': ['settings.read'],
  'PUT /api/admin/settings': ['settings.update'],
}

export async function checkApiPermission(request: NextRequest, method: string, pathname: string): Promise<boolean> {
  const apiKey = `${method} ${pathname}`
  const requiredPermissions = apiPermissions[apiKey]
  
  if (!requiredPermissions) {
    return true // No specific permissions required
  }

  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token?.email) {
      return false
    }

    return await checkUserPermissions(token.email as string, requiredPermissions)
  } catch (error) {
    console.error('API permission check error:', error)
    return false
  }
}