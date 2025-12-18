import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', 'AC 2')
    .single();

  if (!classes) {
    console.log('CLASS_NOT_FOUND');
    return;
  }

  console.log(`CLASS_FOUND: ${classes.id}`);

  const subjects = ['Accounting'];
  const sequences = ['First sequence', 'Second sequence'];

  for (const subject of subjects) {
    for (const seq of sequences) {
      const { data: assessments } = await supabase
        .from('assessments')
        .select('id')
        .eq('class_id', classes.id)
        .ilike('subject', `%${subject}%`)
        .ilike('title', `%${seq}%`);

      if (!assessments || assessments.length === 0) {
        console.log(`ASSESSMENT_NOT_FOUND for ${subject} - ${seq}`);
      } else {
        console.log(`ASSESSMENT_FOUND for ${subject} - ${seq}: ${assessments.length} assessment(s)`);
        for (const ass of assessments) {
          const { count } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', ass.id);
          console.log(`MARKS_COUNT for ${subject} - ${seq} (ID: ${ass.id}): ${count}`);
          if (count > 0) {
             const { data: grades } = await supabase.from('grades').select('score').eq('assessment_id', ass.id).limit(1);
             console.log(`SAMPLE_SCORE: ${grades?.[0]?.score}`);
          }
        }
      }
    }
  }
}

check().catch(console.error);
