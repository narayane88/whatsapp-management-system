import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/customer/groups/{id}/members:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Add contacts to group
 *     description: Add multiple contacts to a group
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
 *             required:
 *               - contactIds
 *             properties:
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of contact IDs to add
 *                 example: ["contact1", "contact2"]
 *     responses:
 *       200:
 *         description: Contacts added to group successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contacts added to group successfully
 *                 added:
 *                   type: integer
 *                   description: Number of contacts added
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const group = await prisma.contactGroup.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { contactIds } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Contact IDs array is required' },
        { status: 400 }
      )
    }

    // Validate contacts exist and belong to the user
    const validContacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        userId
      },
      select: { id: true }
    })

    if (validContacts.length !== contactIds.length) {
      return NextResponse.json(
        { error: 'Some contacts do not exist or do not belong to you' },
        { status: 400 }
      )
    }

    // Get existing memberships to avoid duplicates
    const existingMembers = await prisma.contactGroupMember.findMany({
      where: {
        groupId: params.id,
        contactId: { in: contactIds }
      },
      select: { contactId: true }
    })

    const existingContactIds = existingMembers.map(m => m.contactId)
    const newContactIds = contactIds.filter(id => !existingContactIds.includes(id))

    if (newContactIds.length === 0) {
      return NextResponse.json({
        message: 'All contacts are already in the group',
        added: 0
      })
    }

    // Add new members
    await prisma.contactGroupMember.createMany({
      data: newContactIds.map(contactId => ({
        groupId: params.id,
        contactId
      }))
    })

    return NextResponse.json({
      message: 'Contacts added to group successfully',
      added: newContactIds.length
    })

  } catch (error) {
    console.error('Error adding contacts to group:', error)
    return NextResponse.json(
      { error: 'Failed to add contacts to group' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/customer/groups/{id}/members:
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Remove contacts from group
 *     description: Remove multiple contacts from a group
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
 *             required:
 *               - contactIds
 *             properties:
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of contact IDs to remove
 *                 example: ["contact1", "contact2"]
 *     responses:
 *       200:
 *         description: Contacts removed from group successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contacts removed from group successfully
 *                 removed:
 *                   type: integer
 *                   description: Number of contacts removed
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const group = await prisma.contactGroup.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { contactIds } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Contact IDs array is required' },
        { status: 400 }
      )
    }

    // Remove members
    const result = await prisma.contactGroupMember.deleteMany({
      where: {
        groupId: params.id,
        contactId: { in: contactIds }
      }
    })

    return NextResponse.json({
      message: 'Contacts removed from group successfully',
      removed: result.count
    })

  } catch (error) {
    console.error('Error removing contacts from group:', error)
    return NextResponse.json(
      { error: 'Failed to remove contacts from group' },
      { status: 500 }
    )
  }
}