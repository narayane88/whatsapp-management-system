const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:Nitin@123@localhost:5432/whatsapp_system?schema=public',
});

async function checkTransactionStructure() {
  try {
    console.log('🔍 Checking transaction table structure...');

    // Get table columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Transaction table columns:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Sample transaction data
    const sampleTransactions = await pool.query(`
      SELECT id, "userId", "createdBy", type, method, amount, currency, status, description
      FROM transactions 
      ORDER BY "createdAt" DESC
      LIMIT 3;
    `);

    console.log('\n💰 Sample transactions:');
    sampleTransactions.rows.forEach(txn => {
      console.log(`  - ID: ${txn.id}, User: ${txn.userId}, Type: ${txn.type}, Method: ${txn.method}, Amount: ${txn.amount}, Status: ${txn.status}`);
    });

    // Check enum values for transaction types and methods
    const enumTypes = await pool.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname IN ('TransactionType', 'PaymentMethod', 'TransactionStatus')
      ORDER BY t.typname, e.enumsortorder;
    `);

    console.log('\n🏷️ Enum values:');
    let currentType = '';
    enumTypes.rows.forEach(row => {
      if (row.typname !== currentType) {
        console.log(`\n${row.typname}:`);
        currentType = row.typname;
      }
      console.log(`  - ${row.enumlabel}`);
    });

  } catch (error) {
    console.error('❌ Error checking transaction structure:', error);
  } finally {
    await pool.end();
  }
}

checkTransactionStructure()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });