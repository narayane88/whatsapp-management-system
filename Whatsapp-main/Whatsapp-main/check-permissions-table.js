const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "whatsapp_system",
  password: "Nitin@123",
  port: 5432
});

async function checkPermissionsTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = "permissions" 
      ORDER BY ordinal_position
    `);
    
    console.log("📋 Permissions table structure:");
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === "NO" ? "NOT NULL" : "NULL"} ${row.column_default ? "(default: " + row.column_default + ")" : ""}`);
    });
    
    console.log("\n🔍 Sample permissions:");
    const sampleResult = await pool.query("SELECT * FROM permissions LIMIT 5");
    sampleResult.rows.forEach(row => {
      console.log(`   ID: ${row.id}, Name: ${row.name}, Category: ${row.category || "None"}, Description: ${row.description || "None"}`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    pool.end();
  }
}

checkPermissionsTable();
