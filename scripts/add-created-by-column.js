const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addCreatedByColumn() {
  try {
    console.log('Adding createdBy column to transactions table...')
    
    // Check if column already exists
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'createdBy'
    `
    
    if (columnCheck.length > 0) {
      console.log('✓ createdBy column already exists')
      return
    }
    
    // Add the createdBy column
    await prisma.$executeRaw`
      ALTER TABLE transactions 
      ADD COLUMN "createdBy" TEXT
    `
    
    console.log('✓ Added createdBy column to transactions table')
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE transactions 
      ADD CONSTRAINT fk_transactions_created_by 
      FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
    `
    
    console.log('✓ Added foreign key constraint for createdBy')
    
    // Update existing transactions to have a default creator (first admin user)
    const adminUser = await prisma.$queryRaw`
      SELECT id FROM users 
      WHERE id ~ '^[a-zA-Z]' 
      ORDER BY id 
      LIMIT 1
    `
    
    if (adminUser.length > 0) {
      const adminId = adminUser[0].id
      
      await prisma.$executeRaw`
        UPDATE transactions 
        SET "createdBy" = ${adminId}
        WHERE "createdBy" IS NULL
      `
      
      console.log(`✓ Set default creator for existing transactions: ${adminId}`)
    } else {
      console.log('⚠ No admin user found with string ID to set as default creator')
    }
    
    // Verify the changes
    const updatedTable = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `
    
    console.log('\n✓ Updated table structure:')
    console.table(updatedTable)
    
  } catch (error) {
    console.error('Error adding createdBy column:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addCreatedByColumn()