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

// Map User Subject Names -> Database Subject Names
const subjectMap: { [key: string]: string | string[] } = {
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
  'Drawing': ['Building Construction Drawing (BCD)', 'ENGINEERING DRAWING'], // Ambiguous, allow either
  'Building Drawing': 'Building Construction Drawing (BCD)',
  'Construction Process': 'Construction process and Building practice (CPB)',
  'Engineering Science': 'ENGINEERING SCIENCE',
  'Industrial Computing': 'INDUSTRIAL COMPUTING',
  'Soil Survey Material': 'Survey, Soil Mechanics and Material ( SMS)',
  'Health and Safety': 'QUALITY HYGINE AND SAFTY ENVIRONMENT', // Assumed mapping based on context

  // AC 3+ Mappings
  'QFA': 'OHADA Finance Accounting (OFA)', // Assumed
  'IFA': 'International  Finance Accounting  (IFA)', // Double space as seen in DB output
  'QFR': 'OHADA Finance Reporting (OFR)', // Assumed
  'Business Mathematics': 'Business Mathematics',
  'Economics': 'Economics',
  'Commerce': 'COMMENCE', // Mapping User 'Commerce' to DB 'COMMENCE'
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
  userClassName: string; // The specific class (e.g. "Ac 1", "Bc 1")
  dbSearchName: string;   // The name to search in DB (e.g. "AC 1", "Form 1 BC")
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

async function verifySubjectsForClass(group: ClassGroup) {
  // 1. Get Class ID
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', group.dbSearchName);

  if (classError || !classes || classes.length === 0) {
    console.error(`❌ Class "${group.userClassName}" (DB: ${group.dbSearchName}) not found`);
    return;
  }

  const classId = classes[0].id;

  // 2. Get assigned subjects
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
    console.error(`Error fetching subjects for ${group.userClassName}:`, subjectsError);
    return;
  }

  const assignedSubjectNamesRaw = classSubjects?.map((cs: any) => cs.subjects?.name) || [];
  
  // 3. Compare
  const missing: string[] = [];
  const extra: string[] = [];

  // Check required
  for (const req of group.subjects) {
    const expectedDBNames = subjectMap[req]; // Can be string or array
    
    let found = false;
    const targets = Array.isArray(expectedDBNames) ? expectedDBNames : [expectedDBNames];
    
    // Fallback: If no map, assume exact match
    if (!expectedDBNames) {
        targets.push(req);
    }

    // Check if ANY of the targets match ANY of the assigned subjects
    for (const target of targets) {
      if (typeof target === 'string' && target) {
        if (assignedSubjectNamesRaw.some((assigned: string) => normalize(assigned) === normalize(target))) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      missing.push(req);
    }
  }

  // Check extra (assigned but not in required list)
  // Reverse check: iterate assigned, see if it maps to any required
  for (const assigned of assignedSubjectNamesRaw) {
    let isRequired = false;
    
    // Check if this assigned subject matches ANY of the required subjects
    for (const req of group.subjects) {
      const expectedDBNames = subjectMap[req];
      const targets = Array.isArray(expectedDBNames) ? expectedDBNames : [expectedDBNames];
      
      if (!expectedDBNames) targets.push(req);

      if (targets.some((t: string) => t && normalize(t) === normalize(assigned))) {
        isRequired = true;
        break;
      }
    }

    // Special Ignore list (Optional: if we want to ignore known system fields if any, but better to report extra)
    if (!isRequired) {
      extra.push(assigned);
    }
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ ${group.userClassName}: All Match`);
  } else {
    console.log(`⚠️  ${group.userClassName}: Discrepancies found`);
    if (missing.length > 0) {
      console.log(`   MISSING: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      console.log(`   EXTRA:   ${extra.join(', ')}`);
    }
  }
}

async function verifyAll() {
  console.log('Starting Subject Verification...\n');
  
  for (const group of classGroups) {
    await verifySubjectsForClass(group);
  }
  
  console.log('\nVerification Complete.');
}

verifyAll().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
