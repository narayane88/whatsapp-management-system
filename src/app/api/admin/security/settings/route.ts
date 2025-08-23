import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/admin/security/settings - Get current security settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('system.settings.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get security settings from database or return defaults
    const result = await pool.query(`
      SELECT setting_key, setting_value, setting_type 
      FROM system_settings 
      WHERE category = 'security'
    `)

    const settings: any = {
      sessionTimeout: 24,
      maxConcurrentSessions: 3,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      passwordExpireDays: 90,
      twoFactorRequired: false,
      ipRestrictionEnabled: false,
      geoRestrictionEnabled: false
    }

    // Override defaults with database values
    result.rows.forEach(row => {
      const key = row.setting_key
      const value = row.setting_value
      const type = row.setting_type

      if (type === 'boolean') {
        settings[key] = value === 'true'
      } else if (type === 'number') {
        settings[key] = parseInt(value)
      } else {
        settings[key] = value
      }
    })

    return NextResponse.json({
      settings
    })
  } catch (error) {
    console.error('Security settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/security/settings - Update security settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('system.settings.update'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ error: 'Settings data is required' }, { status: 400 })
    }

    // Ensure system_settings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type VARCHAR(20) DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, setting_key)
      )
    `)

    // Start transaction
    await pool.query('BEGIN')

    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const settingType = typeof value === 'boolean' ? 'boolean' : 
                           typeof value === 'number' ? 'number' : 'string'
        
        await pool.query(`
          INSERT INTO system_settings (category, setting_key, setting_value, setting_type)
          VALUES ('security', $1, $2, $3)
          ON CONFLICT (category, setting_key)
          DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            updated_at = CURRENT_TIMESTAMP
        `, [key, value.toString(), settingType])
      }

      // Log the security settings change
      await pool.query(`
        INSERT INTO security_events (event_type, user_email, ip_address, severity, details, created_at)
        VALUES ('security_settings_updated', $1, $2, 'medium', 'Security settings were modified', NOW())
      `, [
        session.user.email,
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown'
      ])

      await pool.query('COMMIT')

      return NextResponse.json({
        message: 'Security settings updated successfully'
      })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Security settings PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}