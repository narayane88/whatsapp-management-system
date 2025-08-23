import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    
    try {
      // Get user permissions from roles and direct assignments
      const result = await client.query(`
        SELECT DISTINCT p.name, p.description, p.category
        FROM permissions p
        WHERE p.is_system = true
        AND (
          -- Via role permissions
          EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            WHERE LOWER(u.email) = LOWER($1)
            AND rp.permission_id = p.id
            AND rp.granted = true
            AND u."isActive" = true
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          )
          OR
          -- Via direct user permissions
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
        ORDER BY p.category, p.name
      `, [session.user.email])

      return NextResponse.json({
        permissions: result.rows,
        count: result.rows.length
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' }, 
      { status: 500 }
    )
  }
}