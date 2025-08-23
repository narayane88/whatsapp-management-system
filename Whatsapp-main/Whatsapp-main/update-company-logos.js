const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
  ssl: false,
})

async function updateCompanyLogos() {
  try {
    console.log('🔄 Updating company profile logos to SVG format...\n')
    
    const client = await pool.connect()
    
    // Update existing company profile with new SVG logo URLs
    const result = await client.query(`
      UPDATE company_profile 
      SET 
        favicon_url = '/images/company/favicon.svg',
        light_logo_url = '/images/company/logo-light.svg',
        dark_logo_url = '/images/company/logo-dark.svg',
        updated_at = NOW()
      WHERE is_active = true
      RETURNING company_name, favicon_url, light_logo_url, dark_logo_url
    `)
    
    if (result.rows.length > 0) {
      const profile = result.rows[0]
      console.log('✅ Company profile logos updated successfully!')
      console.log(`   Company: ${profile.company_name}`)
      console.log(`   Favicon: ${profile.favicon_url}`)
      console.log(`   Light Logo: ${profile.light_logo_url}`)
      console.log(`   Dark Logo: ${profile.dark_logo_url}`)
    } else {
      console.log('❌ No active company profile found to update')
    }
    
    client.release()
    
  } catch (error) {
    console.error('❌ Update failed:', error.message)
  } finally {
    await pool.end()
  }
}

updateCompanyLogos()