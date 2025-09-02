console.log('🔧 Fixing admin password hash...');

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

async function fixAdminPassword() {
  try {
    console.log('1️⃣ Getting admin user...');
    
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
    console.log('   - Current hash:', adminUser.password_hash);
    console.log('');

    // Generate new password hash
    console.log('2️⃣ Generating new password hash...');
    const bcrypt = require('bcryptjs');
    const newPassword = 'Admin@2024';
    const newHash = await bcrypt.hash(newPassword, 12);
    
    console.log('✅ New hash generated');
    console.log('   - New hash:', newHash);
    console.log('   - Hash starts with:', newHash.substring(0, 7));
    console.log('');

    // Update the admin user with new password hash
    console.log('3️⃣ Updating admin user password...');
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newHash,
        password_last_changed: new Date().toISOString(),
        has_default_password: true
      })
      .eq('email', 'admin@pisonacademy.cm')
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error updating password:', updateError.message);
      return;
    }

    console.log('✅ Password updated successfully!');
    console.log('');

    // Test the new password
    console.log('4️⃣ Testing new password...');
    const isPasswordValid = await bcrypt.compare(newPassword, newHash);
    
    if (isPasswordValid) {
      console.log('✅ NEW PASSWORD VERIFICATION SUCCESSFUL!');
      console.log('   - Password "Admin@2024" now works correctly');
      console.log('   - Login should work now');
    } else {
      console.log('❌ Password verification still failed');
    }
    console.log('');

    // Test the login API
    console.log('5️⃣ Testing login API...');
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
        console.log('🎉 LOGIN API TEST SUCCESSFUL!');
        console.log('   - API endpoint is working');
        console.log('   - Authentication is working');
        console.log('   - User data returned:', data.user.name);
        console.log('');
        console.log('✅ Your login system is now fixed!');
        console.log('   - Email: admin@pisonacademy.cm');
        console.log('   - Password: Admin@2024');
        console.log('   - Role: admin');
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
    console.log('❌ Error:', error.message);
  }
}

fixAdminPassword();
