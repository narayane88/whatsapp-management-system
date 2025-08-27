import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'

const pool = new Pool(getDatabaseConfig())

// POST /api/customer/packages/purchase-with-bizcoins - Purchase package using only bizcoins
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { packageId, bizcoinAmount, customerId, customerEmail } = body

    if (!packageId || !bizcoinAmount || bizcoinAmount <= 0) {
      return NextResponse.json({ 
        error: 'Package ID and bizcoin amount are required' 
      }, { status: 400 })
    }

    // Start transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // 1. Get user information and current bizcoin balance
      const userResult = await client.query(`
        SELECT 
          u.id, 
          u.email, 
          u.name,
          COALESCE(u.biz_points, 0) as biz_points
        FROM users u
        WHERE LOWER(u.email) = LOWER($1)
      `, [session.user.email])

      if (userResult.rows.length === 0) {
        await client.query('COMMIT')
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const user = userResult.rows[0]
      const currentBizBalance = parseFloat(user.biz_points)

      // 2. Validate bizcoin balance
      if (currentBizBalance < bizcoinAmount) {
        await client.query('COMMIT')
        return NextResponse.json({ 
          error: 'Insufficient bizcoin balance',
          available: currentBizBalance,
          required: bizcoinAmount
        }, { status: 400 })
      }

      // 3. Get package details
      const packageResult = await client.query(`
        SELECT * FROM packages WHERE id = $1 AND "isActive" = true
      `, [packageId])

      if (packageResult.rows.length === 0) {
        await client.query('COMMIT')
        return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
      }

      const pkg = packageResult.rows[0]
      const packagePrice = pkg.offer_enabled && pkg.offer_price ? pkg.offer_price : pkg.price

      // 4. Validate bizcoin amount covers package price
      if (bizcoinAmount < packagePrice) {
        await client.query('COMMIT')
        return NextResponse.json({ 
          error: 'Insufficient bizcoins for this package',
          packagePrice,
          bizcoinAmount
        }, { status: 400 })
      }

      // 5. Check for existing active subscription that might conflict
      const activeSubscriptionResult = await client.query(`
        SELECT id FROM customer_packages 
        WHERE "userId" = $1::text 
          AND "isActive" = true 
          AND "endDate" > CURRENT_TIMESTAMP
      `, [user.id])

      // 6. Deduct bizcoins from user balance
      const newBizBalance = currentBizBalance - bizcoinAmount
      await client.query(`
        UPDATE users 
        SET biz_points = $1
        WHERE id = $2
      `, [newBizBalance, user.id])

      // 7. Record bizcoin transaction
      await client.query(`
        INSERT INTO bizpoints_transactions (
          user_id, type, amount, balance, description, reference
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        user.id,
        'DEBIT',
        -bizcoinAmount,
        newBizBalance,
        `Package purchase: ${pkg.name}`,
        `PACKAGE_${packageId}_${Date.now()}`
      ])

      // 8. Create subscription
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + pkg.duration)

      const subscriptionResult = await client.query(`
        INSERT INTO customer_packages (
          "userId", "packageId", "createdBy", "paymentMethod",
          "startDate", "endDate", "isActive", "messagesUsed",
          "createdAt", "updatedAt", status, "purchaseType"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        user.id.toString(),
        pkg.id,
        user.id,
        'BIZCOIN',
        startDate,
        endDate,
        true,
        0,
        new Date(),
        new Date(),
        'ACTIVE',
        'bizcoin_purchase'
      ])

      const subscriptionId = subscriptionResult.rows[0].id

      // 9. If there was an existing active subscription, mark it as replaced
      if (activeSubscriptionResult.rows.length > 0) {
        await client.query(`
          UPDATE customer_packages 
          SET "isActive" = false,
              status = 'REPLACED',
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [activeSubscriptionResult.rows[0].id])
      }

      // 10. Create transaction record
      await client.query(`
        INSERT INTO transactions (
          "userId", "packageId", amount, currency, status, 
          "paymentMethod", "createdAt", "updatedAt", type, method
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        parseInt(user.id),
        pkg.id,
        bizcoinAmount,
        'INR',
        'SUCCESS',
        'BIZCOIN',
        new Date(),
        new Date(),
        'SUBSCRIPTION',
        'bizcoin'
      ])

      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: 'Package purchased successfully with bizcoins',
        subscription: {
          id: subscriptionId,
          packageId: pkg.id,
          packageName: pkg.name,
          duration: pkg.duration,
          startDate,
          endDate,
          isActive: true
        },
        payment: {
          bizcoinUsed: bizcoinAmount,
          previousBalance: currentBizBalance,
          newBalance: newBizBalance,
          method: 'BIZCOIN'
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Bizcoin package purchase error:', error)
    return NextResponse.json({ 
      error: 'Failed to purchase package with bizcoins',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/customer/packages/purchase-with-bizcoins - Get user's bizcoin purchase history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's bizcoin package purchase history
    const historyResult = await pool.query(`
      SELECT 
        cp.id as subscription_id,
        cp."createdAt" as purchase_date,
        cp."startDate",
        cp."endDate",
        cp."isActive",
        cp.status,
        p.name as package_name,
        p.price as package_price,
        p.duration,
        t.amount as bizcoin_amount,
        t.status as transaction_status
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      LEFT JOIN transactions t ON t."userId" = cp."userId"::integer 
        AND t."packageId" = p.id 
        AND t."paymentMethod" = 'BIZCOIN'
        AND t."createdAt" = cp."createdAt"
      JOIN users u ON cp."userId" = u.id::text
      WHERE LOWER(u.email) = LOWER($1)
        AND cp."paymentMethod" = 'BIZCOIN'
      ORDER BY cp."createdAt" DESC
    `, [session.user.email])

    return NextResponse.json({
      success: true,
      purchaseHistory: historyResult.rows,
      totalPurchases: historyResult.rows.length
    })

  } catch (error) {
    console.error('Get bizcoin purchase history error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch purchase history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}