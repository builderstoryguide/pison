
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const logFile = path.resolve(__dirname, 'check_output.txt');
const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
};

// Clear log file
fs.writeFileSync(logFile, '');

if (!supabaseUrl || !supabaseKey) {
  log('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  log('Checking subjects...');
  
  // 1. Get Class ID for "AC 1"
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .or('name.eq.AC 1,class_name.eq.AC 1');

  if (classError || !classes || classes.length === 0) {
    log(`Class "AC 1" not found. Error: ${JSON.stringify(classError)}`);
    return;
  }

  const classId = classes[0].id;
  log(`Class 'AC 1' ID: ${classId}`);

  // 2. Fetch subjects
  const { data: classSubjects, error: subjectsError } = await supabase
    .from('class_subjects')
    .select(`
        subject_id,
        subjects (
          id,
          name,
          coefficient,
          code
        )
      `)
    .eq('class_id', classId);

  if (subjectsError) {
    log(`Error fetching subjects: ${JSON.stringify(subjectsError)}`);
    return;
  }

  log(`Found ${classSubjects.length} subjects:`);
  
  let mathFound = false;
  classSubjects.forEach(cs => {
    const s = cs.subjects;
    if (s) {
       log(`- ${s.name} (Code: ${s.code}, ID: ${s.id}, Coef: ${s.coefficient})`);
       if (s.name.toLowerCase().includes('math')) {
         mathFound = true;
       }
    }
  });


  if (mathFound) {
    log('RESULT: Mathematics IS assigned.');
  } else {
    log('RESULT: Mathematics is NOT assigned.');
    
    // ... global search code ...
  }

  // 3. Fetch one student ID
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('class', classId)
    .limit(1);


  if (students && students.length > 0) {
      const studentId = students[0].id;
      log(`Found Student ID: ${studentId}`);

      // 4. Fetch Report Data
      const termUrl = `http://localhost:3000/api/admin/reports/student-report?studentId=${studentId}&classId=${classId}&academicTermId=first`;
      log(`Fetching report from: ${termUrl}`);
      
      try {
          const res = await fetch(termUrl);
          const json = await res.json();
          
          if (json._debug) {
            log('DEBUG INFO:');
            log(JSON.stringify(json._debug, null, 2));
            
            // Log missing subjects
            if (Array.isArray(json._debug.subjectsFound)) {
              log('Subjects found by API:');
              json._debug.subjectsFound.forEach(s => log(`- ${s}`));
            }
            
            if (Array.isArray(json._debug.processedSubjects)) {
              log('Processed subjects:');
              json._debug.processedSubjects.forEach(s => log(`- ${s}`));
            }
          } else {
            log('No _debug info in response (Did you restart server after modification?)');
            log(JSON.stringify(json).substring(0, 500));
          }      } catch (err) {
          log(`Error fetching report: ${err.message}`);
      }
      
  } else {
      log(`No students found in class. Error: ${JSON.stringify(studentError)}`);
  }
}

check();
