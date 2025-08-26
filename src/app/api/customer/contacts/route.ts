import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/customer/contacts:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: List all contacts
 *     description: Retrieve all contacts for the authenticated customer with pagination and filtering
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
 *         description: Search by name or phone number
 *       - in: query
 *         name: isSubscribed
 *         schema:
 *           type: boolean
 *         description: Filter by subscription status
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *         description: Filter by blocked status
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Filter by group ID
 *     responses:
 *       200:
 *         description: List of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
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
    // Check authentication - session or API key
    const session = await getServerSession(authOptions)
    const apiKey = request.headers.get('x-api-key')
    
    if (!session?.user && !apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    
    // If API key is provided, validate it
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
      
      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: keyData.id },
        data: { lastUsedAt: new Date() }
      })
      
      userId = keyData.userId
    } else {
      userId = session!.user.id
    }

    // Check for impersonation
    const impersonatedCustomerId = request.nextUrl.searchParams.get('impersonatedCustomerId')
    if (impersonatedCustomerId) {
      userId = impersonatedCustomerId
    }

    // Parse query parameters
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
    const search = request.nextUrl.searchParams.get('search') || ''
    const isSubscribed = request.nextUrl.searchParams.get('isSubscribed')
    const isBlocked = request.nextUrl.searchParams.get('isBlocked')
    const groupId = request.nextUrl.searchParams.get('groupId')

    // Build where clause
    const where: any = { userId }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (isSubscribed !== null) {
      where.isSubscribed = isSubscribed === 'true'
    }
    
    if (isBlocked !== null) {
      where.isBlocked = isBlocked === 'true'
    }
    
    if (groupId) {
      where.groups = {
        some: { groupId }
      }
    }

    // Get total count
    const total = await prisma.contact.count({ where })

    // Get paginated data
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        groups: {
          include: {
            group: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/customer/contacts:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Create new contact
 *     description: Create a new contact for the authenticated customer
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
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number with country code
 *                 example: "+917777063244"
 *               name:
 *                 type: string
 *                 description: Contact name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *                 example: "john@example.com"
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
 *                 default: true
 *                 description: Subscription status
 *               isBlocked:
 *                 type: boolean
 *                 default: false
 *                 description: Block status
 *               metadata:
 *                 type: object
 *                 description: Additional custom data
 *     responses:
 *       201:
 *         description: Contact created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Contact already exists
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    const apiKey = request.headers.get('x-api-key')
    
    if (!session?.user && !apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    
    // Validate API key if provided
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
      phoneNumber, 
      name, 
      email, 
      notes, 
      tags = [], 
      isSubscribed = true, 
      isBlocked = false,
      metadata = {}
    } = body

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check subscription limits before allowing contact creation (only for non-API key requests)
    if (!apiKey) {
      try {
        // Get user's current subscription and contact limits using raw SQL for consistency
        const { Pool } = require('pg')
        const { getDatabaseConfig } = require('@/lib/db-config')
        const pool = new Pool(getDatabaseConfig())
        
        const subscriptionResult = await pool.query(`
          SELECT 
            cp.id,
            cp."isActive",
            cp."endDate",
            cp."packageId",
            p.contact_limit,
            CASE 
              WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
              WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
              ELSE 'INACTIVE'
            END as status
          FROM customer_packages cp
          JOIN packages p ON cp."packageId" = p.id
          WHERE cp."userId" = $1::text 
            AND cp."isActive" = true 
            AND cp."endDate" > CURRENT_TIMESTAMP
          ORDER BY cp."createdAt" DESC
          LIMIT 1
        `, [userId])

        if (subscriptionResult.rows.length === 0) {
          return NextResponse.json({ 
            error: 'No active subscription found',
            message: 'Please purchase a subscription plan to add contacts.',
            code: 'NO_SUBSCRIPTION'
          }, { status: 402 })
        }

        const subscription = subscriptionResult.rows[0]
        
        if (subscription.status !== 'ACTIVE') {
          return NextResponse.json({ 
            error: 'Subscription expired',
            message: 'Your subscription has expired. Please renew your plan to continue adding contacts.',
            code: 'SUBSCRIPTION_EXPIRED'
          }, { status: 402 })
        }

        // Count current contacts for this user
        const contactCountResult = await pool.query(`
          SELECT COUNT(*) as count FROM contacts WHERE "userId" = $1::text
        `, [userId])
        
        const currentContacts = parseInt(contactCountResult.rows[0].count) || 0
        const contactLimit = subscription.contact_limit

        if (contactLimit > 0 && currentContacts >= contactLimit) {
          return NextResponse.json({ 
            error: 'Contact limit reached',
            message: `You have reached the maximum limit of ${contactLimit} contacts for your current plan. Please upgrade your subscription to add more contacts.`,
            code: 'CONTACT_LIMIT_EXCEEDED',
            details: {
              currentContacts,
              contactLimit,
              subscriptionPlan: subscription.packageId
            }
          }, { status: 402 })
        }

        console.log(`✅ Contact subscription check passed: ${currentContacts}/${contactLimit} contacts used`)
        
      } catch (subscriptionError) {
        console.error('Error checking contact subscription limits:', subscriptionError)
        return NextResponse.json({ 
          error: 'Unable to verify subscription',
          message: 'Please try again or contact support if the problem persists.',
          code: 'SUBSCRIPTION_CHECK_FAILED'
        }, { status: 500 })
      }
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_phoneNumber: {
          userId,
          phoneNumber
        }
      }
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact already exists' },
        { status: 409 }
      )
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        userId,
        phoneNumber,
        name,
        email,
        notes,
        tags,
        isSubscribed,
        isBlocked,
        metadata
      },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    })

    return NextResponse.json(contact, { status: 201 })

  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier
 *         userId:
 *           type: string
 *           description: User ID who owns this contact
 *         phoneNumber:
 *           type: string
 *           description: Phone number with country code
 *         name:
 *           type: string
 *           description: Contact name
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email
 *         isBlocked:
 *           type: boolean
 *           description: Whether the contact is blocked
 *         isSubscribed:
 *           type: boolean
 *           description: Whether the contact is subscribed
 *         notes:
 *           type: string
 *           description: Additional notes
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorization
 *         metadata:
 *           type: object
 *           description: Additional custom data
 *         groups:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               group:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */