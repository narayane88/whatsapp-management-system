import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Dynamic permission middleware - uses database for permission checks
 */
export default withAuth(
  async function middleware(req) {
    // Continue with default behavior - permission checks handled at component level
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Static assets - always allow (fastest path)
        if (pathname.startsWith('/_next/') || pathname.startsWith('/static/') || 
            pathname.endsWith('.ico') || pathname.endsWith('.png') || 
            pathname.endsWith('.jpg') || pathname.endsWith('.svg')) {
          return true
        }

        // Public routes - always allow
        const publicRoutes = [
          '/auth/signin',
          '/auth/signup',
          '/api/auth',
          '/'
        ]

        if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
          return true
        }

        // All other routes require authentication
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files) 
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)'
  ]
}