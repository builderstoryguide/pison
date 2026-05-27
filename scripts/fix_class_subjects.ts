import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { isSubjectExcludedForClass } from '../lib/report-card-subject-matching';
import { classGroups, subjectMap, type ClassGroup } from '../lib/class-curriculum';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function fixClassSubjects(group: ClassGroup) {
  console.log(`\nProcessing ${group.userClassName} (DB: ${group.dbSearchName})...`);

  // 1. Get Class ID
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', group.dbSearchName);

  if (classError || !classes || classes.length === 0) {
    console.error(`❌ Class "${group.dbSearchName}" not found`);
    return;
  }
  const classId = classes[0].id;

  // 2. Get currently assigned subjects
  const { data: classSubjects, error: subjectsError } = await supabase
    .from('class_subjects')
    .select(`
        subject_id,
        subjects (
          id,
          name,
          code
        )
      `)
    .eq('class_id', classId);

  if (subjectsError) {
    console.error(`Error fetching subjects:`, subjectsError);
    return;
  }

  const assignedSubjects = classSubjects?.map((cs: any) => ({
    subject_id: cs.subject_id,
    name: cs.subjects?.name
  })) || [];

  const requiredSubjectNames = group.subjects
    .map((shortName) => subjectMap[shortName] || shortName)
    .filter(
      (dbName) => !isSubjectExcludedForClass(group.dbSearchName, dbName)
    );

  // 3. Identify Missing & Extra
  const toAdd: string[] = [];
  const toRemoveIds: string[] = [];

  // Find Missing (Check if required DB name exists in assigned)
  for (const reqDbName of requiredSubjectNames) {
    const exists = assignedSubjects.some(
      as => normalize(as.name) === normalize(reqDbName)
    );
    if (!exists) {
      toAdd.push(reqDbName);
    }
  }

  // Find Extras (not in required list, or excluded for this class)
  for (const assigned of assignedSubjects) {
    const isRequired = requiredSubjectNames.some(
      (req) => normalize(req) === normalize(assigned.name)
    );
    const isExcluded = isSubjectExcludedForClass(group.dbSearchName, assigned.name);
    if (!isRequired || isExcluded) {
      const reason = isExcluded ? 'Excluded' : 'Extra';
      console.log(`   Removing (${reason}): ${assigned.name}`);
      toRemoveIds.push(assigned.subject_id);
    }
  }

  // 4. Perform Fixes
  
  // REMOVE
  if (toRemoveIds.length > 0) {
    console.log(`   🗑️  Removing ${toRemoveIds.length} extra subjects...`);
    const { error: delError } = await supabase
      .from('class_subjects')
      .delete()
      .eq('class_id', classId)
      .in('subject_id', toRemoveIds);
    
    if (delError) console.error('   ❌ Error removing:', delError);
    else console.log('   ✅ Removed extras.');
  }

  // ADD
  if (toAdd.length > 0) {
    console.log(`   ➕ Adding ${toAdd.length} missing subjects...`);
    
    for (const subjectName of toAdd) {
      // Find subject ID first
      const { data: subjectData, error: subError } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', subjectName);
      
      if (subError || !subjectData || subjectData.length === 0) {
        console.error(`   ❌ Could not find subject details for "${subjectName}"`);
        continue;
      }

      const subjectId = subjectData[0].id;
      
      // Removed coefficient
      const { error: insertError } = await supabase
        .from('class_subjects')
        .insert({
          class_id: classId,
          subject_id: subjectId
        });
      
      if (insertError) console.error(`   ❌ Failed to add ${subjectName}:`, insertError);
      else console.log(`      Added ${subjectName}`);
    }
  }

  if (toAdd.length === 0 && toRemoveIds.length === 0) {
    console.log('   ✅ No changes needed.');
  }
}

async function runFix() {
  const bcOnly = process.argv.includes('--bc-only');
  const hecOnly = process.argv.includes('--hec-only');
  const epsOnly = process.argv.includes('--eps-only');
  const groups = epsOnly
    ? classGroups.filter((g) => g.userClassName.startsWith('EPS'))
    : hecOnly
      ? classGroups.filter((g) => g.userClassName.startsWith('Hec'))
      : bcOnly
        ? classGroups.filter((g) => g.userClassName.startsWith('Bc'))
        : classGroups;

  if (epsOnly) {
    console.log(`EPS-only mode: processing ${groups.length} class(es)\n`);
  } else if (hecOnly) {
    console.log(`HEC-only mode: processing ${groups.length} class(es)\n`);
  } else if (bcOnly) {
    console.log(`BC-only mode: processing ${groups.length} class(es)\n`);
  }

  for (const group of groups) {
    await fixClassSubjects(group);
  }
  console.log('\nFix Complete.');
}

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').includes('fix_class_subjects');
if (isDirectRun) {
  runFix().catch(console.error);
}
