import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/customer/contacts/{id}/block:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Block contact
 *     description: Block a contact from receiving messages
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
 *         description: Contact blocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contact blocked successfully
 *                 contact:
 *                   $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
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
      
      await prisma.apiKey.update({
        where: { id: keyData.id },
        data: { lastUsedAt: new Date() }
      })
      
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

    // Update block status
    const contact = await prisma.contact.update({
      where: {
        id: params.id
      },
      data: {
        isBlocked: true,
        updatedAt: new Date()
      },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Contact blocked successfully',
      contact
    })

  } catch (error) {
    console.error('Error blocking contact:', error)
    return NextResponse.json(
      { error: 'Failed to block contact' },
      { status: 500 }
    )
  }
}