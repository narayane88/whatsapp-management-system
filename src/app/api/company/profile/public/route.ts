import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// GET /api/company/profile/public - Get public company profile (no authentication required)
export async function GET(request: NextRequest) {
  try {
    // Get company profile data - only public fields
    const result = await pool.query(`
      SELECT 
        id,
        company_name,
        email,
        website,
        mobile_number,
        favicon_url,
        light_logo_url,
        dark_logo_url,
        business_type,
        description,
        city,
        state,
        country
      FROM company_profile
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      // Return default company profile if none exists
      return NextResponse.json({
        success: true,
        data: {
          company_name: 'Bizflash Insight Solution',
          email: 'admin@bizflash.in',
          website: 'https://bizflash.in',
          mobile_number: '8983063144',
          favicon_url: '/images/company/favicon.svg',
          light_logo_url: '/images/company/logo-light.svg',
          dark_logo_url: '/images/company/logo-dark.svg',
          business_type: 'Software Development & Digital Solutions',
          description: 'Bizflash Insight Solution is a leading technology company specializing in WhatsApp Business API solutions, custom software development, and digital transformation services.',
          city: 'Natpeute',
          state: 'Maharashtra',
          country: 'India'
        },
        message: 'Default company profile returned'
      })
    }

    const profile = result.rows[0]

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Company profile retrieved successfully'
    })

  } catch (error) {
    console.error('Public company profile API error:', error)
    
    // Return default profile even on error to ensure app doesn't break
    return NextResponse.json({
      success: true,
      data: {
        company_name: 'Bizflash Insight Solution',
        email: 'admin@bizflash.in',
        website: 'https://bizflash.in',
        mobile_number: '8983063144',
        favicon_url: '/images/company/favicon.svg',
        light_logo_url: '/images/company/logo-light.svg',
        dark_logo_url: '/images/company/logo-dark.svg',
        business_type: 'Software Development & Digital Solutions',
        description: 'Bizflash Insight Solution is a leading technology company specializing in WhatsApp Business API solutions, custom software development, and digital transformation services.',
        city: 'Natpeute',
        state: 'Maharashtra',
        country: 'India'
      },
      message: 'Default company profile returned due to error'
    }, { status: 200 }) // Always return 200 to avoid breaking the UI
  }
}