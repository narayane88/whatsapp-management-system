const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432
});

async function createAuditLog() {
  try {
    console.log('🔧 Creating audit log table...\n');
    
    // Create user_audit_log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        performed_by VARCHAR(255) NOT NULL,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ user_audit_log table created');

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON user_audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON user_audit_log(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON user_audit_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON user_audit_log(performed_by);
    `);
    console.log('✅ Audit log indexes created');

    console.log('\n🎉 Audit log system created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating audit log:', error.message);
  } finally {
    pool.end();
  }
}

createAuditLog();