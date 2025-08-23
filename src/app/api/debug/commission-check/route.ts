import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || '16' // Default to Shejal's ID

    // Get customer details
    const customerDetails = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u."parentId" as parent_id, u.dealer_code, u.commission_rate,
        r.name as role_name, r.level as role_level
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
    `, [customerId])

    if (customerDetails.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' })
    }

    const customer = customerDetails.rows[0]

    // Get dealer details (parent)
    let dealerDetails = null
    if (customer.parent_id) {
      const dealerResult = await pool.query(`
        SELECT 
          u.id, u.name, u.email, u."parentId" as parent_id, u.dealer_code, u.commission_rate, u.biz_points,
          r.name as role_name, r.level as role_level
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1
      `, [customer.parent_id])
      
      if (dealerResult.rows.length > 0) {
        dealerDetails = dealerResult.rows[0]
      }
    }

    // Check what would happen in commission processing
    let commissionAnalysis = {
      customerQualified: false,
      dealerFound: false,
      commissionRate: 0,
      commissionAmount: 0,
      reason: ''
    }

    const testAmount = 100 // Test with ₹100

    if (customer.role_name !== 'CUSTOMER') {
      commissionAnalysis.reason = `Customer role is '${customer.role_name}', expected 'CUSTOMER'`
    } else if (!customer.parent_id) {
      commissionAnalysis.reason = 'Customer has no assigned dealer (parent_id is null)'
    } else if (!dealerDetails) {
      commissionAnalysis.reason = 'Dealer not found in database'
    } else {
      commissionAnalysis.customerQualified = true
      commissionAnalysis.dealerFound = true

      // Calculate commission rate
      let commissionRate = 0
      
      if (dealerDetails.commission_rate && dealerDetails.commission_rate > 0) {
        // commission_rate is stored as percentage (e.g., 5.00 for 5%), so divide by 100
        commissionRate = parseFloat(dealerDetails.commission_rate) / 100
        commissionAnalysis.reason = `Using dealer's custom commission rate: ${parseFloat(dealerDetails.commission_rate)}%`
      } else {
        switch (dealerDetails.role_name) {
          case 'SUBDEALER':
            commissionRate = 0.10 // 10%
            break
          case 'EMPLOYEE':
            commissionRate = 0.03 // 3%
            break
          case 'ADMIN':
            commissionRate = 0.02 // 2%
            break
          case 'OWNER':
            commissionRate = 0.01 // 1%
            break
          default:
            commissionRate = 0
        }
        
        if (commissionRate > 0) {
          commissionAnalysis.reason = `Using default commission rate for ${dealerDetails.role_name}: ${commissionRate * 100}%`
        } else {
          commissionAnalysis.reason = `No commission rate for dealer role: ${dealerDetails.role_name}`
        }
      }

      commissionAnalysis.commissionRate = commissionRate * 100 // Convert to percentage
      commissionAnalysis.commissionAmount = testAmount * commissionRate
    }

    return NextResponse.json({
      testAmount: testAmount,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: customer.role_name,
        roleLevel: customer.role_level,
        parentId: customer.parent_id,
        dealerCode: customer.dealer_code,
        commissionRate: customer.commission_rate
      },
      dealer: dealerDetails ? {
        id: dealerDetails.id,
        name: dealerDetails.name,
        email: dealerDetails.email,
        role: dealerDetails.role_name,
        roleLevel: dealerDetails.role_level,
        parentId: dealerDetails.parent_id,
        dealerCode: dealerDetails.dealer_code,
        commissionRate: dealerDetails.commission_rate,
        currentBizPoints: dealerDetails.biz_points
      } : null,
      commissionAnalysis: commissionAnalysis
    })

  } catch (error) {
    console.error('Commission check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}