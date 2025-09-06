const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTimetableAPI() {
  console.log('🔍 Debugging Timetable API Error...\n');

  // 1. Check if main tables exist
  console.log('1. Checking if timetable tables exist:');
  const tables = [
    'timetable_classes',
    'timetable_teachers', 
    'timetable_subjects',
    'timetable_rooms',
    'timetable_periods',
    'timetable_schedules'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: OK (${data?.length || 0} records)`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
    }
  }

  // 2. Check if the view exists
  console.log('\n2. Checking if v_class_timetables view exists:');
  try {
    const { data, error } = await supabase
      .from('v_class_timetables')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ v_class_timetables view: ${error.message}`);
      console.log('   💡 This is likely the cause of the 500 error!');
    } else {
      console.log(`   ✅ v_class_timetables view: OK (${data?.length || 0} records)`);
    }
  } catch (err) {
    console.log(`   ❌ v_class_timetables view: ${err.message}`);
  }

  // 3. Test the API endpoint directly
  console.log('\n3. Testing API endpoint directly:');
  try {
    const response = await fetch(`${supabaseUrl.replace('supabase.co', 'supabase.co')}/rest/v1/v_class_timetables?select=*&limit=1`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ API call failed: ${response.status} - ${errorText}`);
    } else {
      const data = await response.json();
      console.log(`   ✅ API call successful: ${data.length || 0} records`);
    }
  } catch (err) {
    console.log(`   ❌ API call error: ${err.message}`);
  }

  // 4. Check what data exists
  console.log('\n4. Checking existing data:');
  try {
    const { data: classes } = await supabase
      .from('timetable_classes')
      .select('id, name, academic_year')
      .limit(5);
    
    console.log(`   📊 Timetable classes: ${classes?.length || 0}`);
    classes?.forEach(cls => {
      console.log(`      - ${cls.name} (${cls.academic_year})`);
    });

    const { data: periods } = await supabase
      .from('timetable_periods')
      .select('id, class_id, day_of_week, start_time')
      .limit(5);
    
    console.log(`   📊 Timetable periods: ${periods?.length || 0}`);
    periods?.forEach(period => {
      console.log(`      - ${period.day_of_week} ${period.start_time} (class: ${period.class_id})`);
    });

  } catch (err) {
    console.log(`   ❌ Data check error: ${err.message}`);
  }

  // 5. Provide solutions
  console.log('\n🛠️  Solutions:');
  console.log('1. If tables are missing: Run scripts/timetable-database-setup.sql');
  console.log('2. If view is missing: Run the view creation part of the setup script');
  console.log('3. If data is missing: Run sample data insertion scripts');
  console.log('\n📋 Quick fix SQL for missing view:');
  console.log(`
CREATE OR REPLACE VIEW v_class_timetables AS
SELECT 
    tc.id as class_id,
    tc.name as class_name,
    tc.level,
    tc.subsystem,
    tc.branch,
    tc.academic_year,
    tp.id as period_id,
    tp.day_of_week,
    tp.start_time,
    tp.end_time,
    tp.period_number,
    COALESCE(ts.name, 'TBD') as subject_name,
    COALESCE(tch.name, 'TBD') as teacher_name,
    COALESCE(tr.name, 'TBD') as room_name,
    tr.room_type,
    tp.period_type,
    tp.is_break,
    tp.notes
FROM timetable_classes tc
LEFT JOIN timetable_periods tp ON tc.id = tp.class_id
LEFT JOIN timetable_subjects ts ON tp.subject_id = ts.id
LEFT JOIN timetable_teachers tch ON tp.teacher_id = tch.id
LEFT JOIN timetable_rooms tr ON tp.room_id = tr.id
WHERE tc.is_active = true
ORDER BY tc.name, tp.day_of_week, tp.start_time;
  `);
}

// Run the debug
if (require.main === module) {
  debugTimetableAPI().catch(console.error);
}

module.exports = { debugTimetableAPI };
