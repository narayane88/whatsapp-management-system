import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// DEBUG: GET /api/users/current-debug - Get current user without auth for testing
export async function GET(request: NextRequest) {
  try {
    console.log('🐛 DEBUG: Getting current user info without auth...')
    
    // For testing different user levels - change this to test different scenarios
    // const mockUser = {
    //   id: 1, // Level 1 - OWNER
    //   name: 'System Owner',
    //   email: 'owner@demo.com',
    //   phone: null,
    //   dealer_code: 'OWN001',
    //   role: 'OWNER',
    //   dealer_type: 'user',
    //   isActive: true,
    //   created_at: new Date().toISOString()
    // }
    
    // Level 3 - SUBDEALER - SAGAR NARAYANE  
    const mockUser = {
      id: 6,
      name: 'SAGAR NARAYANE',
      email: 'narayanesagar@gmail.com',
      phone: '+91-9876543210',
      dealer_code: 'WA-SNW4-0000',
      role: 'Shree Delaler', // This is the actual role from database
      dealer_type: 'dealer',
      isActive: true,
      level: 3, // Add explicit level
      created_at: new Date().toISOString()
    }
    
    // Uncomment below for testing different levels:
    
    // Level 2 - ADMIN
    // const mockUser = {
    //   id: 2,
    //   name: 'Admin User',
    //   email: 'admin@demo.com',
    //   role: 'ADMIN',
    //   dealer_code: 'ADM001'
    // }
    
    // Level 3 - SUBDEALER  
    // const mockUser = {
    //   id: 6,
    //   name: 'SAGAR NARAYANE',
    //   email: 'nararayanesagar@gmail.com',
    //   role: 'SUBDEALER',
    //   dealer_code: 'WA-SNW4-0000'
    // }
    
    // Level 4 - EMPLOYEE
    // const mockUser = {
    //   id: 4,
    //   name: 'Employee User',
    //   email: 'employee@demo.com',
    //   role: 'EMPLOYEE',
    //   dealer_code: 'EMP001'
    // }

    console.log('✅ DEBUG: Returning mock SUBDEALER user:', mockUser)
    
    return NextResponse.json({
      user: mockUser
    })

  } catch (error) {
    console.error('❌ DEBUG: Get current user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}