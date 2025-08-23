const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function addOfferPrice() {
  try {
    console.log('💰 Adding offer price field to packages...\n')
    
    // Add offer_price column to packages table
    console.log('1️⃣ Adding offer_price column to packages table...')
    await pool.query(`
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS offer_price DECIMAL(10,2) DEFAULT NULL
    `)
    console.log('✅ Added offer_price column (nullable for optional discounts)')
    
    // Add offer_enabled column for easier management
    console.log('2️⃣ Adding offer_enabled column...')
    await pool.query(`
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS offer_enabled BOOLEAN DEFAULT FALSE
    `)
    console.log('✅ Added offer_enabled column')
    
    // Test with sample offer prices
    console.log('\n3️⃣ Setting sample offer prices for existing packages...')
    const packages = await pool.query('SELECT id, name, price FROM packages ORDER BY price DESC')
    
    for (let i = 0; i < Math.min(packages.rows.length, 3); i++) {
      const pkg = packages.rows[i]
      const discountPercent = [20, 15, 25][i] // Different discount percentages
      const offerPrice = (pkg.price * (1 - discountPercent / 100)).toFixed(2)
      
      await pool.query(
        'UPDATE packages SET offer_price = $1, offer_enabled = TRUE WHERE id = $2',
        [parseFloat(offerPrice), pkg.id]
      )
      
      console.log(`   🎯 ${pkg.name}: ₹${pkg.price} → ₹${offerPrice} (${discountPercent}% off)`)
    }
    
    // Verify the changes
    console.log('\n4️⃣ Verifying offer price structure...')
    const updatedPackages = await pool.query(`
      SELECT id, name, price, offer_price, offer_enabled 
      FROM packages 
      ORDER BY price DESC
    `)
    
    console.log('\n📦 Package Pricing Structure:')
    updatedPackages.rows.forEach(pkg => {
      if (pkg.offer_enabled && pkg.offer_price) {
        const savings = (pkg.price - pkg.offer_price).toFixed(2)
        const discount = (((pkg.price - pkg.offer_price) / pkg.price) * 100).toFixed(0)
        console.log(`   📦 ${pkg.name}`)
        console.log(`      💰 Regular: ₹${pkg.price}`)
        console.log(`      🎯 Offer: ₹${pkg.offer_price} (Save ₹${savings} - ${discount}% off)`)
      } else {
        console.log(`   📦 ${pkg.name}: ₹${pkg.price} (No offer)`)
      }
    })
    
    console.log('\n🎉 Offer price system successfully added!')
    console.log('📋 Summary:')
    console.log('   ✅ Added offer_price column (nullable decimal)')
    console.log('   ✅ Added offer_enabled column (boolean flag)')
    console.log('   ✅ Set sample offer prices for testing')
    console.log('   ✅ Ready for UI integration')
    
  } catch (error) {
    console.error('❌ Error adding offer price:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    pool.end()
  }
}

addOfferPrice()