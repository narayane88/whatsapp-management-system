const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCreatedByColumn() {
  try {
    console.log('Fixing createdBy column for transactions table...')
    
    // Check current user table structure
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `
    
    console.log('Users table ID column:', userColumns[0])
    
    // Check transactions table structure
    const transactionColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'createdBy'
    `
    
    if (transactionColumns.length > 0) {
      console.log('Transactions createdBy column:', transactionColumns[0])
      
      // Since users.id is integer, we need to make createdBy integer too
      console.log('Converting createdBy column to integer type...')
      
      // Drop existing column and recreate with correct type
      await prisma.$executeRaw`
        ALTER TABLE transactions DROP COLUMN IF EXISTS "createdBy"
      `
      
      await prisma.$executeRaw`
        ALTER TABLE transactions ADD COLUMN "createdBy" INTEGER
      `
      
      console.log('✓ Recreated createdBy column as integer')
      
      // Add foreign key constraint with correct types
      await prisma.$executeRaw`
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_created_by 
        FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
      `
      
      console.log('✓ Added foreign key constraint for createdBy')
      
      // Set a default creator (first user) for existing transactions
      const firstUser = await prisma.$queryRaw`
        SELECT id FROM users ORDER BY id LIMIT 1
      `
      
      if (firstUser.length > 0) {
        const userId = firstUser[0].id
        
        await prisma.$executeRaw`
          UPDATE transactions 
          SET "createdBy" = ${userId}
          WHERE "createdBy" IS NULL
        `
        
        console.log(`✓ Set default creator for existing transactions: User ID ${userId}`)
      }
      
      // Test the relationship
      const testQuery = await prisma.$queryRaw`
        SELECT 
          t.id, t.description, t."createdBy",
          u.name as creator_name, u.email as creator_email
        FROM transactions t
        LEFT JOIN users u ON t."createdBy" = u.id
        LIMIT 3
      `
      
      console.log('\\n✓ Sample transactions with creators:')
      console.table(testQuery)
      
    } else {
      console.log('createdBy column does not exist yet, creating it...')
      
      await prisma.$executeRaw`
        ALTER TABLE transactions ADD COLUMN "createdBy" INTEGER
      `
      
      await prisma.$executeRaw`
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_created_by 
        FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
      `
      
      console.log('✓ Created createdBy column with proper constraints')
    }
    
  } catch (error) {
    console.error('Error fixing createdBy column:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCreatedByColumn()