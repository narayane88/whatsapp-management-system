import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/customer/contacts/{id}:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: Get contact by ID
 *     description: Retrieve a specific contact by its ID
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
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
      
      await prisma.apiKey.update({
        where: { id: keyData.id },
        data: { lastUsedAt: new Date() }
      })
      
      userId = keyData.userId
    } else {
      userId = session!.user.id
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        userId
      },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)

  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/customer/contacts/{id}:
 *   put:
 *     tags:
 *       - Contacts
 *     summary: Update contact
 *     description: Update an existing contact
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number with country code
 *               name:
 *                 type: string
 *                 description: Contact name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags for categorization
 *               isSubscribed:
 *                 type: boolean
 *                 description: Subscription status
 *               isBlocked:
 *                 type: boolean
 *                 description: Block status
 *               metadata:
 *                 type: object
 *                 description: Additional custom data
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 *       409:
 *         description: Phone number already exists
 *       500:
 *         description: Internal server error
 */
export async function PUT(
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

    const body = await request.json()
    const { phoneNumber, ...updateData } = body

    // Check if contact exists
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // If phoneNumber is being updated, check for duplicates
    if (phoneNumber && phoneNumber !== existingContact.phoneNumber) {
      const duplicate = await prisma.contact.findUnique({
        where: {
          userId_phoneNumber: {
            userId,
            phoneNumber
          }
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 409 }
        )
      }
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: {
        id: params.id
      },
      data: {
        ...updateData,
        ...(phoneNumber && { phoneNumber })
      },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    })

    return NextResponse.json(contact)

  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/customer/contacts/{id}:
 *   delete:
 *     tags:
 *       - Contacts
 *     summary: Delete contact
 *     description: Delete a contact by its ID
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contact deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
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

    // Check if contact exists
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Delete contact (cascade will handle group memberships)
    await prisma.contact.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({
      message: 'Contact deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}