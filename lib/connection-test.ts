import { supabase, isSupabaseAvailable, testConnection } from './supabase'

export async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  // Check if environment variables are set
  if (!isSupabaseAvailable()) {
    console.error('❌ Supabase connection failed:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL is not set')
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    console.error('')
    console.error('📝 To fix this:')
    console.error('   1. Create a .env.local file in your project root')
    console.error('   2. Add your Supabase credentials:')
    console.error('      NEXT_PUBLIC_SUPABASE_URL=your_project_url')
    console.error('      NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
    console.error('   3. Restart your development server')
    return false
  }

  // Test the actual connection
  const isConnected = await testConnection()
  
  if (isConnected) {
    console.log('✅ Supabase connection successful!')
    return true
  } else {
    console.error('❌ Supabase connection failed:')
    console.error('   - Check your project URL and anon key')
    console.error('   - Ensure your Supabase project is active')
    console.error('   - Verify the database tables exist')
    return false
  }
}

export function getConnectionStatus() {
  return {
    isAvailable: isSupabaseAvailable(),
    hasEnvironmentVariables: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
  }
}
