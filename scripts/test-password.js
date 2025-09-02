console.log('🔐 Testing password verification...');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
  
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.log('❌ Failed to load environment variables:', error.message);
  process.exit(1);
}

// Create Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPassword() {
  try {
    // Get the admin user
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@pisonacademy.cm')
      .single();

    if (userError) {
      console.log('❌ Error finding admin user:', userError.message);
      return;
    }

    console.log('✅ Admin user found');
    console.log('   - Password hash:', adminUser.password_hash);
    console.log('   - Hash length:', adminUser.password_hash.length);
    console.log('');

    // Test password verification
    const bcrypt = require('bcryptjs');
    const testPassword = 'Admin@2024';
    
    console.log('🔍 Testing password verification...');
    console.log('   - Test password:', testPassword);
    console.log('   - Stored hash:', adminUser.password_hash);
    console.log('');

    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ PASSWORD VERIFICATION SUCCESSFUL!');
      console.log('   - The password "Admin@2024" matches the stored hash');
      console.log('   - Login should work with these credentials');
    } else {
      console.log('❌ PASSWORD VERIFICATION FAILED!');
      console.log('   - The password "Admin@2024" does NOT match the stored hash');
      console.log('   - This explains why login is failing');
      console.log('');
      console.log('🔧 Possible solutions:');
      console.log('   1. The password hash in the database is incorrect');
      console.log('   2. The password hash was generated with different parameters');
      console.log('   3. The bcrypt version is incompatible');
      console.log('');
      console.log('💡 Let\'s generate a new hash for comparison...');
      
      // Generate a new hash for comparison
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('   - New hash for "Admin@2024":', newHash);
      console.log('   - Hash length:', newHash.length);
      console.log('   - Hash starts with:', newHash.substring(0, 7));
      console.log('   - Stored hash starts with:', adminUser.password_hash.substring(0, 7));
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testPassword();
