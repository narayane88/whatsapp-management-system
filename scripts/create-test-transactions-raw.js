const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestTransactions() {
  try {
    console.log('Creating test transactions using raw queries...')

    // Get existing users using raw query
    const users = await prisma.$queryRaw`SELECT id, name, email FROM users ORDER BY id LIMIT 5`
    
    if (users.length === 0) {
      console.log('No users found.')
      return
    }

    console.log(`Found ${users.length} users:`)
    users.forEach(user => console.log(`- ${user.name} (${user.email})`))

    // Create test transactions using raw queries
    const testTransactions = [
      {
        userId: users[0].id,
        type: 'PURCHASE',
        method: 'GATEWAY',
        amount: 125.50,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Professional Package Purchase',
        reference: 'TXN-' + Date.now() + '-1'
      },
      {
        userId: users[1]?.id || users[0].id,
        type: 'RECHARGE',
        method: 'UPI',
        amount: 85.00,
        currency: 'USD',
        status: 'PENDING',
        description: 'Account recharge',
        reference: 'TXN-' + Date.now() + '-2'
      },
      {
        userId: users[2]?.id || users[0].id,
        type: 'PURCHASE',
        method: 'BANK',
        amount: 200.00,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Enterprise Package Purchase',
        reference: 'TXN-' + Date.now() + '-3'
      },
      {
        userId: users[3]?.id || users[0].id,
        type: 'COMMISSION',
        method: 'CASH',
        amount: 45.25,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Dealer commission payout',
        reference: 'TXN-' + Date.now() + '-4'
      },
      {
        userId: users[4]?.id || users[0].id,
        type: 'REFUND',
        method: 'GATEWAY',
        amount: 75.00,
        currency: 'USD',
        status: 'FAILED',
        description: 'Refund for cancelled order',
        reference: 'TXN-' + Date.now() + '-5'
      },
      {
        userId: users[0].id,
        type: 'RECHARGE',
        method: 'WALLET',
        amount: 150.00,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Wallet top-up',
        reference: 'TXN-' + Date.now() + '-6'
      }
    ]

    console.log('\\nCreating transactions...')
    
    // Create transactions using raw insert
    for (const txn of testTransactions) {
      const result = await prisma.$queryRaw`
        INSERT INTO transactions 
        ("userId", type, method, amount, currency, status, description, reference, "createdAt", "updatedAt")
        VALUES (${txn.userId}, ${txn.type}::"TransactionType", ${txn.method}::"PaymentMethod", ${txn.amount}, ${txn.currency}, ${txn.status}::"TransactionStatus", ${txn.description}, ${txn.reference}, NOW(), NOW())
        RETURNING id
      `
      
      const user = users.find(u => u.id === txn.userId)
      console.log(`Created transaction for ${user.name}: ${txn.type} - $${txn.amount}`)
    }

    console.log(`\\nSuccessfully created ${testTransactions.length} test transactions!`)
    
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