import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user level and ID for filtering
    const currentUserResult = await prisma.$queryRaw`
      SELECT u.id as user_id, u.email, r.level, r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = LOWER(${session.user.email}) AND ur.is_primary = true
      LIMIT 1
    `

    if (!Array.isArray(currentUserResult) || currentUserResult.length === 0) {
      return NextResponse.json({ error: 'Current user role not found' }, { status: 404 })
    }

    const currentUserId = currentUserResult[0].user_id
    const currentUserLevel = currentUserResult[0].level

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const createdBy = searchParams.get('createdBy')
    const skip = (page - 1) * limit

    // Apply level-based filtering for level 3+ users (SUBDEALER and below)
    let levelFilterQuery = ''
    if (currentUserLevel >= 3) {
      levelFilterQuery = `AND t."createdBy" = ${currentUserId}`
    }

    // Get transactions with creator information using separate queries
    let transactions
    let totalResult
    
    if (createdBy) {
      // Filter by specific creator (only users with Level 4 and below roles) + level filtering
      const createdByFilter = currentUserLevel >= 3 ? currentUserId : parseInt(createdBy)
      transactions = await prisma.$queryRaw`
        SELECT 
          t.id, t."userId", t."createdBy", t.type::text, t.method::text, t.amount, t.currency, 
          t.status::text, t.description, t.reference, t."createdAt", t."updatedAt",
          u.name as user_name, u.email as user_email,
          c.name as creator_name, c.email as creator_email, cr.name as creator_role
        FROM transactions t
        LEFT JOIN users u ON (
          CASE 
            WHEN t."userId" ~ '^[0-9]+$' THEN u.id = CAST(t."userId" AS INTEGER)
            ELSE CAST(u.id AS TEXT) = t."userId"
          END
        )
        LEFT JOIN users c ON t."createdBy" = c.id
        LEFT JOIN user_roles cur ON c.id = cur.user_id
        LEFT JOIN roles cr ON cur.role_id = cr.id
        WHERE t."createdBy" = ${createdByFilter} 
          AND cr.name IN ('OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE')
        ORDER BY t."createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `
      
      totalResult = await prisma.$queryRaw`
        SELECT COUNT(*)::integer as count FROM transactions t
        LEFT JOIN user_roles ur ON t."createdBy" = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE t."createdBy" = ${createdByFilter} 
          AND r.name IN ('OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE')
      `
    } else {
      // Get transactions based on user level (Level 3+ see only their own transactions)
      if (currentUserLevel >= 3) {
        transactions = await prisma.$queryRaw`
          SELECT 
            t.id, t."userId", t."createdBy", t.type::text, t.method::text, t.amount, t.currency, 
            t.status::text, t.description, t.reference, t."createdAt", t."updatedAt",
            u.name as user_name, u.email as user_email,
            c.name as creator_name, c.email as creator_email, cr.name as creator_role
          FROM transactions t
          LEFT JOIN users u ON (
            CASE 
              WHEN t."userId" ~ '^[0-9]+$' THEN u.id = CAST(t."userId" AS INTEGER)
              ELSE CAST(u.id AS TEXT) = t."userId"
            END
          )
          LEFT JOIN users c ON t."createdBy" = c.id
          LEFT JOIN user_roles cur ON c.id = cur.user_id
          LEFT JOIN roles cr ON cur.role_id = cr.id
          WHERE t."createdBy" = ${currentUserId}
          ORDER BY t."createdAt" DESC
          LIMIT ${limit} OFFSET ${skip}
        `
        
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*)::integer as count FROM transactions
          WHERE "createdBy" = ${currentUserId}
        `
      } else {
        // Level 1-2 users see all transactions
        transactions = await prisma.$queryRaw`
          SELECT 
            t.id, t."userId", t."createdBy", t.type::text, t.method::text, t.amount, t.currency, 
            t.status::text, t.description, t.reference, t."createdAt", t."updatedAt",
            u.name as user_name, u.email as user_email,
            c.name as creator_name, c.email as creator_email, cr.name as creator_role
          FROM transactions t
          LEFT JOIN users u ON (
            CASE 
              WHEN t."userId" ~ '^[0-9]+$' THEN u.id = CAST(t."userId" AS INTEGER)
              ELSE CAST(u.id AS TEXT) = t."userId"
            END
          )
          LEFT JOIN users c ON t."createdBy" = c.id
          LEFT JOIN user_roles cur ON c.id = cur.user_id
          LEFT JOIN roles cr ON cur.role_id = cr.id
          ORDER BY t."createdAt" DESC
          LIMIT ${limit} OFFSET ${skip}
        `
        
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*)::integer as count FROM transactions
        `
      }
    }
    const total = totalResult[0]?.count || 0
    
    // Transform the data to match expected format - show actual creator names
    const formattedTransactions = transactions.map((txn: any) => ({
      id: txn.id,
      userId: txn.userId,
      createdBy: txn.createdBy,
      type: txn.type,
      method: txn.method,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.status,
      reference: txn.reference,
      description: txn.description,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
      user: {
        name: txn.user_name || 'Unknown User',
        email: txn.user_email || 'unknown@example.com'
      },
      creator: {
        name: txn.creator_name || 'System',
        email: txn.creator_email || 'system@example.com'
      }
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Transaction API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for internal webhook request
    const isInternalRequest = request.headers.get('X-Internal-Request') === 'webhook'
    
    if (!isInternalRequest) {
      // Regular authentication for non-webhook requests
      const session = await getServerSession(authOptions)
      
      if (!session || !['OWNER', 'SUBDEALER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { userId, type, method, amount, currency = 'INR', description, reference, status = 'PENDING', gatewayData } = body

    // Validate required fields
    if (!userId || !type || !method || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Validate enum values
    const validTypes = ['RECHARGE', 'PURCHASE', 'REFUND', 'COMMISSION']
    const validMethods = ['CASH', 'BANK', 'UPI', 'RAZORPAY', 'GATEWAY', 'WALLET', 'CREDIT', 'BIZPOINTS']
    
    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }
    
    if (!validMethods.includes(method.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Create transaction using raw SQL due to schema mismatch
    const transactionId = `cm${Date.now()}${Math.random().toString(36).substring(2, 9)}`
    const validStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']
    const finalStatus = validStatuses.includes(status.toUpperCase()) ? status.toUpperCase() : 'PENDING'
    
    await prisma.$queryRaw`
      INSERT INTO transactions (id, "userId", "createdBy", type, method, amount, currency, status, description, reference, "gatewayData", "createdAt", "updatedAt")
      VALUES (${transactionId}, ${userId}, 1, ${type.toUpperCase()}::"TransactionType", ${method.toUpperCase()}::"PaymentMethod", ${parseFloat(amount.toString())}, ${currency}, ${finalStatus}::"TransactionStatus", ${description || null}, ${reference || null}, ${gatewayData ? JSON.stringify(gatewayData) : null}, NOW(), NOW())
    `
    
    // Fetch the created transaction with user info
    const transaction = await prisma.$queryRaw`
      SELECT 
        t.id, t."userId", t."createdBy", t.type::text, t.method::text, t.amount, t.currency, 
        t.status::text, t.description, t.reference, t."createdAt", t."updatedAt",
        u.name as user_name, u.email as user_email
      FROM transactions t
      LEFT JOIN users u ON t."userId" = CAST(u.id AS TEXT)
      WHERE t.id = ${transactionId}
    `

    return NextResponse.json({ 
      transaction: {
        id: transaction[0].id,
        userId: transaction[0].userId,
        createdBy: transaction[0].createdBy,
        type: transaction[0].type,
        method: transaction[0].method,
        amount: transaction[0].amount,
        currency: transaction[0].currency,
        status: transaction[0].status,
        description: transaction[0].description,
        reference: transaction[0].reference,
        createdAt: transaction[0].createdAt,
        updatedAt: transaction[0].updatedAt,
        user: {
          name: transaction[0].user_name,
          email: transaction[0].user_email
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Transaction creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // const session = await getServerSession(authOptions)
    
    // if (!session || !['OWNER', 'SUBDEALER'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    // Extract transaction ID from URL query parameters
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    // Check if transaction exists
    const existingTransaction = await prisma.$queryRaw`
      SELECT id FROM transactions WHERE id = ${transactionId}
    `

    if (!existingTransaction.length) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Delete transaction
    await prisma.$queryRaw`
      DELETE FROM transactions WHERE id = ${transactionId}
    `

    return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Transaction deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // const session = await getServerSession(authOptions)
    
    // if (!session || !['OWNER', 'SUBDEALER'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    // Extract transaction ID from URL query parameters
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { userId, type, method, amount, currency = 'USD', description, reference, status } = body

    // Validate required fields
    if (!userId || !type || !method || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Validate enum values
    const validTypes = ['RECHARGE', 'PURCHASE', 'REFUND', 'COMMISSION']
    const validMethods = ['CASH', 'BANK', 'UPI', 'GATEWAY', 'WALLET', 'CREDIT']
    const validStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']
    
    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }
    
    if (!validMethods.includes(method.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    if (status && !validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid transaction status' }, { status: 400 })
    }

    // Check if transaction exists
    const existingTransaction = await prisma.$queryRaw`
      SELECT id FROM transactions WHERE id = ${transactionId}
    `

    if (!existingTransaction.length) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Update transaction using raw SQL
    await prisma.$queryRaw`
      UPDATE transactions 
      SET "userId" = ${userId}, 
          type = ${type.toUpperCase()}::"TransactionType", 
          method = ${method.toUpperCase()}::"PaymentMethod", 
          amount = ${parseFloat(amount.toString())}, 
          currency = ${currency}, 
          status = ${status?.toUpperCase() || 'PENDING'}::"TransactionStatus", 
          description = ${description || null}, 
          reference = ${reference || null}, 
          "updatedAt" = NOW()
      WHERE id = ${transactionId}
    `

    // Auto-activate subscription and process commissions if transaction status changed to SUCCESS
    const transactionStatus = status?.toUpperCase() || 'PENDING'
    if (transactionStatus === 'SUCCESS') {
      // Activate related subscription if applicable
      if (reference && reference.startsWith('cs')) {
        console.log(`🔄 Transaction ${transactionId} marked as SUCCESS, activating subscription ${reference}`)
        
        await prisma.$queryRaw`
          UPDATE customer_packages 
          SET "isActive" = true, 
              "updatedAt" = NOW()
          WHERE id = ${reference}
        `
        
        console.log(`✅ Subscription ${reference} activated successfully`)
      }
      
      // Process commission distribution if customer made payment
      try {
        const userDetails = await prisma.$queryRaw`
          SELECT u.id, u."parentId" as parent_id, r.level, r.name as role_name
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.id = ${userId}
        `
        
        if (userDetails.length > 0) {
          const user = userDetails[0]
          
          // Process commission if user is a customer (level 5) and has a parent dealer
          if (user.role_name === 'CUSTOMER' && user.parent_id) {
            console.log(`💰 Processing commission for customer payment: ₹${amount}`)
            
            // Call commission processing function directly
            const commissionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/bizpoints/commission`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customerId: user.id,
                transactionAmount: parseFloat(amount.toString()),
                transactionReference: transactionId
              }),
            })
            
            if (commissionResponse.ok) {
              const commissionData = await commissionResponse.json()
              console.log(`✅ Commission processed: ${commissionData.commissionsProcessed} dealers rewarded`)
            } else {
              console.error('❌ Commission processing failed')
            }
          }
        }
      } catch (error) {
        console.error('Commission processing error:', error)
        // Don't fail the main transaction if commission processing fails
      }
    }
    
    // Fetch the updated transaction with user info
    const transaction = await prisma.$queryRaw`
      SELECT 
        t.id, t."userId", t."createdBy", t.type::text, t.method::text, t.amount, t.currency, 
        t.status::text, t.description, t.reference, t."createdAt", t."updatedAt",
        u.name as user_name, u.email as user_email,
        c.name as creator_name, c.email as creator_email
      FROM transactions t
      LEFT JOIN users u ON t."userId" = CAST(u.id AS TEXT)
      LEFT JOIN users c ON t."createdBy" = c.id
      WHERE t.id = ${transactionId}
    `

    return NextResponse.json({ 
      transaction: {
        id: transaction[0].id,
        userId: transaction[0].userId,
        createdBy: transaction[0].createdBy,
        type: transaction[0].type,
        method: transaction[0].method,
        amount: transaction[0].amount,
        currency: transaction[0].currency,
        status: transaction[0].status,
        description: transaction[0].description,
        reference: transaction[0].reference,
        createdAt: transaction[0].createdAt,
        updatedAt: transaction[0].updatedAt,
        user: {
          name: transaction[0].user_name,
          email: transaction[0].user_email
        },
        creator: {
          name: transaction[0].creator_name || 'System',
          email: transaction[0].creator_email || 'system@example.com'
        }
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Transaction update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}