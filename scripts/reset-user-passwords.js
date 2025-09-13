const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generates a secure default password for new users
 * Format: Role@Year + 4 random alphanumeric characters
 * Example: Teacher@2024Xy9z
 */
function generateDefaultPassword(role, year = 2024) {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  return `${capitalizedRole}@${year}${randomChars}`;
}

async function resetUserPasswords() {
  console.log('🔄 Resetting passwords for non-admin users...\n');

  try {
    // Get all users except admin
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .neq('role', 'admin')
      .eq('status', 'active');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No non-admin users found in the database.');
      return;
    }

    console.log(`📋 Found ${users.length} non-admin users to reset passwords for:\n`);

    const newPasswords = [];

    for (const user of users) {
      // Generate new password
      const newPassword = generateDefaultPassword(user.role);
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          has_default_password: true,
          password_last_changed: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Error updating password for ${user.email}:`, updateError);
        continue;
      }

      newPasswords.push({
        email: user.email,
        name: user.name,
        role: user.role,
        password: newPassword
      });

      console.log(`✅ Password reset for ${user.name} (${user.role})`);
    }

    console.log('\n🎉 Password reset completed successfully!\n');
    console.log('📋 NEW USER CREDENTIALS:\n');
    console.log('═'.repeat(80));

    // Group by role for better organization
    const groupedByRole = newPasswords.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    }, {});

    // Display credentials by role
    Object.keys(groupedByRole).sort().forEach(role => {
      console.log(`\n🔹 ${role.toUpperCase()} USERS:`);
      console.log('─'.repeat(40));
      
      groupedByRole[role].forEach(user => {
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 Name: ${user.name}`);
        console.log(`🔑 Password: ${user.password}`);
        console.log('─'.repeat(40));
      });
    });

    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('• All passwords expire in 30 days');
    console.log('• Users should change passwords on first login');
    console.log('• Store these credentials securely');
    console.log('• Consider using a password manager');

  } catch (error) {
    console.error('❌ Error resetting user passwords:', error);
    process.exit(1);
  }
}

async function ensureRequiredUsers() {
  console.log('🔍 Checking for required user types...\n');

  try {
    // Check which user types exist
    const { data: roleCounts, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('status', 'active');

    if (roleError) {
      console.error('❌ Error checking user roles:', roleError);
      return;
    }

    const existingRoles = [...new Set(roleCounts.map(u => u.role))];
    const requiredRoles = ['student', 'parent', 'bursar', 'teacher'];
    const missingRoles = requiredRoles.filter(role => !existingRoles.includes(role));

    if (missingRoles.length > 0) {
      console.log(`⚠️  Missing user types: ${missingRoles.join(', ')}`);
      console.log('📝 Creating missing users...\n');

      const usersToCreate = [
        {
          email: 'student@pisonacademy.cm',
          name: 'Amina Fru',
          role: 'student',
          studentId: 'STU2024001',
          subsystem: 'english',
          branch: 'grammar',
          class: 'Form 5A',
          phone: '+237 677 345 678',
          address: 'Bamenda, Cameroon',
          dateOfBirth: '2006-08-22',
          gender: 'female',
          permissions: ['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers']
        },
        {
          email: 'parent@pisonacademy.cm',
          name: 'John Fru',
          role: 'parent',
          parentCode: 'PAR2024001',
          subsystem: 'english',
          phone: '+237 677 456 789',
          address: 'Bamenda, Cameroon',
          permissions: ['view_child_progress', 'communicate_teachers', 'view_financial_records']
        },
        {
          email: 'bursar@pisonacademy.cm',
          name: 'Grace Tabi',
          role: 'bursar',
          subsystem: 'english',
          phone: '+237 677 567 890',
          address: 'Yaoundé, Cameroon',
          dateOfBirth: '1980-11-10',
          gender: 'female',
          permissions: ['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']
        },
        {
          email: 'teacher@pisonacademy.cm',
          name: 'Paul Biya Mbeki',
          role: 'teacher',
          teacherRegNo: 'TCH2024001',
          subsystem: 'english',
          phone: '+237 677 234 567',
          address: 'Douala, Cameroon',
          dateOfBirth: '1985-03-15',
          gender: 'male',
          permissions: ['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents']
        }
      ];

      for (const userData of usersToCreate) {
        if (missingRoles.includes(userData.role)) {
          const newPassword = generateDefaultPassword(userData.role);
          const hashedPassword = await bcrypt.hash(newPassword, 12);

          // Create user
          const { data: user, error: userError } = await supabase
            .from('users')
            .upsert({
              email: userData.email,
              password_hash: hashedPassword,
              name: userData.name,
              role: userData.role,
              status: 'active',
              phone: userData.phone,
              address: userData.address,
              date_of_birth: userData.dateOfBirth,
              gender: userData.gender,
              permissions: userData.permissions,
              has_default_password: true,
              created_by: null
            }, {
              onConflict: 'email'
            })
            .select()
            .single();

          if (userError) {
            console.error(`❌ Error creating user ${userData.email}:`, userError);
            continue;
          }

          // Create user profile
          const profileData = {
            user_id: user.id,
            role_specific_id: userData.studentId || userData.teacherRegNo || userData.parentCode,
            subsystem: userData.subsystem,
            branch: userData.branch,
            class_name: userData.class
          };

          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert(profileData, {
              onConflict: 'user_id'
            });

          if (profileError) {
            console.error(`❌ Error creating profile for ${userData.email}:`, profileError);
          } else {
            console.log(`✅ Created ${userData.role}: ${userData.email} - Password: ${newPassword}`);
          }
        }
      }
    } else {
      console.log('✅ All required user types exist in the database');
    }

  } catch (error) {
    console.error('❌ Error ensuring required users:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'reset':
      await resetUserPasswords();
      break;
    case 'ensure':
      await ensureRequiredUsers();
      break;
    case 'full':
      await ensureRequiredUsers();
      console.log('\n');
      await resetUserPasswords();
      break;
    default:
      console.log('Usage: node reset-user-passwords.js [reset|ensure|full]');
      console.log('  reset  - Reset passwords for existing non-admin users');
      console.log('  ensure - Create missing required user types');
      console.log('  full   - Ensure all users exist and reset all passwords');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  resetUserPasswords,
  ensureRequiredUsers,
  generateDefaultPassword
};
