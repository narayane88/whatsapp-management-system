import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

// PostgreSQL connection using centralized configuration
const pool = new Pool(getDatabaseConfig())


// GET - Fetch company profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ [COMPANY-PROFILE-GET] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    // Check permission using our centralized permission system
    const hasPermission = await checkCurrentUserPermission('company.profile.read')
    if (!hasPermission) {
      console.log(`❌ [COMPANY-PROFILE-GET] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [COMPANY-PROFILE-GET] Required permission: company.profile.read`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'company.profile.read',
          userEmail: session.user.email,
          message: 'User does not have the required permission to view company profile'
        } : undefined
      }, { status: 403 })
    }

    // Try to get company profile from database
    try {
      const result = await pool.query('SELECT * FROM company_profile ORDER BY id LIMIT 1')
      
      if (result.rows.length > 0) {
        return NextResponse.json({
          success: true,
          data: result.rows[0]
        })
      } else {
        // Return default company profile if no data exists
        const defaultProfile = {
          id: 1,
          company_name: 'WhatsApp Management System',
          address: 'Business Address',
          city: 'Business City',
          state: 'Business State', 
          country: 'India',
          postal_code: '000000',
          mobile_number: '+91-XXXXXXXXXX',
          phone_number: '+91-XXXXXXXXXX',
          email: 'contact@company.com',
          website: 'https://company.com',
          gstin_number: 'GSTIN123456789',
          pan_number: 'PANNO1234C',
          established_year: new Date().getFullYear(),
          business_type: 'Technology',
          description: 'WhatsApp Business Management Platform',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }

        return NextResponse.json({
          success: true,
          data: defaultProfile
        })
      }
    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ 
        error: 'Database error',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('💥 Company profile API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update company profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ [COMPANY-PROFILE-PUT] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    // Check permission using our centralized permission system
    const hasPermission = await checkCurrentUserPermission('company.profile.update')
    if (!hasPermission) {
      console.log(`❌ [COMPANY-PROFILE-PUT] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [COMPANY-PROFILE-PUT] Required permission: company.profile.update`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'company.profile.update',
          userEmail: session.user.email,
          message: 'User does not have the required permission to update company profile'
        } : undefined
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      company_name, 
      address, 
      city, 
      state, 
      country, 
      postal_code, 
      mobile_number, 
      phone_number, 
      email, 
      website, 
      gstin_number, 
      pan_number, 
      established_year, 
      business_type, 
      description,
      favicon_url,
      light_logo_url,
      dark_logo_url,
      social_media,
      bank_details
    } = body

    // Validate required fields
    if (!company_name) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Company name is required'
      }, { status: 400 })
    }

    try {
      // Check if company profile exists
      const existingResult = await pool.query('SELECT id FROM company_profile ORDER BY id LIMIT 1')
      
      let result
      if (existingResult.rows.length > 0) {
        // Update existing company profile
        const companyId = existingResult.rows[0].id
        result = await pool.query(`
          UPDATE company_profile 
          SET 
            company_name = COALESCE($1, company_name),
            address = COALESCE($2, address),
            city = COALESCE($3, city),
            state = COALESCE($4, state),
            country = COALESCE($5, country),
            postal_code = COALESCE($6, postal_code),
            mobile_number = COALESCE($7, mobile_number),
            phone_number = COALESCE($8, phone_number),
            email = COALESCE($9, email),
            website = COALESCE($10, website),
            gstin_number = COALESCE($11, gstin_number),
            pan_number = COALESCE($12, pan_number),
            established_year = COALESCE($13, established_year),
            business_type = COALESCE($14, business_type),
            description = COALESCE($15, description),
            favicon_url = COALESCE($16, favicon_url),
            light_logo_url = COALESCE($17, light_logo_url),
            dark_logo_url = COALESCE($18, dark_logo_url),
            social_media = COALESCE($19, social_media),
            bank_details = COALESCE($20, bank_details),
            updated_at = NOW()
          WHERE id = $21
          RETURNING *
        `, [
          company_name, address, city, state, country, postal_code,
          mobile_number, phone_number, email, website, gstin_number, pan_number,
          established_year, business_type, description, favicon_url, light_logo_url,
          dark_logo_url, social_media, bank_details, companyId
        ])
      } else {
        // Create new company profile
        result = await pool.query(`
          INSERT INTO company_profile (
            company_name, address, city, state, country, postal_code,
            mobile_number, phone_number, email, website, gstin_number, pan_number,
            established_year, business_type, description, favicon_url, light_logo_url,
            dark_logo_url, social_media, bank_details, is_active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, true, NOW(), NOW()
          ) RETURNING *
        `, [
          company_name, address, city, state, country, postal_code,
          mobile_number, phone_number, email, website, gstin_number, pan_number,
          established_year, business_type, description, favicon_url, light_logo_url,
          dark_logo_url, social_media, bank_details
        ])
      }

      return NextResponse.json({
        success: true,
        message: 'Company profile updated successfully',
        data: result.rows[0]
      })
    } catch (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json({ 
        error: 'Database error',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('💥 Company profile PUT API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}