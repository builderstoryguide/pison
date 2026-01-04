const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listPopulatedClasses() {
  console.log('=== Listing Populated Classes ===\n');

  // 1. Fetch all student class_ids
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('class_id');
  
  if (studentError) {
    console.error('Error fetching students:', studentError);
    return;
  }

  console.log(`Fetched ${students.length} student records.`);

  // 2. Aggregate counts
  const classCounts = {};
  students.forEach(s => {
    if (s.class_id) {
      classCounts[s.class_id] = (classCounts[s.class_id] || 0) + 1;
    } else {
      classCounts['null'] = (classCounts['null'] || 0) + 1;
    }
  });

  // 3. Fetch class names for these IDs
  const classIds = Object.keys(classCounts).filter(id => id !== 'null');
  
  console.log(`\nFound ${classIds.length} unique class IDs.`);
  if (classCounts['null']) {
    console.log(`- [Unassigned/Null Class ID]: ${classCounts['null']} students`);
  }

  if (classIds.length === 0) {
    console.log('No students have assigned class_ids!');
    return;
  }

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .in('id', classIds);
  
  if (classError) {
    console.error('Error fetching classes:', classError);
    return;
  }

  // 4. Print results
  console.log('\nPopulated Classes:');
  classes.forEach(c => {
    console.log(`- ${c.name} (ID: ${c.id}): ${classCounts[c.id]} students`);
  });
}

listPopulatedClasses().catch(console.error);
