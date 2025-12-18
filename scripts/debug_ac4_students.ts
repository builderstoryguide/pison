import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  const output: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    output.push(msg);
  };

  log("=== Debugging AC 4 Students Fetch ===");
  log("");

  // 1. Find AC 4 class
  const { data: classes, error: classErr } = await supabase
    .from('classes')
    .select('id, class_name, name, status')
    .or('class_name.ilike.%AC 4%,name.ilike.%AC 4%');

  if (classErr) {
    log("Error fetching class: " + JSON.stringify(classErr));
    return;
  }

  if (!classes || classes.length === 0) {
    log("Class AC 4 not found in the database.");
    return;
  }

  log("Found AC 4 class(es):");
  classes.forEach(c => {
    log(`  ID: ${c.id}`);
    log(`  class_name: ${c.class_name}`);
    log(`  name: ${c.name}`);
    log(`  status: ${c.status}`);
    log("");
  });

  const classId = classes[0].id;
  log(`Using class ID: ${classId}`);
  log("");

  // 2. Check students with class = classId (UUID)
  const { data: studentsByUUID, error: err1 } = await supabase
    .from('students')
    .select('id, first_name, last_name, student_id, class, status')
    .eq('class', classId)
    .eq('status', 'active');

  log("Students where class = classId (UUID) and status = active:");
  if (err1) {
    log("  Error: " + JSON.stringify(err1));
  } else {
    log(`  Found ${studentsByUUID?.length || 0} students`);
    if (studentsByUUID && studentsByUUID.length > 0) {
      studentsByUUID.slice(0, 5).forEach(s => {
        log(`    - ${s.first_name} ${s.last_name} (${s.student_id})`);
      });
    }
  }
  log("");

  // 3. Check students with class = 'AC 4' (class name)
  const { data: studentsByName, error: err2 } = await supabase
    .from('students')
    .select('id, first_name, last_name, student_id, class, status')
    .eq('class', 'AC 4')
    .eq('status', 'active');

  log("Students where class = 'AC 4' (name string) and status = active:");
  if (err2) {
    log("  Error: " + JSON.stringify(err2));
  } else {
    log(`  Found ${studentsByName?.length || 0} students`);
    if (studentsByName && studentsByName.length > 0) {
      studentsByName.slice(0, 5).forEach(s => {
        log(`    - ${s.first_name} ${s.last_name} (${s.student_id})`);
      });
    }
  }
  log("");

  // 4. Check class_students join table
  const { data: classStudents, error: err3 } = await supabase
    .from('class_students')
    .select('id, student_id, class_id')
    .eq('class_id', classId);

  log("class_students join table entries for AC 4:");
  if (err3) {
    log("  Error: " + JSON.stringify(err3));
  } else {
    log(`  Found ${classStudents?.length || 0} entries`);
  }
  log("");

  // 5. Summary
  const totalUUID = studentsByUUID?.length || 0;
  const totalName = studentsByName?.length || 0;
  const totalJoin = classStudents?.length || 0;

  log("=== SUMMARY ===");
  log(`Students by UUID match: ${totalUUID}`);
  log(`Students by name match: ${totalName}`);
  log(`class_students entries: ${totalJoin}`);
  log("");

  if (totalUUID === 0 && totalName === 0) {
    log("ISSUE: No students found for AC 4 class!");
    log("Possible causes:");
    log("  1. No students are enrolled in AC 4");
    log("  2. Students have status != 'active'");
    log("  3. Class column value mismatch");
  }

  log("=== Done ===");

  // Write to file
  fs.writeFileSync(path.resolve(__dirname, 'debug_ac4_result.txt'), output.join('\n'), 'utf8');
  console.log('\nOutput written to scripts/debug_ac4_result.txt');
}

debug().catch(console.error);
