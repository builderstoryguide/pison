const { createClient } = require('@supabase/supabase-js')

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

async function createConfigurationTable() {
  try {
    console.log('🚀 Creating app_configuration table...')

    // First, check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('app_configuration')
      .select('id')
      .limit(1)

    if (existingTable && !checkError) {
      console.log('ℹ️  Table already exists, checking configuration...')
      
      const { data: config, error: fetchError } = await supabase
        .from('app_configuration')
        .select('*')
        .limit(1)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching existing configuration:', fetchError.message)
      } else {
        console.log('✅ Configuration found:')
        console.log('   School Name:', config.school_name)
        console.log('   Logo URL:', config.school_logo_url)
        console.log('   Primary Color:', config.primary_color)
        console.log('   Secondary Color:', config.secondary_color)
      }
      return
    }

    console.log('📝 Table does not exist, you need to create it manually in Supabase dashboard.')
    console.log('   Please run the SQL from scripts/create-app-configuration-table.sql')
    console.log('   Or create the table through the Supabase dashboard with the following structure:')
    console.log(`
CREATE TABLE app_configuration (
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
    `)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createConfigurationTable()
