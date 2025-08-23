const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Nitin@123@localhost:5432/whatsapp_system?schema=public',
});

async function addSubscriptionFields() {
  try {
    console.log('🚀 Adding subscription fields to customer_packages table...');

    // Add createdBy and paymentMethod columns
    await pool.query(`
      DO $$ 
      BEGIN
        -- Add createdBy column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'customer_packages' 
                      AND column_name = 'createdBy') THEN
          ALTER TABLE customer_packages ADD COLUMN "createdBy" INTEGER;
          RAISE NOTICE 'Added createdBy column';
        END IF;

        -- Add paymentMethod column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'customer_packages' 
                      AND column_name = 'paymentMethod') THEN
          ALTER TABLE customer_packages ADD COLUMN "paymentMethod" TEXT DEFAULT 'CASH';
          RAISE NOTICE 'Added paymentMethod column';
        END IF;

        -- Create foreign key constraint for createdBy if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'customer_packages_createdBy_fkey') THEN
          ALTER TABLE customer_packages 
          ADD CONSTRAINT customer_packages_createdBy_fkey 
          FOREIGN KEY ("createdBy") REFERENCES users(id);
          RAISE NOTICE 'Added createdBy foreign key constraint';
        END IF;
      END $$;
    `);

    // Update existing records to have default values
    const updateResult = await pool.query(`
      UPDATE customer_packages 
      SET "paymentMethod" = 'CASH' 
      WHERE "paymentMethod" IS NULL;
    `);

    console.log(`✅ Successfully added subscription fields!`);
    console.log(`📊 Updated ${updateResult.rowCount} existing records with default payment method`);

    // Test the new fields
    const testQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customer_packages' 
      AND column_name IN ('createdBy', 'paymentMethod')
      ORDER BY column_name;
    `);

    console.log('\n📋 New fields created:');
    testQuery.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

  } catch (error) {
    console.error('❌ Error adding subscription fields:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addSubscriptionFields()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });