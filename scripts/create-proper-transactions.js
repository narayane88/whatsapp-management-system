const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')

const prisma = new PrismaClient()

// Generate cuid-like ID
function generateId() {
  return 'cuid_' + randomBytes(12).toString('base64url')
}

async function createTestTransactions() {
  try {
    console.log('Creating test transactions with proper IDs...')

    // Check existing users table structure
    const userTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `
    console.log('User ID column type:', userTableInfo[0])

    // Since users table uses integer IDs but transactions expects string IDs,
    // we need to either:
    // 1. Create users with string IDs, or 
    // 2. Modify the transaction creation to work with the mismatch
    
    // Let's check if there are any users that might have string IDs
    const stringUsers = await prisma.$queryRaw`
      SELECT id, name, email FROM users 
      WHERE id ~ '^[a-zA-Z]' 
      LIMIT 5
    `
    
    console.log('Users with string IDs:', stringUsers)
    
    if (stringUsers.length === 0) {
      console.log('No string ID users found. Creating transactions with generated string user IDs...')
      
      // Create a few test users with proper string IDs first
      const testUsers = [
        {
          id: generateId(),
          name: 'Test User 1',
          email: 'testuser1@example.com',
          role: 'CUSTOMER'
        },
        {
          id: generateId(), 
          name: 'Test User 2',
          email: 'testuser2@example.com',
          role: 'CUSTOMER'
        }
      ]
      
      // Insert users with string IDs
      for (const user of testUsers) {
        try {
          await prisma.$queryRaw`
            INSERT INTO users (id, name, email, password, "isActive", created_at, updated_at)
            VALUES (${user.id}, ${user.name}, ${user.email}, '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO', true, NOW(), NOW())
          `
          console.log(`Created user: ${user.name} with ID: ${user.id}`)
        } catch (userError) {
          console.log(`User might already exist: ${user.email}`)
        }
      }
      
      // Now create transactions for these users
      const testTransactions = [
        {
          id: generateId(),
          userId: testUsers[0].id,
          type: 'PURCHASE',
          method: 'GATEWAY',
          amount: 125.50,
          currency: 'USD',
          status: 'SUCCESS',
          description: 'Professional Package Purchase',
          reference: 'TXN-' + Date.now() + '-1'
        },
        {
          id: generateId(),
          userId: testUsers[1].id,
          type: 'RECHARGE',
          method: 'UPI', 
          amount: 85.00,
          currency: 'USD',
          status: 'PENDING',
          description: 'Account recharge',
          reference: 'TXN-' + Date.now() + '-2'
        },
        {
          id: generateId(),
          userId: testUsers[0].id,
          type: 'PURCHASE',
          method: 'BANK',
          amount: 200.00,
          currency: 'USD', 
          status: 'SUCCESS',
          description: 'Enterprise Package Purchase',
          reference: 'TXN-' + Date.now() + '-3'
        }
      ]
      
      console.log('\\nCreating transactions...')
      for (const txn of testTransactions) {
        await prisma.$queryRaw`
          INSERT INTO transactions (id, "userId", type, method, amount, currency, status, description, reference, "createdAt", "updatedAt")
          VALUES (${txn.id}, ${txn.userId}, ${txn.type}::"TransactionType", ${txn.method}::"PaymentMethod", ${txn.amount}, ${txn.currency}, ${txn.status}::"TransactionStatus", ${txn.description}, ${txn.reference}, NOW(), NOW())
        `
        
        const user = testUsers.find(u => u.id === txn.userId)
        console.log(`Created transaction: ${txn.type} $${txn.amount} for ${user.name}`)
      }
      
      console.log(`\\nSuccessfully created ${testTransactions.length} test transactions!`)
    }
    
    // Show summary
    const totalResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`
    const totalTransactions = totalResult[0]?.count || 0
    console.log(`\\nTotal transactions in database: ${totalTransactions}`)

    // Show recent transactions
    const recentTransactions = await prisma.$queryRaw`
      SELECT t.id, t.type, t.method, t.amount, t.currency, t.status, t.description, t."createdAt", u.name as user_name
      FROM transactions t
      JOIN users u ON t."userId" = u.id
      ORDER BY t."createdAt" DESC
      LIMIT 5
    `
    
    console.log('\\nRecent transactions:')
    recentTransactions.forEach(txn => {
      console.log(`- ${txn.user_name}: ${txn.type} ${txn.currency}${txn.amount} (${txn.status})`)
    })

  } catch (error) {
    console.error('Error creating test transactions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
createTestTransactions()