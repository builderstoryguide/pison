console.log('🚀 Starting simple database test...');

// Check if we can access environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Environment variables not loaded. Trying to load .env.local manually...');
  
  // Try to load .env.local manually
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse environment variables
    envContent.split('\n').forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
    
    console.log('✅ .env.local loaded manually');
    
    // Check again
    const newSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const newSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('After manual load:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', newSupabaseUrl ? 'Set' : 'Missing');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', newSupabaseServiceKey ? 'Set' : 'Missing');
    
  } catch (error) {
    console.log('❌ Failed to load .env.local manually:', error.message);
    process.exit(1);
  }
}

// Now try to create Supabase client
try {
  const { createClient } = require('@supabase/supabase-js');
  
  const finalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const finalSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!finalSupabaseUrl || !finalSupabaseServiceKey) {
    console.log('❌ Still missing environment variables');
    process.exit(1);
  }
  
  console.log('✅ Creating Supabase client...');
  const supabase = createClient(finalSupabaseUrl, finalSupabaseServiceKey);
  
  // Test connection
  console.log('🔍 Testing database connection...');
  supabase
    .from('users')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Database connection failed:', error.message);
      } else {
        console.log('✅ Database connection successful!');
        
        // Now check for admin user
        console.log('🔍 Checking for admin user...');
        return supabase
          .from('users')
          .select('*')
          .eq('email', 'admin@pisonacademy.cm')
          .single();
      }
    })
    .then(({ data: adminUser, error: adminError }) => {
      if (adminError) {
        console.log('❌ Error finding admin user:', adminError.message);
      } else if (adminUser) {
        console.log('✅ Admin user found!');
        console.log('   - Name:', adminUser.name);
        console.log('   - Role:', adminUser.role);
        console.log('   - Has password hash:', !!adminUser.password_hash);
        console.log('   - Password hash length:', adminUser.password_hash?.length || 'N/A');
      } else {
        console.log('❌ Admin user not found');
      }
    })
    .catch(err => {
      console.log('❌ Unexpected error:', err.message);
    });
    
} catch (error) {
  console.log('❌ Error creating Supabase client:', error.message);
}
