const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and admin user...\n');

  try {
    // Test 1: Check if we can connect to the database
    console.log('1️⃣ Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    console.log('✅ Database connection successful!\n');

    // Test 2: Check if the admin user exists
    console.log('2️⃣ Checking if admin user exists...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@pisonacademy.cm')
      .single();

    if (adminError) {
      console.error('❌ Error finding admin user:', adminError);
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

    // Test 3: Check user profile
    console.log('3️⃣ Checking admin user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', adminUser.id)
      .single();

    if (profileError) {
      console.error('❌ Error finding admin profile:', profileError);
    } else if (profile) {
      console.log('✅ Admin profile found!');
      console.log('   - Role Specific ID:', profile.role_specific_id);
      console.log('   - Subsystem:', profile.subsystem);
      console.log('   - Branch:', profile.branch);
    } else {
      console.log('⚠️  Admin profile not found');
    }
    console.log('');

    // Test 4: Test password verification
    console.log('4️⃣ Testing password verification...');
    const bcrypt = require('bcryptjs');
    const testPassword = 'Admin@2024';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('   - Test password "Admin@2024" matches the hash');
    } else {
      console.log('❌ Password verification failed!');
      console.log('   - Test password "Admin@2024" does NOT match the hash');
      console.log('   - This explains why login is failing');
    }
    console.log('');

    // Test 5: Check table structure
    console.log('5️⃣ Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (!tableError && tableInfo && tableInfo.length > 0) {
      const columns = Object.keys(tableInfo[0]);
      console.log('✅ Users table columns found:');
      columns.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('⚠️  Could not determine table structure');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabaseConnection();
