const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Verifying admin user in database...\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('✅ Environment variables are set\n');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAdminUser() {
  try {
    console.log('1️⃣ Checking if admin user exists...');
    
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@pisonacademy.cm')
      .single();

    if (userError) {
      console.error('❌ Error finding admin user:', userError.message);
      return;
    }

    if (!adminUser) {
      console.error('❌ Admin user not found in database');
      return;
    }

    console.log('✅ Admin user found!');
    console.log('   - ID:', adminUser.id);
    console.log('   - Email:', adminUser.email);
    console.log('   - Name:', adminUser.name);
    console.log('   - Role:', adminUser.role);
    console.log('   - Status:', adminUser.status);
    console.log('   - Has password hash:', !!adminUser.password_hash);
    console.log('   - Password hash length:', adminUser.password_hash?.length || 'N/A');
    console.log('   - Permissions:', adminUser.permissions);
    console.log('   - Has default password:', adminUser.has_default_password);
    console.log('   - Password expiry:', adminUser.password_expiry_date);
    console.log('');

    console.log('2️⃣ Checking admin user profile...');
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', adminUser.id)
      .single();

    if (profileError) {
      console.error('❌ Error finding admin profile:', profileError.message);
    } else if (profile) {
      console.log('✅ Admin profile found!');
      console.log('   - Role Specific ID:', profile.role_specific_id);
      console.log('   - Subsystem:', profile.subsystem);
      console.log('   - Branch:', profile.branch);
    } else {
      console.log('⚠️  Admin profile not found');
    }
    console.log('');

    console.log('3️⃣ Testing password verification...');
    
    const bcrypt = require('bcryptjs');
    const testPassword = 'Admin@2024';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('   - Test password "Admin@2024" matches the hash');
      console.log('   - Login should work with these credentials');
    } else {
      console.log('❌ Password verification failed!');
      console.log('   - Test password "Admin@2024" does NOT match the hash');
      console.log('   - This explains why login is failing');
      console.log('');
      console.log('🔧 Possible solutions:');
      console.log('   1. Re-run the admin creation SQL script');
      console.log('   2. Check if the password hash was generated correctly');
      console.log('   3. Verify the bcrypt version compatibility');
    }
    console.log('');

    console.log('4️⃣ Testing login API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@pisonacademy.cm',
          password: 'Admin@2024',
          role: 'admin'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Login API test successful!');
        console.log('   - API endpoint is working');
        console.log('   - Authentication is working');
        console.log('   - User data returned:', data.user.name);
      } else {
        console.log('❌ Login API test failed');
        console.log('   - Status:', response.status);
        console.log('   - Error:', data.error);
      }
    } catch (apiError) {
      console.log('❌ Login API test error:', apiError.message);
      console.log('   - Make sure your development server is running on port 3000');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the verification
verifyAdminUser();
