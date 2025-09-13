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

async function setupUsersDatabase() {
  console.log('🚀 Setting up users database...');

  try {
    // Read and execute the SQL script
    const fs = require('fs');
    const path = require('path');
    
    const sqlFilePath = path.join(__dirname, 'create-users-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Executing SQL script...');
    
    // Split the SQL script into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`⚠️  Warning executing statement: ${error.message}`);
          }
        } catch (err) {
          console.warn(`⚠️  Warning: ${err.message}`);
        }
      }
    }
    
    console.log('✅ SQL script executed successfully');
    
    // Create default admin user with proper password hash
    console.log('👤 Creating default admin user...');
    
    const adminPassword = 'Admin@2024'; // Default password - should be changed on first login
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .upsert({
        email: 'admin@pisonacademy.cm',
        password_hash: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        status: 'active',
        permissions: ['all'],
        has_default_password: true,
        created_by: null
      }, {
        onConflict: 'email'
      })
      .select()
      .single();
    
    if (adminError) {
      console.error('❌ Error creating admin user:', adminError);
    } else {
      console.log('✅ Default admin user created successfully');
      console.log('📧 Email: admin@pisonacademy.cm');
      console.log('🔑 Password: Admin@2024');
      console.log('⚠️  IMPORTANT: Change this password on first login!');
    }
    
    // Create sample users for testing
    console.log('👥 Creating sample users...');
    
    const sampleUsers = [
      {
        email: 'teacher@pisonacademy.cm',
        password: 'Teacher@2024',
        name: 'Paul Biya Mbeki',
        role: 'teacher',
        teacherRegNo: 'TCH2024001',
        subsystem: 'english',
        phone: '+237 677 234 567',
        address: 'Douala, Cameroon',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        permissions: ['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents']
      },
      {
        email: 'student@pisonacademy.cm',
        password: 'Student@2024',
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
        password: 'Parent@2024',
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
        password: 'Bursar@2024',
        name: 'Grace Tabi',
        role: 'bursar',
        subsystem: 'english',
        phone: '+237 677 567 890',
        address: 'Yaoundé, Cameroon',
        dateOfBirth: '1980-11-10',
        gender: 'female',
        permissions: ['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']
      }
    ];
    
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
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
          created_by: adminUser?.id
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
        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      }
    }
    
    console.log('\n🎉 Users database setup completed successfully!');
    console.log('\n📋 Sample user credentials:');
    sampleUsers.forEach(user => {
      console.log(`   ${user.email} - ${user.password}`);
    });
    console.log('\n⚠️  IMPORTANT: Change all default passwords in production!');
    
  } catch (error) {
    console.error('❌ Error setting up users database:', error);
    process.exit(1);
  }
}

// Function to verify database setup
async function verifyDatabaseSetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'user_profiles', 'user_activity_logs', 'user_sessions', 'password_reset_tokens']);
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return false;
    }
    
    console.log('✅ Required tables found:', tables.map(t => t.table_name));
    
    // Check if admin user exists
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@pisonacademy.cm')
      .single();
    
    if (adminError || !adminUser) {
      console.error('❌ Admin user not found');
      return false;
    }
    
    console.log('✅ Admin user found:', adminUser.email);
    
    // Count total users
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting users:', countError);
      return false;
    }
    
    console.log(`✅ Total users in database: ${count}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying database setup:', error);
    return false;
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await setupUsersDatabase();
      break;
    case 'verify':
      await verifyDatabaseSetup();
      break;
    default:
      console.log('Usage: node setup-users-database.js [setup|verify]');
      console.log('  setup  - Create tables and sample data');
      console.log('  verify - Check if database is properly set up');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  setupUsersDatabase,
  verifyDatabaseSetup
};
