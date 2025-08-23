import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test endpoint without auth to check if transactions can be fetched
    console.log('Testing transactions endpoint...')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    const skip = (page - 1) * limit
    
    const where: Record<string, unknown> = {}
    if (status) where.status = status.toUpperCase()
    if (type) where.type = type.toUpperCase()

    console.log('Query conditions:', where)

    // Try to get some sample data with simpler queries
    const sampleTransactions = await prisma.$queryRaw`
      SELECT 
        t.id, t."userId", t.type::text, t.method::text, t.amount, t.currency, t.status::text, t.description, t.reference, t."createdAt"
      FROM transactions t
      ORDER BY t."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `

    // Get user data separately
    const users = await prisma.$queryRaw`SELECT id, name, email FROM users LIMIT 10`
    
    const totalCountResult = await prisma.$queryRaw`SELECT COUNT(*)::integer as count FROM transactions`
    const totalCount = totalCountResult[0]?.count || 0

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      database_stats: {
        total_transactions: totalCount,
        total_users: users.length
      },
      transactions: sampleTransactions,
      users: users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ 
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}