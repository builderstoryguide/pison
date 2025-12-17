
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function deduplicate(className: string) {
  console.log(`Checking duplicates for ${className}...`);
  
  // Get Class ID
  const { data: classes } = await supabase.from('classes').select('id').or(`name.eq.${className},class_name.eq.${className}`).single();
  if (!classes) return;
  const classId = classes.id;

  // Get all assignments
  const { data: subjects, error } = await supabase
    .from('class_subjects')
    .select('id, subject_id, subject_name')
    .eq('class_id', classId);

  if (error || !subjects) return;

  const seen = new Set();
  const duplicates = [];

  for (const s of subjects) {
    if (seen.has(s.subject_id)) {
      duplicates.push(s.id);
    } else {
      seen.add(s.subject_id);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicates. Removing...`);
    const { error: delError } = await supabase
        .from('class_subjects')
        .delete()
        .in('id', duplicates);
    
    if (delError) console.error(delError);
    else console.log('Duplicates removed.');
  } else {
    console.log('No duplicates found.');
  }
}

async function run() {
  await deduplicate('AC 1');
  await deduplicate('AC 2');
}

run();
