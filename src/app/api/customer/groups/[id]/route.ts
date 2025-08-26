import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/customer/groups/{id}:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get group by ID
 *     description: Retrieve a specific contact group by its ID
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactGroup'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const apiKey = request.headers.get('x-api-key')
    
    if (!session?.user && !apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    
    if (apiKey) {
      const keyData = await prisma.apiKey.findFirst({
        where: { 
          key: apiKey,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
      
      if (!keyData) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }
      
      await prisma.apiKey.update({
        where: { id: keyData.id },
        data: { lastUsedAt: new Date() }
      })
      
      userId = keyData.userId
    } else {
      userId = session!.user.id
    }

    const group = await prisma.contactGroup.findFirst({
      where: {
        id: id,
        userId
      },
      include: {
        _count: {
          select: { contacts: true }
        },
        contacts: {
          include: {
            contact: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(group)

  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/customer/groups/{id}:
 *   put:
 *     tags:
 *       - Groups
 *     summary: Update group
 *     description: Update an existing contact group
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Group name
 *               description:
 *                 type: string
 *                 description: Group description
 *               metadata:
 *                 type: object
 *                 description: Additional custom data
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactGroup'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       409:
 *         description: Group name already exists
 *       500:
 *         description: Internal server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const apiKey = request.headers.get('x-api-key')
    
    if (!session?.user && !apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    
    if (apiKey) {
      const keyData = await prisma.apiKey.findFirst({
        where: { 
          key: apiKey,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
      
      if (!keyData) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }
      
      userId = keyData.userId
    } else {
      userId = session!.user.id
    }

    const body = await request.json()
    const { name, ...updateData } = body

    // Check if group exists
    const existingGroup = await prisma.contactGroup.findFirst({
      where: {
        id: id,
        userId
      }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingGroup.name) {
      const duplicate = await prisma.contactGroup.findFirst({
        where: {
          userId,
          name
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Group name already exists' },
          { status: 409 }
        )
      }
    }

    // Update group
    const group = await prisma.contactGroup.update({
      where: {
        id: params.id
      },
      data: {
        ...updateData,
        ...(name && { name })
      },
      include: {
        _count: {
          select: { contacts: true }
        },
        contacts: {
          include: {
            contact: true
          }
        }
      }
    })

    return NextResponse.json(group)

  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/customer/groups/{id}:
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Delete group
 *     description: Delete a contact group by its ID
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const apiKey = request.headers.get('x-api-key')
    
    if (!session?.user && !apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    
    if (apiKey) {
      const keyData = await prisma.apiKey.findFirst({
        where: { 
          key: apiKey,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
      
      if (!keyData) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }
      
      userId = keyData.userId
    } else {
      userId = session!.user.id
    }

    // Check if group exists
    const existingGroup = await prisma.contactGroup.findFirst({
      where: {
        id: id,
        userId
      }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Delete group (cascade will handle members)
    await prisma.contactGroup.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({
      message: 'Group deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}