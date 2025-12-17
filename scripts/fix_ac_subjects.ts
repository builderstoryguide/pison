
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const requiredSubjects = [
  'French Language',
  'ENGLISH LANGUAGE (ENG LAN)',
  'MATHEMATICS',
  'Computer Aided Management (CAM)',
  'Introduction to Marketing',
  'ACCOUNTING',
  'OFFICE PRACTICE',
  'Citizenship (CTZ)',
  'Physical Education (PE)',
  'Manual Labour (LB)'
];

// Helper to normalize for rough comparison if needed, but we try exact first
// const normalize = (s: string) => s.trim().toLowerCase();

async function fixClass(className: string) {
  console.log(`\nProcessing class: ${className}`);

  // 1. Get Class ID
  const { data: classes, error: cErr } = await supabase
    .from('classes')
    .select('id, name')
    .or(`name.eq.${className},class_name.eq.${className}`);

  if (cErr || !classes?.length) {
    console.error(`Class ${className} not found`);
    return;
  }
  const classId = classes[0].id;
  console.log(`Found Class ID: ${classId}`);

  // 2. Get Subject IDs for required list
  const subjectIds: string[] = [];
  const subjectIdMap = new Map<string, string>(); // name -> id

  for (const name of requiredSubjects) {
    // Try exact match first
    let { data: sData } = await supabase.from('subjects').select('id, name').ilike('name', name).maybeSingle();
    
    if (!sData) {
        // Fallback: try finding by partial if exact string not found (e.g. escaping issues)
        console.warn(`Subject "${name}" not found by exact match. Trying fuzzy...`);
        // This is risky, but we used exact strings from DB check, so we expect exact matches.
        // Skipping fuzzy fallback to be safe/strict.
        console.error(`CRITICAL: Subject "${name}" NOT FOUND in DB. Skipping this subject.`);
        continue;
    }
    
    subjectIds.push(sData.id);
    subjectIdMap.set(sData.id, sData.name);
  }

  console.log(`Resolved ${subjectIds.length} / ${requiredSubjects.length} subject IDs.`);

  // 3. Get existing assignments
  const { data: existing, error: eErr } = await supabase
    .from('class_subjects')
    .select('subject_id')
    .eq('class_id', classId);

  if (eErr) {
    console.error('Error fetching existing subjects:', eErr);
    return;
  }

  const existingIds = existing.map((e: any) => e.subject_id);
  
  // 4. Determine Extras (to delete)
  const toDelete = existingIds.filter((id: string) => !subjectIds.includes(id));
  
  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} extra subjects...`);
    const { error: dErr } = await supabase
      .from('class_subjects')
      .delete()
      .eq('class_id', classId)
      .in('subject_id', toDelete);
      
    if (dErr) console.error('Error deleting:', dErr);
    else console.log('Delete successful.');
  } else {
    console.log('No extra subjects to delete.');
  }

  // 5. Determine Missing (to insert)
  const toInsert = subjectIds.filter(id => !existingIds.includes(id));
  
  if (toInsert.length > 0) {
    console.log(`Inserting ${toInsert.length} missing subjects...`);
    const rows = toInsert.map(id => ({
      class_id: classId,
      subject_id: id,
      subject_name: subjectIdMap.get(id) // Optional but good for readability in DB
    }));
    
    const { error: iErr } = await supabase
      .from('class_subjects')
      .insert(rows);

    if (iErr) console.error('Error inserting:', iErr);
    else console.log('Insert successful.');
  } else {
    console.log('No missing subjects to insert.');
  }
}

async function run() {
  await fixClass('AC 1');
  await fixClass('AC 2');
}

run().catch(console.error);
