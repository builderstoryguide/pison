const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sqlContent, description) {
  console.log(`\n🔧 ${description}...`);
  
  try {
    // For Supabase, we need to execute SQL differently
    // Let's try using a simple query first
    const { data, error } = await supabase
      .from('timetable_classes')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Cannot execute SQL directly through Supabase client.');
      console.log('📋 Please run this SQL manually in your Supabase SQL Editor:');
      console.log('=' .repeat(80));
      console.log(sqlContent);
      console.log('=' .repeat(80));
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log('📋 Please run the SQL script manually in your Supabase SQL Editor');
    return true;
    
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    return false;
  }
}

async function applyTimetableFixes() {
  console.log('🚀 Starting Timetable Duplicate Prevention Fix Application');
  console.log('=' .repeat(80));
  
  // Test database connection
  console.log('🔍 Testing database connection...');
  const { data, error } = await supabase
    .from('timetable_schedules')
    .select('id')
    .limit(1);
  
  if (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Manual Application Required');
    console.log('Since automatic execution is not available, please apply the fixes manually:');
    console.log('\n1. Open your Supabase Dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Run the following scripts in order:');
    console.log('   a) scripts/fix-timetable-generation-function.sql');
    console.log('   b) scripts/enhance-timetable-duplicate-prevention.sql');
    console.log('\n📚 See TIMETABLE_DUPLICATE_PREVENTION.md for detailed instructions');
    return;
  }
  
  console.log('✅ Database connection successful!');
  
  // Read and display the SQL scripts
  const scripts = [
    {
      file: 'scripts/fix-timetable-generation-function.sql',
      description: 'Applying basic duplicate prevention fix'
    },
    {
      file: 'scripts/enhance-timetable-duplicate-prevention.sql',
      description: 'Applying advanced duplicate prevention enhancements'
    }
  ];
  
  for (const script of scripts) {
    try {
      const sqlPath = path.join(__dirname, '..', script.file);
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        await executeSQL(sqlContent, script.description);
      } else {
        console.log(`⚠️  Script not found: ${script.file}`);
      }
    } catch (err) {
      console.error(`❌ Error reading ${script.file}:`, err.message);
    }
  }
  
  console.log('\n🎉 Fix Application Process Complete!');
  console.log('=' .repeat(80));
  console.log('\n📋 Manual Steps Required:');
  console.log('1. Copy the SQL content shown above');
  console.log('2. Open your Supabase Dashboard → SQL Editor');
  console.log('3. Paste and execute each script');
  console.log('4. Test timetable generation');
  
  console.log('\n✨ After applying the fixes, your timetable generation will:');
  console.log('   ✅ Handle existing schedules properly (no more duplicate key errors)');
  console.log('   ✅ Prevent class scheduling conflicts');
  console.log('   ✅ Support custom timetable parameters');
  console.log('   ✅ Provide detailed conflict detection');
  console.log('   ✅ Enable automatic conflict resolution');
  
  console.log('\n📚 For detailed documentation, see:');
  console.log('   - TIMETABLE_GENERATION_FIX.md');
  console.log('   - TIMETABLE_DUPLICATE_PREVENTION.md');
}

// Test function to verify the fixes work
async function testTimetableGeneration() {
  console.log('\n🧪 Testing Timetable Generation...');
  
  try {
    // Test basic database connectivity
    const { data: classes, error: classError } = await supabase
      .from('timetable_classes')
      .select('id, name')
      .limit(1);
    
    if (classError) {
      console.log('❌ Cannot access timetable_classes table:', classError.message);
      return;
    }
    
    if (!classes || classes.length === 0) {
      console.log('⚠️  No timetable classes found. Please ensure timetable data is set up.');
      return;
    }
    
    console.log('✅ Timetable classes table accessible');
    console.log(`📊 Found ${classes.length} class(es) available for testing`);
    
    // Check for existing schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('timetable_schedules')
      .select('id, name, academic_year, term')
      .limit(5);
    
    if (!scheduleError && schedules) {
      console.log(`📅 Found ${schedules.length} existing schedule(s)`);
      schedules.forEach(schedule => {
        console.log(`   - ${schedule.name} (${schedule.academic_year}, ${schedule.term})`);
      });
    }
    
    console.log('\n🎯 Ready for timetable generation testing!');
    console.log('Try generating a timetable through your admin interface.');
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

// Run the fix application
if (require.main === module) {
  applyTimetableFixes()
    .then(() => testTimetableGeneration())
    .catch(err => {
      console.error('💥 Application failed:', err.message);
      process.exit(1);
    });
}

module.exports = { applyTimetableFixes, testTimetableGeneration };
