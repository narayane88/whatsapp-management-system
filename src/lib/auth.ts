import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { getDatabaseConfig } from './db-config'

// PostgreSQL connection with environment-based SSL configuration
const pool = new Pool(getDatabaseConfig())

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 NextAuth authorize called with email:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          console.log('🔍 Testing database connection...')
          // Test database connection first
          await pool.query('SELECT 1')
          console.log('✅ Database connection successful')
          
          console.log('🔍 Looking up user:', credentials.email)
          // Find user in database with proper role join
          const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.password, u."isActive", u."parentId", 
                   r.name as role
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.email = $1 AND u."isActive" = true
            LIMIT 1
          `, [credentials.email])

          if (result.rows.length === 0) {
            console.log('❌ User not found or inactive:', credentials.email)
            return null
          }

          const user = result.rows[0]
          console.log('✅ User found:', { id: user.id, email: user.email, role: user.role })

          // Verify password
          console.log('🔍 Verifying password...')
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          if (!isValidPassword) {
            console.log('❌ Invalid password for:', credentials.email)
            return null
          }

          console.log('✅ Password verified, updating last login...')
          // Update last login time
          await pool.query(`
            UPDATE users SET last_login = NOW() WHERE id = $1
          `, [user.id])

          const authUser = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            parentId: user.parentId?.toString() || undefined,
          }
          
          console.log('✅ Authentication successful for:', authUser.email, 'Role:', authUser.role)
          return authUser
        } catch (error: any) {
          console.error('🚨 NextAuth authorize error:', {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            stack: error?.stack
          })
          
          // Return null but don't throw - this prevents the HTML error page
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.role = user.role
          token.parentId = user.parentId
        }
        return token
      } catch (error: any) {
        console.error('🚨 NextAuth JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.sub!
          session.user.role = token.role as string
          session.user.parentId = token.parentId as string
        }
        return session
      } catch (error: any) {
        console.error('🚨 NextAuth session callback error:', error)
        return session
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin?error=AuthenticationError',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {

    },
    warn(code) {

    },
  },
}

// Helper functions for role-based access
export const hasPermission = (userRole: string, requiredRoles: string[]) => {
  if (!userRole || !requiredRoles || !Array.isArray(requiredRoles)) {
    return false
  }
  return requiredRoles.includes(userRole)
}

export const isOwner = (userRole: string) => userRole === 'OWNER'
export const isSubDealer = (userRole: string) => userRole === 'SUBDEALER'
export const isEmployee = (userRole: string) => userRole === 'EMPLOYEE'
export const isCustomer = (userRole: string) => userRole === 'CUSTOMER'

export const canManageUsers = (userRole: string) => {
  return hasPermission(userRole, ['OWNER', 'SUBDEALER'])
}

export const canViewFinancials = (userRole: string) => {
  return hasPermission(userRole, ['OWNER', 'SUBDEALER'])
}

export const canManagePackages = (userRole: string) => {
  return hasPermission(userRole, ['OWNER'])
}

export const canProcessPayouts = (userRole: string) => {
  return hasPermission(userRole, ['OWNER'])
}