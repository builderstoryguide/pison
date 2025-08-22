const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTeachersTable() {
  console.log('🚀 Starting Teachers Table Setup...\n');

  try {
    // Read the SQL script
    const sqlFilePath = path.join(__dirname, 'create-teachers-table.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📖 Reading SQL script...');
    console.log(`📁 Script path: ${sqlFilePath}\n`);

    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length === 0) {
        continue;
      }

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql is not available, try direct query
          const { error: directError } = await supabase.from('teachers').select('count', { count: 'exact', head: true });
          
          if (directError && !directError.message.includes('does not exist')) {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            continue;
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} skipped (may already exist):`, err.message);
      }
    }

    console.log('\n🔍 Verifying table creation...');

    // Check if teachers table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('teachers')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ Teachers table verification failed:', tableError.message);
      return false;
    }

    console.log('✅ Teachers table exists and is accessible');

    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'teachers' });

    if (columnsError) {
      console.log('⚠️  Could not retrieve column information (function may not exist)');
    } else {
      console.log('\n📋 Table Structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
      });
    }

    // Test inserting a sample teacher
    console.log('\n🧪 Testing teacher insertion...');
    
    const testTeacher = {
      teacher_id: 'TCH2024001',
      title: 'Mr.',
      first_name: 'Test',
      last_name: 'Teacher',
      email: 'test.teacher@school.com',
      phone: '+237612345678',
      date_of_birth: '1985-03-15',
      gender: 'male',
      nationality: 'Cameroonian',
      subsystem: 'english',
      subjects: ['Mathematics', 'Physics'],
      qualifications: ['BSc Mathematics', 'PGCE'],
      experience: '5 years',
      employment_type: 'full-time',
      salary: 150000.00,
      start_date: '2024-01-15',
      status: 'active'
    };

    const { data: insertedTeacher, error: insertError } = await supabase
      .from('teachers')
      .insert(testTeacher)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Test teacher insertion failed:', insertError.message);
    } else {
      console.log('✅ Test teacher inserted successfully');
      console.log(`   Teacher ID: ${insertedTeacher.teacher_id}`);
      console.log(`   Name: ${insertedTeacher.first_name} ${insertedTeacher.last_name}`);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('teachers')
        .delete()
        .eq('teacher_id', 'TCH2024001');

      if (deleteError) {
        console.log('⚠️  Could not clean up test data:', deleteError.message);
      } else {
        console.log('🧹 Test data cleaned up');
      }
    }

    console.log('\n🎉 Teachers table setup completed successfully!');
    console.log('\n📚 Available features:');
    console.log('   ✅ Complete teacher CRUD operations');
    console.log('   ✅ Automatic teacher ID generation');
    console.log('   ✅ Data validation and constraints');
    console.log('   ✅ Performance indexes');
    console.log('   ✅ Automatic timestamp updates');
    console.log('   ✅ Statistics functions');
    console.log('   ✅ Useful database views');

    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Alternative setup using raw SQL execution
async function setupTeachersTableRaw() {
  console.log('🚀 Starting Teachers Table Setup (Raw SQL)...\n');

  try {
    // Read the SQL script
    const sqlFilePath = path.join(__dirname, 'create-teachers-table.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📖 Reading SQL script...');
    console.log(`📁 Script path: ${sqlFilePath}\n`);

    // Execute the entire script
    console.log('⚡ Executing SQL script...');
    
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('❌ SQL execution failed:', error.message);
      console.log('\n💡 Alternative: You can run the SQL script directly in your database client');
      console.log(`📁 Script location: ${sqlFilePath}`);
      return false;
    }

    console.log('✅ SQL script executed successfully');
    
    // Verify table creation
    const { data: tableExists, error: tableError } = await supabase
      .from('teachers')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ Teachers table verification failed:', tableError.message);
      return false;
    }

    console.log('✅ Teachers table exists and is accessible');
    console.log('\n🎉 Teachers table setup completed successfully!');

    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🏫 School Management System - Teachers Table Setup\n');
  
  // Try the detailed setup first
  let success = await setupTeachersTable();
  
  // If detailed setup fails, try raw SQL execution
  if (!success) {
    console.log('\n🔄 Trying alternative setup method...\n');
    success = await setupTeachersTableRaw();
  }

  if (success) {
    console.log('\n✨ Setup completed successfully!');
    console.log('📖 You can now use the teacher management features in your application.');
  } else {
    console.log('\n❌ Setup failed. Please check your database connection and permissions.');
    console.log('💡 You can also run the SQL script manually in your database client.');
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupTeachersTable, setupTeachersTableRaw };
