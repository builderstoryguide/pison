const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkForm1BCStudents() {
  console.log('=== Checking Form 1 BC Students ===\n');

  // Get Form 1 BC class
  const { data: classData } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'Form 1 BC')
    .single();

  if (!classData) {
    console.log('❌ Form 1 BC class not found');
    return;
  }

  console.log(`Class: ${classData.name} (ID: ${classData.id})\n`);

  // Check students by class_id
  const { data: studentsByClassId, error: error1 } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name, class_id, class, class_name')
    .eq('class_id', classData.id);

  console.log(`Students with class_id = '${classData.id}': ${studentsByClassId?.length || 0}`);
  if (error1) console.error('Error:', error1);

  // Check students by class_name
  const { data: studentsByClassName, error: error2 } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name, class_id, class, class_name')
    .eq('class_name', 'Form 1 BC');

  console.log(`Students with class_name = 'Form 1 BC': ${studentsByClassName?.length || 0}`);
  if (error2) console.error('Error:', error2);

  // Check students by class column
  const { data: studentsByClass, error: error3 } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name, class_id, class, class_name')
    .eq('class', 'Form 1 BC');

  console.log(`Students with class = 'Form 1 BC': ${studentsByClass?.length || 0}`);
  if (error3) console.error('Error:', error3);

  // Show sample students if found
  const studentsFound = studentsByClassId || studentsByClassName || studentsByClass;
  if (studentsFound && studentsFound.length > 0) {
    console.log('\nSample students (first 5):');
    studentsFound.slice(0, 5).forEach(student => {
      console.log(`  - ${student.student_id}: ${student.first_name} ${student.last_name}`);
      console.log(`    class_id: ${student.class_id}`);
      console.log(`    class: ${student.class}`);
      console.log(`    class_name: ${student.class_name}`);
    });
  } else {
    console.log('\n❌ No students found for Form 1 BC using any column');
  }

  // List all distinct class values in students table
  const { data: allStudents } = await supabase
    .from('students')
    .select('class, class_name')
    .limit(100);

  if (allStudents) {
    const uniqueClasses = [...new Set(allStudents.map(s => s.class || s.class_name).filter(Boolean))];
    console.log('\nAll distinct class values in students table:');
    uniqueClasses.forEach(c => console.log(`  - ${c}`));
  }
}

checkForm1BCStudents().catch(console.error);
