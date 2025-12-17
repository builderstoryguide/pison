import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map User Subject Names -> Database Subject Names (Target Names)
// These are the names we WANT to insert if missing.
const subjectMap: { [key: string]: string } = {
  'French Language': 'French Language',
  'English Language': 'ENGLISH LANGUAGE (ENG LAN)',
  'Mathematics': 'MATHEMATICS',
  'Computer Aided Management': 'Computer Aided Management (CAM)',
  'Introduction to Marketing': 'Introduction to Marketing',
  'Accounting': 'ACCOUNTING',
  'Office Practice': 'OFFICE PRACTICE',
  'Citizenship': 'Citizenship (CTZ)',
  'Physical Education': 'Physical Education (PE)',
  'Manual Labour': 'Manual Labour (LB)',
  
  // BC Mapping
  'Drawing': 'Building Construction Drawing (BCD)', // Defaulting to BCD for BC classes
  'Building Drawing': 'Building Construction Drawing (BCD)',
  'Construction Process': 'Construction process and Building practice (CPB)',
  'Engineering Science': 'ENGINEERING SCIENCE',
  'Industrial Computing': 'INDUSTRIAL COMPUTING',
  'Soil Survey Material': 'Survey, Soil Mechanics and Material ( SMS)',
  'Health and Safety': 'QUALITY HYGINE AND SAFTY ENVIRONMENT',

  // AC 3+ Mappings
  'QFA': 'OHADA Finance Accounting (OFA)', 
  'IFA': 'International  Finance Accounting  (IFA)', 
  'QFR': 'OHADA Finance Reporting (OFR)', 
  'Business Mathematics': 'Business Mathematics',
  'Economics': 'Economics',
  'Commerce': 'COMMENCE',
  'Entrepreneurship': 'Entrepreneurship',
  'Law and Government': 'Law and government (LG)',

  // HEC Mappings
  'Natural Science': 'Natural Science',
  'Family Life': 'Family Life Education and Gerontology (FLEG)',
  'Food and Nutrition': 'Food, Nutrition and Health (FNH)',
  'Resource Management': 'Resource Management on Home Studies (RMHS)',

  // EPS Mappings
  'Engineering Drawing': 'ENGINEERING DRAWING',
  'Electrical Technology': 'Electrical Technology and Diagrams (ETD)',
  'Electrical Circuit': 'Electrical and Electronic Circuit (EEC)',
  'Electric Machine': 'Electrical Machines (EM)',
};

type ClassGroup = {
  userClassName: string;
  dbSearchName: string;
  subjects: string[];
};

const classGroups: ClassGroup[] = [
  // AC
  { userClassName: 'Ac 1', dbSearchName: 'AC 1', subjects: ['French Language', 'English Language', 'Mathematics', 'Computer Aided Management', 'Introduction to Marketing', 'Accounting', 'Office Practice', 'Citizenship', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Ac 2', dbSearchName: 'AC 2', subjects: ['French Language', 'English Language', 'Mathematics', 'Computer Aided Management', 'Introduction to Marketing', 'Accounting', 'Office Practice', 'Citizenship', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Ac 3', dbSearchName: 'AC 3', subjects: ['French Language', 'English Language', 'Mathematics', 'QFA', 'IFA', 'QFR', 'Business Mathematics', 'Economics', 'Commerce', 'Entrepreneurship', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Ac 4', dbSearchName: 'AC 4', subjects: ['French Language', 'English Language', 'Mathematics', 'QFA', 'IFA', 'QFR', 'Business Mathematics', 'Economics', 'Commerce', 'Entrepreneurship', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Ac 5', dbSearchName: 'AC 5', subjects: ['French Language', 'English Language', 'Mathematics', 'QFA', 'IFA', 'QFR', 'Business Mathematics', 'Economics', 'Commerce', 'Entrepreneurship', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },

  // BC
  { userClassName: 'Bc 1', dbSearchName: 'Form 1 BC', subjects: ['Drawing', 'Construction Process', 'French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Industrial Computing', 'Citizenship', 'Physical Education', 'Manual Labour', 'Soil Survey Material', 'Health and Safety'] },
  { userClassName: 'Bc 2', dbSearchName: 'Form 2 BC', subjects: ['Drawing', 'Construction Process', 'French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Industrial Computing', 'Citizenship', 'Physical Education', 'Manual Labour', 'Soil Survey Material', 'Health and Safety'] },
  { userClassName: 'Bc 3', dbSearchName: 'Form 3 BC', subjects: ['Building Drawing', 'Construction Process', 'Soil Survey Material', 'Mathematics', 'Health and Safety', 'Industrial Computing', 'Engineering Science', 'French Language', 'English Language', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Bc 4', dbSearchName: 'Form 4 BC', subjects: ['Building Drawing', 'Construction Process', 'Soil Survey Material', 'Mathematics', 'Health and Safety', 'Industrial Computing', 'Engineering Science', 'French Language', 'English Language', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Bc 5', dbSearchName: 'Form 5 BC', subjects: ['Building Drawing', 'Construction Process', 'Soil Survey Material', 'Mathematics', 'Health and Safety', 'Industrial Computing', 'Engineering Science', 'French Language', 'English Language', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },

  // HEC
  { userClassName: 'Hec 1', dbSearchName: 'HEC 1', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Family Life', 'Food and Nutrition', 'Resource Management', 'Citizenship', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 2', dbSearchName: 'HEC 2', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Family Life', 'Food and Nutrition', 'Resource Management', 'Citizenship', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 3', dbSearchName: 'HEC 3', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Business Mathematics', 'Entrepreneurship', 'Family Life', 'Resource Management', 'Food and Nutrition', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 4', dbSearchName: 'HEC 4', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Business Mathematics', 'Entrepreneurship', 'Family Life', 'Resource Management', 'Food and Nutrition', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 5', dbSearchName: 'HEC 5', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Business Mathematics', 'Entrepreneurship', 'Family Life', 'Resource Management', 'Food and Nutrition', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },

  // EPS
  { userClassName: 'EPS 1', dbSearchName: 'form 1 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Electrical Technology', 'Industrial Computing', 'Citizenship', 'Manual Labour', 'Physical Education'] },
  { userClassName: 'EPS 2', dbSearchName: 'Form 2 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Electrical Technology', 'Industrial Computing', 'Citizenship', 'Manual Labour', 'Physical Education'] },
  { userClassName: 'EPS 3', dbSearchName: 'FORM 3 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Industrial Computing', 'Electrical Circuit', 'Electrical Technology', 'Electric Machine', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'EPS 4', dbSearchName: 'form 4 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Industrial Computing', 'Electrical Circuit', 'Electrical Technology', 'Electric Machine', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'EPS 5', dbSearchName: 'Form 5 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Industrial Computing', 'Electrical Circuit', 'Electrical Technology', 'Electric Machine', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
];

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

  const requiredSubjectNames = group.subjects.map(shortName => subjectMap[shortName] || shortName);

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

  // Find Extras (Check if assigned is NOT in required list)
  for (const assigned of assignedSubjects) {
     const isRequired = requiredSubjectNames.some(
        req => normalize(req) === normalize(assigned.name)
     );
     if (!isRequired) {
       console.log(`   Running deletion for Extra: ${assigned.name}`);
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
  for (const group of classGroups) {
    await fixClassSubjects(group);
  }
  console.log('\nFix Complete.');
}

runFix().catch(console.error);
