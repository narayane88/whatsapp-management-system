import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

/**
 * @swagger
 * /api/customer/api-keys/{keyId}:
 *   delete:
 *     tags:
 *       - Customer API Keys
 *     summary: Delete API key
 *     description: Delete a specific API key for the authenticated customer
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The API key ID to delete
 *     responses:
 *       200:
 *         description: API key deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "API key deleted successfully"
 *                 deletedKey:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *       404:
 *         description: API key not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - Customer API Keys
 *     summary: Update API key
 *     description: Update an existing API key (name, permissions, etc.)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The API key ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the API key
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated permissions array
 *               isActive:
 *                 type: boolean
 *                 description: Whether the key should be active
 *     responses:
 *       200:
 *         description: API key updated successfully
 *       404:
 *         description: API key not found
 *       403:
 *         description: Access denied
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const resolvedParams = await params
    const keyId = resolvedParams.keyId

    if (!keyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user deleting API key for customer ID: ${userId}`)
    }

    // Check if the API key exists and belongs to this user
    const keyResult = await pool.query(`
      SELECT id, name, key 
      FROM api_keys 
      WHERE id = $1 AND "userId" = $2
    `, [keyId, userId])

    if (keyResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'API key not found or access denied' 
      }, { status: 404 })
    }

    const apiKey = keyResult.rows[0]

    // Delete the API key
    await pool.query('DELETE FROM api_keys WHERE id = $1', [keyId])

    // Log the deletion
    try {
      await pool.query(`
        INSERT INTO audit_logs (
          id, "userId", action, details, "createdAt"
        )
        VALUES (gen_random_uuid(), $1, 'DELETE_API_KEY', $2, CURRENT_TIMESTAMP)
      `, [
        userId,
        JSON.stringify({
          deletedKeyId: keyId,
          deletedKeyName: apiKey.name
        })
      ])
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError)
      // Continue without audit log - don't fail the deletion
    }

    return NextResponse.json({
      message: 'API key deleted successfully',
      deletedKey: {
        id: apiKey.id,
        name: apiKey.name
      }
    })

  } catch (error) {
    console.error('API Key DELETE Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const resolvedParams = await params
    const keyId = resolvedParams.keyId
    const body = await request.json()
    const { name, permissions, isActive } = body

    if (!keyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user updating API key for customer ID: ${userId}`)
    }

    // Check if the API key exists and belongs to this user
    const keyResult = await pool.query(`
      SELECT id, name, permissions, "isActive"
      FROM api_keys 
      WHERE id = $1 AND "userId" = $2
    `, [keyId, userId])

    if (keyResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'API key not found or access denied' 
      }, { status: 404 })
    }

    const currentKey = keyResult.rows[0]

    // Prepare update values (only update provided fields)
    const updatedName = name !== undefined ? name : currentKey.name
    const updatedPermissions = permissions !== undefined ? JSON.stringify(permissions) : currentKey.permissions
    const updatedIsActive = isActive !== undefined ? isActive : currentKey.isActive

    // Update the API key
    const updateResult = await pool.query(`
      UPDATE api_keys 
      SET name = $1, permissions = $2, "isActive" = $3, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $4 AND "userId" = $5
      RETURNING id, name, permissions, "isActive", "updatedAt"
    `, [updatedName, updatedPermissions, updatedIsActive, keyId, userId])

    const updatedKey = updateResult.rows[0]

    return NextResponse.json({
      message: 'API key updated successfully',
      key: {
        id: updatedKey.id,
        name: updatedKey.name,
        permissions: typeof updatedKey.permissions === 'string' 
          ? JSON.parse(updatedKey.permissions) 
          : updatedKey.permissions,
        isActive: updatedKey.isActive,
        updatedAt: updatedKey.updatedAt
      }
    })

  } catch (error) {
    console.error('API Key PUT Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}