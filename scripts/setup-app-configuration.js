const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAppConfiguration() {
  try {
    console.log('🚀 Setting up app configuration table...')

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-app-configuration-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message)
          // Continue with other statements
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`)
        }
      }
    }

    // Test the configuration by trying to fetch it
    console.log('🧪 Testing configuration table...')
    const { data: config, error: fetchError } = await supabase
      .from('app_configuration')
      .select('*')
      .limit(1)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching configuration:', fetchError.message)
    } else {
      console.log('✅ Configuration table setup successful!')
      console.log('📊 Current configuration:')
      console.log('   School Name:', config.school_name)
      console.log('   Logo URL:', config.school_logo_url)
      console.log('   Primary Color:', config.primary_color)
      console.log('   Secondary Color:', config.secondary_color)
      console.log('   Academic Year:', config.academic_year)
      console.log('   Currency:', config.currency)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

// Alternative approach using direct SQL execution
async function setupAppConfigurationDirect() {
  try {
    console.log('🚀 Setting up app configuration table (direct approach)...')

    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS app_configuration (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_name VARCHAR(255) NOT NULL DEFAULT 'Pison Academy',
        school_logo_url TEXT,
        school_logo_alt_text VARCHAR(255) DEFAULT 'School Logo',
        school_address TEXT,
        school_phone VARCHAR(50),
        school_email VARCHAR(255),
        school_website VARCHAR(255),
        school_motto TEXT,
        primary_color VARCHAR(7) DEFAULT '#1f2937',
        secondary_color VARCHAR(7) DEFAULT '#3b82f6',
        academic_year VARCHAR(20) DEFAULT '2024-2025',
        currency VARCHAR(10) DEFAULT 'XOF',
        timezone VARCHAR(50) DEFAULT 'Africa/Douala',
        language VARCHAR(10) DEFAULT 'en',
        date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
        time_format VARCHAR(10) DEFAULT '24h',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      );
    `

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (createError) {
      console.error('❌ Error creating table:', createError.message)
      return
    }

    console.log('✅ Table created successfully')

    // Insert default configuration
    const { data: existingConfig } = await supabase
      .from('app_configuration')
      .select('id')
      .limit(1)
      .single()

    if (!existingConfig) {
      const { error: insertError } = await supabase
        .from('app_configuration')
        .insert({
          school_name: 'Pison Academy',
          school_logo_url: '/placeholder-logo.svg',
          school_logo_alt_text: 'Pison Academy Logo',
          school_address: 'Douala, Cameroon',
          school_phone: '+237 123 456 789',
          school_email: 'info@pisonacademy.cm',
          school_website: 'https://pisonacademy.cm',
          school_motto: 'Excellence in Education',
          primary_color: '#1f2937',
          secondary_color: '#3b82f6',
          academic_year: '2024-2025',
          currency: 'XOF',
          timezone: 'Africa/Douala',
          language: 'en',
          date_format: 'DD/MM/YYYY',
          time_format: '24h'
        })

      if (insertError) {
        console.error('❌ Error inserting default configuration:', insertError.message)
      } else {
        console.log('✅ Default configuration inserted successfully')
      }
    } else {
      console.log('ℹ️  Configuration already exists, skipping insert')
    }

    // Test the configuration
    const { data: config, error: fetchError } = await supabase
      .from('app_configuration')
      .select('*')
      .limit(1)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching configuration:', fetchError.message)
    } else {
      console.log('✅ Configuration setup complete!')
      console.log('📊 Current configuration:')
      console.log('   School Name:', config.school_name)
      console.log('   Logo URL:', config.school_logo_url)
      console.log('   Primary Color:', config.primary_color)
      console.log('   Secondary Color:', config.secondary_color)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the setup
setupAppConfigurationDirect()
