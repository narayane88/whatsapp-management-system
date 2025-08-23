import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get only active packages for public display
    const packages = await prisma.package.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        offer_price: true,
        offer_enabled: true,
        duration: true,
        messageLimit: true,
        instanceLimit: true,
        mobile_accounts_limit: true,
        contact_limit: true,
        api_key_limit: true,
        receive_msg_limit: true,
        webhook_limit: true,
        package_color: true,
        features: true,
        createdAt: true
      },
      orderBy: [
        { price: 'asc' } // Show packages in price order
      ]
    })

    // Transform packages to include popular flag and feature list
    const transformedPackages = packages.map((pkg, index) => ({
      ...pkg,
      offer_price: pkg.offer_price ? Number(pkg.offer_price) : null,
      popular: index === 1, // Mark the middle package as popular
      features: pkg.features ? (
        Array.isArray(pkg.features) ? pkg.features : Object.values(pkg.features as any)
      ) : [
        `${pkg.messageLimit.toLocaleString()} messages per month`,
        `${pkg.instanceLimit} WhatsApp instances`,
        `${pkg.contact_limit?.toLocaleString() || '10,000'} contacts storage`,
        'Advanced automation',
        'Analytics dashboard',
        'Email support'
      ]
    }))

    return NextResponse.json({
      success: true,
      packages: transformedPackages
    })
  } catch (error) {
    console.error('Error fetching public packages:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch packages',
      packages: []
    }, { status: 500 })
  }
}