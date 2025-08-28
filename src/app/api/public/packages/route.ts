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
    const transformedPackages = packages.map((pkg, index) => {
      let processedFeatures = []
      
      if (pkg.features) {
        if (typeof pkg.features === 'string') {
          // If it's a JSON string, parse it
          try {
            const parsed = JSON.parse(pkg.features)
            if (Array.isArray(parsed)) {
              processedFeatures = parsed.filter(f => typeof f === 'string' && f.trim().length > 0)
            } else if (typeof parsed === 'object') {
              processedFeatures = Object.values(parsed).filter(f => typeof f === 'string' && f.trim().length > 0)
            }
          } catch (e) {
            // If parsing fails, treat as single feature
            processedFeatures = [pkg.features]
          }
        } else if (Array.isArray(pkg.features)) {
          processedFeatures = pkg.features.filter(f => typeof f === 'string' && f.trim().length > 0)
        } else if (typeof pkg.features === 'object') {
          processedFeatures = Object.values(pkg.features).filter(f => typeof f === 'string' && f.trim().length > 0)
        }
      }
      
      // If no valid features found, use defaults
      if (processedFeatures.length === 0) {
        processedFeatures = [
          `${pkg.messageLimit.toLocaleString()} messages per month`,
          `${pkg.instanceLimit} BizsApp instances`,
          `${pkg.contact_limit?.toLocaleString() || '10,000'} contacts storage`,
          `${pkg.api_key_limit || 'Unlimited'} API keys`,
          `${pkg.webhook_limit || 'Unlimited'} webhooks`,
          'Advanced automation & workflows',
          'Real-time analytics dashboard',
          'Multi-device support',
          'Template message support',
          'Contact management system',
          'Message scheduling',
          'Auto-reply functionality',
          'Media file sharing',
          'Bulk messaging',
          'API integration support',
          'Export/Import contacts',
          'Message history tracking',
          'Custom webhook support',
          'Priority email support',
          '99.9% uptime guarantee'
        ]
      }
      
      return {
        ...pkg,
        offer_price: pkg.offer_price ? Number(pkg.offer_price) : null,
        popular: index === 1, // Mark the middle package as popular
        features: processedFeatures
      }
    })

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