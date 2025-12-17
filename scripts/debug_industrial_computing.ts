
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  console.log('Searching for "Industrial Computing"...');
  
  // Check Subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, has_sub_branches')
    .ilike('name', '%Industrial%Computing%');
    
  console.log('\n--- Subjects matching "Industrial Computing" ---');
  subjects?.forEach((s: any) => console.log(`${s.name} (ID: ${s.id}, Has Sub-branches: ${s.has_sub_branches})`));

  // Check Sub-branches
  const { data: subbranches } = await supabase
    .from('subject_sub_branches')
    .select('id, name, subject_id, subjects(name)')
    .ilike('name', '%Industrial%Computing%');

  console.log('\n--- Sub-branches matching "Industrial Computing" ---');
  subbranches?.forEach((sb: any) => console.log(`${sb.name} (Parent Subject: ${sb.subjects?.name})`));

  // Check if any of these are assigned to AC 1/AC 2 indirectly
  // Get class IDs
  const { data: classes } = await supabase.from('classes').select('id, name').in('name', ['AC 1', 'AC 2']);
  const classIds = classes?.map((c: any) => c.id) || [];
  
  if (classIds.length > 0) {
      const { data: assignments } = await supabase
        .from('class_subjects')
        .select('subject_id, subject_name, class_id')
        .in('class_id', classIds);
        
      console.log('\n--- Assignments potentially related ---');
      assignments?.forEach((a: any) => {
         // Check if this assignment is a parent of an industrial computing sub-branch
         const isParent = subbranches?.some((sb: any) => sb.subject_id === a.subject_id);
         if (isParent) {
             console.log(`Class subject assignment "${a.subject_name}" IS A PARENT of Industrial Computing sub-branch.`);
         }
      });
  }
}

check();
