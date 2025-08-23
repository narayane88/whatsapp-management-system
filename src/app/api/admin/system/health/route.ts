import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['OWNER', 'SUBDEALER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Test database connection and get statistics
    const [
      dbTest,
      userCount,
      instanceCount,
      messageCount,
      transactionCount
    ] = await Promise.all([
      prisma.$queryRaw`SELECT 1 as test`,
      prisma.user.count(),
      prisma.whatsAppInstance.count(),
      prisma.message.count(),
      prisma.transaction.count()
    ])

    // Get system metrics
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        test: dbTest ? 'passed' : 'failed'
      },
      statistics: {
        users: userCount,
        instances: instanceCount,
        messages: messageCount,
        transactions: transactionCount
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    }

    return NextResponse.json(systemHealth)
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}