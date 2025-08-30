// Test Environment Variables and Database Connection
console.log('🔍 Testing Environment Variables and Database Connection...\n')

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment Variables:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set')

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing environment variables. Please check your .env.local file.')
  console.log('Expected variables:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
  process.exit(1)
}

// Test Supabase client creation
const { createClient } = require('@supabase/supabase-js')

try {
  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log('\n✅ Supabase client created successfully')
  
  // Test connection
  console.log('\n🔗 Testing database connection...')
  
  // Test with a simple query
  supabase.from('users').select('count', { count: 'exact', head: true })
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Database connection failed:', error.message)
      } else {
        console.log('✅ Database connection successful')
      }
    })
    .catch(err => {
      console.log('❌ Database connection error:', err.message)
    })
    
} catch (error) {
  console.log('❌ Failed to create Supabase client:', error.message)
}
