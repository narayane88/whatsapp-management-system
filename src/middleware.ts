import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper function to consolidate Vary headers
function consolidateVaryHeaders(response: NextResponse): NextResponse {
  // Get all vary headers (case-insensitive)
  const varyValues: string[] = []
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'vary') {
      varyValues.push(value)
    }
  })
  
  if (varyValues.length > 1) {
    // Delete all existing vary headers
    response.headers.delete('vary')
    response.headers.delete('Vary')
    
    // Combine all Vary values into a single comma-separated string
    const allValues = varyValues.flatMap(h => h.split(',').map(v => v.trim()))
    const uniqueValues = [...new Set(allValues)]
    response.headers.set('Vary', uniqueValues.join(', '))
  }
  return response
}

// Helper function to prevent duplicate X-Frame-Options
function ensureSingleXFrameOptions(response: NextResponse, pathname: string): NextResponse {
  // Check if header exists
  const existingHeader = response.headers.get('x-frame-options')
  if (existingHeader) {
    // Remove any existing header
    response.headers.delete('x-frame-options')
    response.headers.delete('X-Frame-Options')
    
    // Payment iframe routes should allow SAMEORIGIN
    if (pathname.includes('/payment/') && pathname.includes('-iframe')) {
      response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    } else {
      response.headers.set('X-Frame-Options', 'DENY')
    }
  }
  return response
}

export default withAuth(
  function middleware(req: NextRequest & { nextauth?: any }) {
    const { token } = req.nextauth || {}
    const { pathname } = req.nextUrl

    // API v1 routes use API key authentication, not session auth
    if (pathname.startsWith('/api/v1/')) {
      const response = NextResponse.next()
      return consolidateVaryHeaders(ensureSingleXFrameOptions(response, pathname))
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/auth/signin', '/auth/error', '/']
    
    if (publicRoutes.includes(pathname)) {
      const response = NextResponse.next()
      return consolidateVaryHeaders(ensureSingleXFrameOptions(response, pathname))
    }

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Role-based access control with normalization
    const userRole = token.role as string
    
    // Normalize role name to handle database variations
    const normalizeRole = (role: string): string => {
      if (!role) return 'CUSTOMER'
      const normalized = role.toUpperCase().replace(/\s+/g, '')
      
      // Map variations to standard role names
      if (normalized === 'SHREEDELALER' || normalized === 'DELALER' || normalized === 'DEALER') {
        return 'SUBDEALER'
      }
      return normalized
    }
    
    const normalizedRole = normalizeRole(userRole)

    // Admin routes - accessible by OWNER, ADMIN, SUBDEALER, EMPLOYEE  
    if (pathname.startsWith('/admin')) {
      if (!['OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE'].includes(normalizedRole)) {
        // Redirect CUSTOMER users to customer portal
        return NextResponse.redirect(new URL('/customer', req.url))
      }
    }

    // Customer routes - accessible by CUSTOMER or during impersonation
    if (pathname.startsWith('/customer')) {
      // Check if this is an impersonation request (admins can access customer routes during impersonation)
      const isImpersonating = req.nextUrl.searchParams.get('impersonating') === 'true' || 
                              req.cookies.get('impersonation_active')?.value === 'true'
      
      if (normalizedRole !== 'CUSTOMER' && !(['OWNER', 'ADMIN'].includes(normalizedRole) && isImpersonating)) {
        // Redirect non-customers to admin (unless they're admin users impersonating)
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    // Redirect any dashboard requests (since dashboard is removed)
    if (pathname.startsWith('/dashboard')) {
      // Check if this is an impersonation request
      const isImpersonating = req.nextUrl.searchParams.get('impersonating') === 'true' || 
                              req.cookies.get('impersonation_active')?.value === 'true'
      
      // If impersonating, redirect to customer dashboard
      if (isImpersonating && ['OWNER', 'ADMIN'].includes(normalizedRole)) {
        return NextResponse.redirect(new URL('/customer', req.url))
      }
      
      // Normal role-based redirection
      if (['OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE'].includes(normalizedRole)) {
        return NextResponse.redirect(new URL('/admin', req.url))
      } else {
        // Customers go to customer portal
        return NextResponse.redirect(new URL('/customer', req.url))
      }
    }

    // Owner-only routes
    if (pathname.startsWith('/admin/packages') && normalizedRole !== 'OWNER') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    if (pathname.startsWith('/admin/payouts') && normalizedRole !== 'OWNER') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    if (pathname.startsWith('/admin/servers') && normalizedRole !== 'OWNER') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // SubDealer and Owner routes
    if (pathname.startsWith('/admin/users') && !['OWNER', 'SUBDEALER'].includes(normalizedRole)) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    const response = NextResponse.next()
    return consolidateVaryHeaders(ensureSingleXFrameOptions(response, pathname))
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow API v1 routes (they use API key authentication)
        if (req.nextUrl.pathname.startsWith('/api/v1/')) {
          return true
        }
        
        // Allow access to public routes without token
        const publicRoutes = ['/auth/signin', '/auth/error', '/']
        if (publicRoutes.includes(req.nextUrl.pathname)) {
          return true
        }
        
        // Require token for all other routes
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/customer/:path*',
    '/dashboard/:path*',
    '/api/:path*',
    '/payment/:path*'
  ]
}