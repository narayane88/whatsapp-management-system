const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function addPackageColors() {
  try {
    console.log('🎨 Adding color options for packages...\n')
    
    // Add color column to packages table
    console.log('1️⃣ Adding color column to packages table...')
    await pool.query(`
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS package_color VARCHAR(50) DEFAULT 'blue'
    `)
    console.log('✅ Added package_color column')
    
    // Define 6 professional color options
    const colorOptions = [
      { name: 'blue', label: 'Ocean Blue', primary: '#3b82f6', gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' },
      { name: 'purple', label: 'Royal Purple', primary: '#8b5cf6', gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' },
      { name: 'emerald', label: 'Emerald Green', primary: '#10b981', gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
      { name: 'orange', label: 'Sunset Orange', primary: '#f59e0b', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
      { name: 'rose', label: 'Rose Pink', primary: '#f43f5e', gradient: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)' },
      { name: 'slate', label: 'Professional Slate', primary: '#64748b', gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' }
    ]
    
    console.log('\n2️⃣ Available color options:')
    colorOptions.forEach((color, index) => {
      console.log(`   ${index + 1}. ${color.label} (${color.name}) - ${color.primary}`)
    })
    
    // Update existing packages with different colors
    console.log('\n3️⃣ Assigning colors to existing packages...')
    const packages = await pool.query('SELECT id, name FROM packages ORDER BY id')
    
    for (let i = 0; i < packages.rows.length; i++) {
      const pkg = packages.rows[i]
      const colorIndex = i % colorOptions.length
      const selectedColor = colorOptions[colorIndex]
      
      await pool.query(
        'UPDATE packages SET package_color = $1 WHERE id = $2',
        [selectedColor.name, pkg.id]
      )
      
      console.log(`   📦 ${pkg.name} → ${selectedColor.label}`)
    }
    
    // Test the color assignments
    console.log('\n4️⃣ Verifying color assignments...')
    const coloredPackages = await pool.query(`
      SELECT id, name, price, package_color 
      FROM packages 
      ORDER BY price DESC
    `)
    
    coloredPackages.rows.forEach(pkg => {
      const colorInfo = colorOptions.find(c => c.name === pkg.package_color)
      console.log(`   📦 ${pkg.name} (₹${pkg.price}) - Color: ${colorInfo?.label || pkg.package_color}`)
    })
    
    console.log('\n🎉 Package colors successfully added!')
    console.log('📋 Summary:')
    console.log('   ✅ Added package_color column to database')
    console.log('   ✅ Defined 6 professional color options')
    console.log('   ✅ Assigned colors to existing packages')
    console.log('   ✅ Ready for UI integration')
    
  } catch (error) {
    console.error('❌ Error adding package colors:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    pool.end()
  }
}

addPackageColors()