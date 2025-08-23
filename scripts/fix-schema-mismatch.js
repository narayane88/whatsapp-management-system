const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')

const prisma = new PrismaClient()

// Generate cuid-like ID
function generateId() {
  return 'cm' + randomBytes(12).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
}

async function createCompatibleData() {
  try {
    console.log('Creating compatible users and transactions...')

    // Create new users with string IDs that match Prisma expectations
    const newUsers = [
      {
        id: generateId(),
        name: 'John Smith',
        email: 'john.smith@demo.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO', // demo123
        role: 'CUSTOMER'
      },
      {
        id: generateId(),
        name: 'Sarah Wilson',
        email: 'sarah.wilson@demo.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO',
        role: 'CUSTOMER'
      },
      {
        id: generateId(),
        name: 'Mike Johnson',
        email: 'mike.johnson@demo.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO',
        role: 'SUBDEALER'
      }
    ]

    console.log('Creating users with string IDs...')
    for (const user of newUsers) {
      try {
        // Insert user directly with string ID
        await prisma.$executeRaw`
          INSERT INTO users (id, name, email, password, "isActive", role, created_at, updated_at)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${user.password}, true, ${user.role}::"UserRole", NOW(), NOW())
        `
        console.log(`✓ Created user: ${user.name} (${user.id})`)
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`- User ${user.email} already exists`)
        } else {
          console.error(`Error creating user ${user.name}:`, error.message)
        }
      }
    }

    // Now create transactions for these users
    const transactions = [
      {
        id: generateId(),
        userId: newUsers[0].id,
        type: 'PURCHASE',
        method: 'GATEWAY',
        amount: 299.99,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Premium WhatsApp Package - Monthly',
        reference: `REF-${Date.now()}-001`
      },
      {
        id: generateId(),
        userId: newUsers[1].id,
        type: 'RECHARGE',
        method: 'UPI',
        amount: 150.00,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Account balance recharge',
        reference: `REF-${Date.now()}-002`
      },
      {
        id: generateId(),
        userId: newUsers[2].id,
        type: 'COMMISSION',
        method: 'BANK',
        amount: 75.50,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Monthly dealer commission',
        reference: `REF-${Date.now()}-003`
      },
      {
        id: generateId(),
        userId: newUsers[0].id,
        type: 'PURCHASE',
        method: 'WALLET',
        amount: 99.99,
        currency: 'USD',
        status: 'PENDING',
        description: 'Basic WhatsApp Package - Weekly',
        reference: `REF-${Date.now()}-004`
      },
      {
        id: generateId(),
        userId: newUsers[1].id,
        type: 'REFUND',
        method: 'GATEWAY',
        amount: 45.00,
        currency: 'USD',
        status: 'FAILED',
        description: 'Refund for cancelled subscription',
        reference: `REF-${Date.now()}-005`
      }
    ]

    console.log('\\nCreating transactions...')
    for (const txn of transactions) {
      try {
        await prisma.$executeRaw`
          INSERT INTO transactions (id, "userId", type, method, amount, currency, status, description, reference, "createdAt", "updatedAt")
          VALUES (
            ${txn.id}, 
            ${txn.userId}, 
            ${txn.type}::"TransactionType", 
            ${txn.method}::"PaymentMethod", 
            ${txn.amount}, 
            ${txn.currency}, 
            ${txn.status}::"TransactionStatus", 
            ${txn.description}, 
            ${txn.reference}, 
            NOW(), 
            NOW()
          )
        `
        
        const user = newUsers.find(u => u.id === txn.userId)
        console.log(`✓ Created: ${txn.type} $${txn.amount} for ${user.name} (${txn.status})`)
      } catch (error) {
        console.error(`Error creating transaction:`, error.message)
      }
    }

    // Verify the data
    console.log('\\n=== VERIFICATION ===')
    
    const userCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE id ~ '^cm'
    `
    console.log(`✓ Users with string IDs: ${userCount[0]?.count || 0}`)
    
    const txnCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`
    console.log(`✓ Total transactions: ${txnCount[0]?.count || 0}`)
    
    // Test the join to make sure the API will work
    const testJoin = await prisma.$queryRaw`
      SELECT 
        t.id, t.type, t.method, t.amount, t.currency, t.status, t.description, 
        t."createdAt", u.name as user_name, u.email as user_email
      FROM transactions t
      JOIN users u ON t."userId" = u.id
      WHERE u.id ~ '^cm'
      ORDER BY t."createdAt" DESC
      LIMIT 3
    `
    
    console.log('\\n✓ Sample joined data (API will return similar):')
    testJoin.forEach(txn => {
      console.log(`  - ${txn.user_name}: ${txn.type} ${txn.currency}${txn.amount} (${txn.status})`)
    })
    
    console.log('\\n✅ Setup complete! The frontend should now be able to load transaction data.')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createCompatibleData()