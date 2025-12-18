import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

console.log("Starting script...");
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl ? "Found" : "Missing");
console.log("Key:", supabaseKey ? "Found" : "Missing");

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  console.log("Querying class...");
  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', 'AC 2')
    .limit(1);

  if (error) {
     console.error("Error fetching class:", error);
     return;
  }
  
  if (!classes || classes.length === 0) {
    console.log("AC 2 Class not found");
    return;
  }

  const classId = classes[0].id;
  console.log(`Class 'AC 2' found: ${classId}`);

  console.log("Querying subjects...");
  const { data: subjects, error: subjError } = await supabase
    .from('class_subjects')
    .select('*, subjects(name)')
    .eq('class_id', classId);

  if (subjError) {
     console.error("Error fetching subjects:", subjError);
  } else {
     const acc = subjects.find(s => s.subjects?.name?.toLowerCase().includes('accounting'));
     if (acc) {
         console.log(`Subject 'Accounting' found in class_subjects for AC 2. Subject ID: ${acc.subject_id}`);
     } else {
         console.log(`Subject 'Accounting' NOT found in class_subjects for AC 2`);
         console.log("Available subjects:", subjects.map(s => s.subjects?.name).join(', '));
     }
  }

  // Check assessments anyway
  console.log("Checking assessments...");
  const { data: assessments, error: assError } = await supabase
      .from('assessments')
      .select('id, title, subject')
      .eq('class_id', classId)
      .ilike('subject', '%Accounting%');

  if (assError) console.error("Assessment error:", assError);
  else {
      console.log(`Found ${assessments.length} assessments for Accounting.`);
      assessments.forEach(a => console.log(` - ${a.title}`));
  }
}

check().then(() => console.log("Done")).catch(e => console.error("Crash:", e));
