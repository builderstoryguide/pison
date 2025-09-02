const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  console.log('🚀 Creating admin user...');

  try {
    // Generate password hash
    const password = 'Admin@2024';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        email: 'admin@pisonacademy.cm',
        password_hash: hashedPassword,
        name: 'Dr. Marie Ngozi',
        role: 'admin',
        status: 'active',
        avatar_url: 'initials:MN',
        phone: '+237 677 123 456',
        address: 'Pison Academy of Excellence, Yaounde, Cameroon',
        date_of_birth: '1980-01-01',
        gender: 'female',
        permissions: ['all'],
        has_default_password: true,
        password_last_changed: new Date().toISOString(),
        password_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating admin user:', userError);
      return;
    }

    console.log('✅ Admin user created successfully!');

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        role_specific_id: 'ADM2024001',
        subsystem: 'english',
        branch: 'grammar',
        occupation: 'Principal & System Administrator'
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('⚠️  Warning creating profile:', profileError);
    } else {
      console.log('✅ Admin profile created successfully!');
    }

    // Display login credentials
    console.log('\n🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('📧 Email: admin@pisonacademy.cm');
    console.log('🔑 Password: Admin@2024');
    console.log('👤 Role: admin');
    console.log('🔐 Permissions: all');
    console.log('🆔 Admin ID: ADM2024001');
    console.log('=====================================');
    console.log('\n💡 You can now log in to the application!');
    console.log('⚠️  Remember to change the password on first login.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createAdminUser();
