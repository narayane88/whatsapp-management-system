const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
  ssl: false,
})

async function setupCompanyProfile() {
  try {
    console.log('🏢 Setting up company profile system...\n')
    
    const client = await pool.connect()
    
    // Create company_profile table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        mobile_number VARCHAR(20),
        phone_number VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        gstin_number VARCHAR(50),
        pan_number VARCHAR(20),
        favicon_url TEXT,
        light_logo_url TEXT,
        dark_logo_url TEXT,
        established_year INTEGER,
        business_type VARCHAR(100),
        description TEXT,
        social_media JSONB,
        bank_details JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Company profile table created/verified')
    
    // Create trigger for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_company_profile_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_company_profile_updated_at_trigger ON company_profile;
      CREATE TRIGGER update_company_profile_updated_at_trigger
          BEFORE UPDATE ON company_profile
          FOR EACH ROW
          EXECUTE FUNCTION update_company_profile_updated_at();
    `)
    console.log('✅ Company profile triggers created')
    
    // Check if company profile exists
    const existingProfile = await client.query('SELECT id FROM company_profile WHERE is_active = true LIMIT 1')
    
    if (existingProfile.rows.length === 0) {
      // Insert default company profile - Bizflash Insight Solution
      await client.query(`
        INSERT INTO company_profile (
          company_name, address, city, state, country, postal_code,
          mobile_number, phone_number, email, website,
          gstin_number, pan_number, established_year, business_type,
          description, favicon_url, light_logo_url, dark_logo_url,
          social_media, bank_details
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
      `, [
        'Bizflash Insight Solution',
        'Natpeute, Technology Hub',
        'Natpeute',
        'Maharashtra', 
        'India',
        '413101',
        '8983063144',
        '8983063144',
        'admin@bizflash.in',
        'https://bizflash.in',
        '27ABCDE1234F1Z5',
        'ABCDE1234F',
        2020,
        'Software Development & Digital Solutions',
        'Bizflash Insight Solution is a leading technology company specializing in WhatsApp Business API solutions, custom software development, and digital transformation services. We provide comprehensive business automation and customer engagement solutions.',
        '/images/company/favicon.svg',
        '/images/company/logo-light.svg',
        '/images/company/logo-dark.svg',
        JSON.stringify({
          website: 'https://bizflash.in',
          linkedin: 'https://linkedin.com/company/bizflash-insight-solution',
          twitter: 'https://twitter.com/bizflash',
          facebook: 'https://facebook.com/bizflash'
        }),
        JSON.stringify({
          bank_name: 'State Bank of India',
          account_number: 'XXXXXXXXXXXX1234',
          ifsc_code: 'SBIN0012345',
          branch: 'Natpeute Branch'
        })
      ])
      
      console.log('✅ Default company profile created: Bizflash Insight Solution')
    } else {
      console.log('ℹ️ Company profile already exists')
    }
    
    // Create company settings permission
    await client.query(`
      INSERT INTO permissions (id, name, description, category, is_system_permission)
      VALUES ('company.settings', 'Manage Company Settings', 'Access and modify company profile and settings', 'System', true)
      ON CONFLICT (id) DO UPDATE SET
      name = 'Manage Company Settings',
      description = 'Access and modify company profile and settings',
      category = 'System'
    `)
    
    // Assign to OWNER role
    const ownerRole = await client.query('SELECT id FROM roles WHERE name = $1', ['OWNER'])
    if (ownerRole.rows.length > 0) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [ownerRole.rows[0].id, 'company.settings'])
    }
    
    console.log('✅ Company settings permission created and assigned')
    
    client.release()
    
    // Display company profile info
    const profileResult = await pool.query('SELECT * FROM company_profile WHERE is_active = true LIMIT 1')
    if (profileResult.rows.length > 0) {
      const profile = profileResult.rows[0]
      console.log('\n🏢 Company Profile Summary:')
      console.log(`   Name: ${profile.company_name}`)
      console.log(`   Address: ${profile.address}, ${profile.city}, ${profile.state}`)
      console.log(`   Mobile: ${profile.mobile_number}`)
      console.log(`   Email: ${profile.email}`)
      console.log(`   Website: ${profile.website}`)
      console.log(`   GSTIN: ${profile.gstin_number}`)
      console.log(`   Business Type: ${profile.business_type}`)
    }
    
    console.log('\n🎉 Company profile system setup complete!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  } finally {
    await pool.end()
  }
}

setupCompanyProfile()