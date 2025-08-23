const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestTransactions() {
  try {
    console.log('Creating test transactions...')

    // First, let's get existing users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      take: 5
    })

    if (users.length === 0) {
      console.log('No users found. Please create users first.')
      return
    }

    console.log(`Found ${users.length} users`)

    // Create test transactions
    const testTransactions = [
      {
        userId: users[0]?.id,
        type: 'PURCHASE',
        method: 'GATEWAY',
        amount: 125.50,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Professional Package Purchase',
        reference: 'TXN-' + Date.now() + '-1'
      },
      {
        userId: users[1]?.id || users[0]?.id,
        type: 'RECHARGE',
        method: 'UPI',
        amount: 85.00,
        currency: 'USD',
        status: 'PENDING',
        description: 'Account recharge',
        reference: 'TXN-' + Date.now() + '-2'
      },
      {
        userId: users[2]?.id || users[0]?.id,
        type: 'PURCHASE',
        method: 'BANK',
        amount: 200.00,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Enterprise Package Purchase',
        reference: 'TXN-' + Date.now() + '-3'
      },
      {
        userId: users[3]?.id || users[0]?.id,
        type: 'COMMISSION',
        method: 'CASH',
        amount: 45.25,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Dealer commission payout',
        reference: 'TXN-' + Date.now() + '-4'
      },
      {
        userId: users[4]?.id || users[0]?.id,
        type: 'REFUND',
        method: 'GATEWAY',
        amount: 75.00,
        currency: 'USD',
        status: 'FAILED',
        description: 'Refund for cancelled order',
        reference: 'TXN-' + Date.now() + '-5'
      },
      {
        userId: users[0]?.id,
        type: 'RECHARGE',
        method: 'WALLET',
        amount: 150.00,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'Wallet top-up',
        reference: 'TXN-' + Date.now() + '-6'
      }
    ]

    // Create transactions one by one
    for (const txn of testTransactions) {
      if (txn.userId) {
        const transaction = await prisma.transaction.create({
          data: txn,
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
        console.log(`Created transaction: ${transaction.id} for user: ${transaction.user.name}`)
      }
    }

    console.log(`\nSuccessfully created ${testTransactions.length} test transactions!`)
    
    // Show summary
    const totalTransactions = await prisma.transaction.count()
    console.log(`\nTotal transactions in database: ${totalTransactions}`)

  } catch (error) {
    console.error('Error creating test transactions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
createTestTransactions()