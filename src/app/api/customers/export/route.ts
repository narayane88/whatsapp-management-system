import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// GET /api/customers/export - Export customers data in various formats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('customers.export'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv' // csv, excel, pdf
    const search = searchParams.get('search') || ''
    const dealerFilter = searchParams.get('dealer') || ''
    const statusFilter = searchParams.get('status') || ''
    const packageFilter = searchParams.get('package') || ''
    const expiryFilter = searchParams.get('expiry') || ''
    const expiryDays = parseInt(searchParams.get('expiry_days') || '30')

    // Build export query with same filters as GET customers
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.mobile,
        CASE WHEN u."isActive" THEN 'Active' ELSE 'Inactive' END as status,
        u.created_at,
        u.last_login,
        u.account_balance,
        u.message_balance,
        u.registration_source,
        u.last_package_purchase,
        dealer.name as dealer_name,
        dealer.dealer_code as dealer_code,
        p.name as package_name,
        p.price as package_price,
        cp.expires_at as package_expiry,
        CASE 
          WHEN cp.expires_at IS NULL AND cp.package_id IS NULL THEN 'No Package'
          WHEN cp.expires_at < CURRENT_TIMESTAMP THEN 'Expired'
          WHEN cp.expires_at < CURRENT_TIMESTAMP + INTERVAL '${expiryDays} days' THEN 'Expiring Soon'
          ELSE 'Active'
        END as package_status,
        CASE 
          WHEN cp.expires_at IS NOT NULL THEN 
            GREATEST(0, EXTRACT(DAY FROM (cp.expires_at - CURRENT_TIMESTAMP)))
          ELSE NULL
        END as days_until_expiry
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users dealer ON u."parentId" = dealer.id
      LEFT JOIN customer_packages cp ON u.id = cp.customer_id AND cp.is_active = true
      LEFT JOIN packages p ON cp.package_id = p.id
      WHERE r.name = 'CUSTOMER'
    `
    
    const queryParams: any[] = []
    let paramCount = 0

    // Apply same filters as main customers API
    if (search) {
      paramCount++
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.phone ILIKE $${paramCount} OR u.mobile ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    if (dealerFilter) {
      if (dealerFilter === 'no_dealer') {
        query += ` AND u."parentId" IS NULL`
      } else {
        paramCount++
        query += ` AND u."parentId" = $${paramCount}`
        queryParams.push(parseInt(dealerFilter))
      }
    }

    if (statusFilter) {
      if (statusFilter === 'active') {
        query += ` AND u."isActive" = true`
      } else if (statusFilter === 'inactive') {
        query += ` AND u."isActive" = false`
      }
    }

    if (packageFilter) {
      paramCount++
      query += ` AND cp.package_id = $${paramCount}`
      queryParams.push(packageFilter)
    }

    if (expiryFilter) {
      if (expiryFilter === 'expired') {
        query += ` AND cp.expires_at < CURRENT_TIMESTAMP`
      } else if (expiryFilter === 'expiring_soon') {
        query += ` AND cp.expires_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '${expiryDays} days'`
      } else if (expiryFilter === 'active') {
        query += ` AND (cp.expires_at IS NULL OR cp.expires_at > CURRENT_TIMESTAMP + INTERVAL '${expiryDays} days')`
      } else if (expiryFilter === 'no_package') {
        query += ` AND cp.package_id IS NULL`
      }
    }

    query += ` ORDER BY u.created_at DESC`

    const result = await pool.query(query, queryParams)
    const customers = result.rows

    // Log export action
    await pool.query(`
      INSERT INTO user_audit_log (
        user_id, action, performed_by, details, ip_address
      ) SELECT 
        (SELECT id FROM users WHERE email = $1),
        'customer_export',
        $2,
        $3,
        $4
    `, [
      session.user.email,
      session.user.email,
      JSON.stringify({
        format,
        filters: { search, dealerFilter, statusFilter, packageFilter, expiryFilter },
        record_count: customers.length
      }),
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    if (format === 'csv') {
      return exportAsCSV(customers)
    } else if (format === 'excel') {
      return exportAsExcel(customers)
    } else if (format === 'pdf') {
      return exportAsPDF(customers)
    } else {
      return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Export customers error:', error)
    return NextResponse.json({ 
      error: 'Failed to export customers',
      details: error.message 
    }, { status: 500 })
  }
}

function exportAsCSV(customers: any[]) {
  const headers = [
    'ID', 'Name', 'Email', 'Phone', 'Mobile', 'Status', 'Created At',
    'Last Login', 'Account Balance', 'Message Balance', 'Registration Source',
    'Dealer Name', 'Dealer Code', 'Package Name', 'Package Price', 
    'Package Expiry', 'Package Status', 'Days Until Expiry'
  ]

  const csvContent = [
    headers.join(','),
    ...customers.map(customer => [
      customer.id,
      `"${customer.name || ''}"`,
      `"${customer.email || ''}"`,
      `"${customer.phone || ''}"`,
      `"${customer.mobile || ''}"`,
      customer.status,
      customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '',
      customer.last_login ? new Date(customer.last_login).toLocaleDateString() : '',
      customer.account_balance || 0,
      customer.message_balance || 0,
      `"${customer.registration_source || ''}"`,
      `"${customer.dealer_name || ''}"`,
      `"${customer.dealer_code || ''}"`,
      `"${customer.package_name || ''}"`,
      customer.package_price || '',
      customer.package_expiry ? new Date(customer.package_expiry).toLocaleDateString() : '',
      customer.package_status,
      customer.days_until_expiry || ''
    ].join(','))
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

function exportAsExcel(customers: any[]) {
  // For Excel export, we'll return JSON that the frontend can convert to Excel
  // using a library like xlsx or similar
  return NextResponse.json({
    data: customers,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'last_login', label: 'Last Login', type: 'date' },
      { key: 'account_balance', label: 'Account Balance', type: 'currency' },
      { key: 'message_balance', label: 'Message Balance' },
      { key: 'registration_source', label: 'Registration Source' },
      { key: 'dealer_name', label: 'Dealer Name' },
      { key: 'dealer_code', label: 'Dealer Code' },
      { key: 'package_name', label: 'Package Name' },
      { key: 'package_price', label: 'Package Price', type: 'currency' },
      { key: 'package_expiry', label: 'Package Expiry', type: 'date' },
      { key: 'package_status', label: 'Package Status' },
      { key: 'days_until_expiry', label: 'Days Until Expiry' }
    ],
    filename: `customers_${new Date().toISOString().split('T')[0]}.xlsx`
  })
}

function exportAsPDF(customers: any[]) {
  // For PDF export, we'll create a simple HTML that can be converted to PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f4f4f4; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { margin-bottom: 20px; padding: 10px; background-color: #e8f4f8; }
      </style>
    </head>
    <body>
      <h1>Customer Report</h1>
      <div class="summary">
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Total Customers:</strong> ${customers.length}</p>
        <p><strong>Active Customers:</strong> ${customers.filter(c => c.status === 'Active').length}</p>
        <p><strong>Customers with Packages:</strong> ${customers.filter(c => c.package_name).length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Dealer</th>
            <th>Package</th>
            <th>Package Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(customer => `
            <tr>
              <td>${customer.id}</td>
              <td>${customer.name || ''}</td>
              <td>${customer.email || ''}</td>
              <td>${customer.status}</td>
              <td>${customer.dealer_name || 'None'}</td>
              <td>${customer.package_name || 'None'}</td>
              <td>${customer.package_status}</td>
              <td>${customer.created_at ? new Date(customer.created_at).toLocaleDateString() : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.html"`
    }
  })
}