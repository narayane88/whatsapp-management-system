import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/customer/groups:
 *   get:
 *     tags:
 *       - Groups
 *     summary: List all groups
 *     description: Retrieve all contact groups for the authenticated customer with pagination and filtering
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by group name or description
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContactGroup'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
    const search = request.nextUrl.searchParams.get('search') || ''

    // Build where clause
    const where: any = { userId }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.contactGroup.count({ where })

    // Get paginated data
    const groups = await prisma.contactGroup.findMany({
      where,
      include: {
        _count: {
          select: { contacts: true }
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                isSubscribed: true,
                isBlocked: true
              }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      data: groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/customer/groups:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Create new group
 *     description: Create a new contact group for the authenticated customer
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Group name
 *                 example: "VIP Customers"
 *               description:
 *                 type: string
 *                 description: Group description
 *                 example: "High value customers"
 *               metadata:
 *                 type: object
 *                 description: Additional custom data
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Initial contacts to add to the group
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactGroup'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Group name already exists
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
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
    const { 
      name, 
      description, 
      contactIds = []
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Check if group already exists
    const existingGroup = await prisma.contactGroup.findFirst({
      where: {
        userId,
        name
      }
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Group name already exists' },
        { status: 409 }
      )
    }

    // Validate contacts if provided
    if (contactIds.length > 0) {
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
    }

    // Create group
    const group = await prisma.contactGroup.create({
      data: {
        userId,
        name,
        description,
        contacts: {
          create: contactIds.map((contactId: string) => ({
            contactId
          }))
        }
      },
      include: {
        _count: {
          select: { contacts: true }
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                isSubscribed: true,
                isBlocked: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(group, { status: 201 })

  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactGroup:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier
 *         userId:
 *           type: string
 *           description: User ID who owns this group
 *         name:
 *           type: string
 *           description: Group name
 *         description:
 *           type: string
 *           description: Group description
 *         metadata:
 *           type: object
 *           description: Additional custom data
 *         _count:
 *           type: object
 *           properties:
 *             members:
 *               type: integer
 *               description: Number of contacts in the group
 *         members:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               contact:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   isSubscribed:
 *                     type: boolean
 *                   isBlocked:
 *                     type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */