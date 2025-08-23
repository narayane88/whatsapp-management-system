const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTransactionsTable() {
  try {
    console.log('Checking transactions table structure...')
    
    // Check if table exists and get its structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `
    
    console.log('Transactions table structure:')
    console.table(tableInfo)
    
    // Try to get existing transactions
    const existingTransactions = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`
    console.log(`\\nExisting transactions count: ${existingTransactions[0]?.count || 0}`)
    
  } catch (error) {
    console.error('Error checking transactions table:', error)
    
    // If table doesn't exist, let's see what tables do exist
    console.log('\\nChecking what tables exist...')
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      console.log('Available tables:')
      tables.forEach(table => console.log(`- ${table.table_name}`))
    } catch (tableError) {
      console.error('Error listing tables:', tableError)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkTransactionsTable()