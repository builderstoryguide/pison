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

async function testTableAccess() {
  try {
    console.log('🧪 Testing app_configuration table access...')

    // Test 1: Check if table exists and get structure
    console.log('\n1️⃣ Checking table structure...')
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'app_configuration' ORDER BY ordinal_position` 
      })

    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError.message)
    } else {
      console.log('✅ Table structure:', columns)
    }

    // Test 2: Try to select from the table
    console.log('\n2️⃣ Testing table access...')
    const { data: config, error: selectError } = await supabase
      .from('app_configuration')
      .select('*')
      .limit(1)

    if (selectError) {
      console.error('❌ Error selecting from table:', selectError.message)
      console.error('   Error code:', selectError.code)
      console.error('   Error details:', selectError.details)
    } else {
      console.log('✅ Table access successful!')
      console.log('📊 Current data:', config)
    }

    // Test 3: Check record count
    console.log('\n3️⃣ Checking record count...')
    const { count, error: countError } = await supabase
      .from('app_configuration')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting records:', countError.message)
    } else {
      console.log('✅ Record count:', count)
      
      if (count === 0) {
        console.log('⚠️  No records found, inserting default configuration...')
        
        const { data: insertData, error: insertError } = await supabase
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
          .select()

        if (insertError) {
          console.error('❌ Error inserting default configuration:', insertError.message)
        } else {
          console.log('✅ Default configuration inserted successfully!')
          console.log('📊 Inserted data:', insertData)
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testTableAccess()
