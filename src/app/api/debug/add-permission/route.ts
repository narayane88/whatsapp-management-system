import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function POST(request: Request) {
  try {
    const { roleName, permissionName } = await request.json()

    console.log(`🔧 DEBUG: Adding permission "${permissionName}" to role "${roleName}"`)

    // Get role ID
    const roleResult = await pool.query(`
      SELECT id, name FROM roles WHERE name = $1
    `, [roleName])

    if (roleResult.rows.length === 0) {
      return NextResponse.json({ error: `Role "${roleName}" not found` }, { status: 404 })
    }

    const roleId = roleResult.rows[0].id

    // Get permission ID
    const permissionResult = await pool.query(`
      SELECT id, name FROM permissions WHERE name = $1
    `, [permissionName])

    if (permissionResult.rows.length === 0) {
      return NextResponse.json({ error: `Permission "${permissionName}" not found` }, { status: 404 })
    }

    const permissionId = permissionResult.rows[0].id

    // Check if role-permission mapping already exists
    const existingResult = await pool.query(`
      SELECT * FROM role_permissions WHERE role_id = $1 AND permission_id = $2
    `, [roleId, permissionId])

    if (existingResult.rows.length > 0) {
      // Update existing mapping
      await pool.query(`
        UPDATE role_permissions 
        SET granted = true, updated_at = CURRENT_TIMESTAMP
        WHERE role_id = $1 AND permission_id = $2
      `, [roleId, permissionId])

      console.log(`✅ Updated existing permission mapping: ${roleName} -> ${permissionName}`)
    } else {
      // Insert new role-permission mapping
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id, granted)
        VALUES ($1, $2, true)
      `, [roleId, permissionId])

      console.log(`✅ Added new permission mapping: ${roleName} -> ${permissionName}`)
    }

    // Verify the permission was added
    const verifyResult = await pool.query(`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        rp.granted
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.id = $1 AND p.id = $2
    `, [roleId, permissionId])

    return NextResponse.json({
      message: `Permission "${permissionName}" successfully added to role "${roleName}"`,
      mapping: verifyResult.rows[0],
      debug: {
        roleId,
        permissionId,
        wasUpdate: existingResult.rows.length > 0
      }
    })

  } catch (error) {
    console.error('❌ Add permission error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}