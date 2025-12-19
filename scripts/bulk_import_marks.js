const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const CONFIG = {
  csvFilePath: './scripts/marks_data.csv',
  defaultSubjectName: '', 
  
  firstSequence: {
    title: 'First Sequence',
    maxScore: 20,
  },
  
  secondSequence: {
    title: 'Second Sequence',
    maxScore: 20,
  },
};

function parseCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length < 2) throw new Error('Invalid CSV');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      // Split by comma, ignoring commas inside quotes
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
    return data;
  } catch (e) {
    if (e.code === 'ENOENT' && filePath.startsWith('./scripts/')) {
      return parseCSV(filePath.replace('./scripts/', './'));
    }
    throw e;
  }
}

async function findStudentByName(firstName, lastName) {
  const n1 = firstName ? firstName.trim() : '';
  const n2 = lastName ? lastName.trim() : '';
  if (!n1 && !n2) return null;

  let query = supabase
    .from('students')
    .select('id, student_id, first_name, last_name, class, classes(id, name)');

  const orConditions = [];
  if (n1) {
    orConditions.push(`first_name.ilike.%${n1}%`);
    orConditions.push(`last_name.ilike.%${n1}%`);
  }
  if (n2) {
    orConditions.push(`first_name.ilike.%${n2}%`);
    orConditions.push(`last_name.ilike.%${n2}%`);
  }
  if (orConditions.length > 0) query = query.or(orConditions.join(','));

  const { data: candidates, error } = await query.limit(50);
  if (error || !candidates || candidates.length === 0) return null;

  const scoredCandidates = candidates.map(student => {
    const sFN = (student.first_name || '').toLowerCase();
    const sLN = (student.last_name || '').toLowerCase();
    const t1 = n1.toLowerCase();
    const t2 = n2.toLowerCase();
    let score = 0;
    if (t1 && sFN === t1) score += 3;
    if (t1 && sLN === t1) score += 3;
    if (t2 && sFN === t2) score += 3;
    if (t2 && sLN === t2) score += 3;
    if (t1 && (sFN.includes(t1) || sLN.includes(t1))) score += 1;
    if (t2 && (sFN.includes(t2) || sLN.includes(t2))) score += 1;
    const t1Matched = t1 && (sFN.includes(t1) || sLN.includes(t1));
    const t2Matched = t2 && (sFN.includes(t2) || sLN.includes(t2));
    if (t1Matched && t2Matched) score += 5;
    return { student, score };
  });

  const matches = scoredCandidates.filter(m => m.score > 0);
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.score - a.score);
  return matches[0].student;
}

async function getSubject(subjectName) {
  // Try exact match first for best performance/accuracy
  const { data: exact } = await supabase
    .from('subjects')
    .select('id, name, code')
    .eq('name', subjectName)
    .limit(1)
    .single();
    
  if (exact) return exact;

  // Partial match: Replace special chars like () with % to avoid query syntax errors and handle fuzziness
  const sanitized = subjectName.replace(/[()]/g, '%');
  
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, code')
    .or(`name.ilike.%${sanitized}%,code.ilike.%${sanitized}%`)
    .limit(1)
    .single();
    
  if (error || !data) return null;
  return data;
}

async function getOrCreateAssessment(classId, subject, assessmentTitle, maxScore) {
  let query = supabase
    .from('assessments')
    .select('id, title, total_marks')
    .eq('class_id', classId)
    .eq('title', assessmentTitle);

    if (subject.id) {
       query = query.eq('subject_id', subject.id);
    } else {
       query = query.eq('subject', subject.name);
    }
    
  const { data: existing } = await query;
  
  if ((!existing || existing.length === 0) && subject.id) {
      const { data: existingByName } = await supabase
        .from('assessments')
        .select('id, title, total_marks')
        .eq('class_id', classId)
        .eq('title', assessmentTitle)
        .ilike('subject', subject.name);
      if (existingByName && existingByName.length > 0) return existingByName[0];
  } else if (existing && existing.length > 0) {
      return existing[0];
  }

  const payload = {
    class_id: classId,
    title: assessmentTitle,
    subject: subject.name,
    subject_id: subject.id,
    total_marks: maxScore,
    type: 'test',
    assessment_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    status: 'published'
  };

  const { data: newAssessment, error: createError } = await supabase
    .from('assessments')
    .insert(payload)
    .select()
    .single();

  if (createError) {
    console.error('Error creating assessment:', createError.message);
    return null;
  }
  return newAssessment;
}

// Updated with correct columns: marks_obtained, submitted_at, student_name
async function insertGrade(studentId, assessmentId, score, studentName) {
  const { data: existingGrade } = await supabase
    .from('grades')
    .select('id, marks_obtained')
    .eq('student_id', studentId)
    .eq('assessment_id', assessmentId)
    .single();

  const scoreVal = parseFloat(score);

  if (existingGrade) {
    const { error } = await supabase
      .from('grades')
      .update({
        marks_obtained: scoreVal,
        submitted_at: new Date().toISOString(),
        // Update name too just in case
        student_name: studentName
      })
      .eq('id', existingGrade.id);
    if (error) return { success: false, error: error.message };
    return { success: true, action: 'updated', oldScore: existingGrade.marks_obtained };
  }

  const { error } = await supabase
    .from('grades')
    .insert({
      student_id: studentId,
      assessment_id: assessmentId,
      marks_obtained: scoreVal,
      student_name: studentName, // Denormalized name
      submitted_at: new Date().toISOString(),
    });

  if (error) return { success: false, error: error.message };
  return { success: true, action: 'inserted' };
}

async function main() {
  console.log('=== Bulk Import Marks ===\n');

  let csvData;
  try {
    csvData = parseCSV(CONFIG.csvFilePath);
    console.log(`Read ${csvData.length} rows.`);
  } catch (e) {
    console.error('Error reading CSV:', e.message);
    return;
  }

  const results = {
    processed: 0,
    success: 0,
    failures: []
  };

  for (const row of csvData) {
    results.processed++;
    let firstName = row.first_name || row.firstname || '';
    let lastName = row.last_name || row.lastname || '';
    
    // Support single 'name' column
    if (!firstName && !lastName && row.name) {
        const parts = row.name.trim().split(/\s+/);
        if (parts.length > 0) firstName = parts[0];
        if (parts.length > 1) lastName = parts.slice(1).join(' ');
    }
    
    let subjectName = row.subject || CONFIG.defaultSubjectName;
    
    if (!subjectName) {
      console.log(`SKIP: No subject for ${firstName} ${lastName}`);
      continue;
    }

    const student = await findStudentByName(firstName, lastName);
    if (!student) {
      console.log(`❌ Student NOT FOUND: ${firstName} ${lastName}`);
      results.failures.push(`${firstName} ${lastName} (Student not found)`);
      continue;
    }

    const classId = student.class;
    if (!classId) {
      console.log(`❌ Student ${firstName} ${lastName} has no CLASS.`);
      results.failures.push(`${firstName} ${lastName} (No class)`);
      continue;
    }
    const className = student.classes?.name || 'Unknown Class';

    const subject = await getSubject(subjectName);
    if (!subject) {
      console.log(`❌ Subject NOT FOUND: ${subjectName}`);
      results.failures.push(`${firstName} ${lastName} (Subject not found)`);
      continue;
    }

    const seqs = [
        { label: 'First Sequence', config: CONFIG.firstSequence, col: ['first_sequence', 'first sequence', '1st_sequence'] },
        { label: 'Second Sequence', config: CONFIG.secondSequence, col: ['second_sequence', 'second sequence', '2nd_sequence'] }
    ];

    for (const seq of seqs) {
        let score = undefined;
        for (const c of seq.col) {
            if (row[c] !== undefined) { score = row[c]; break; }
        }
        
        if (score === undefined || score === '' || score === null) continue;

        const assessment = await getOrCreateAssessment(classId, subject, seq.config.title, seq.config.maxScore);
        
        if (!assessment) {
            console.log(`❌ Failed assessment creation for ${className} - ${subject.name} - ${seq.label}`);
            continue;
        }

        const res = await insertGrade(student.id, assessment.id, score, `${student.first_name} ${student.last_name}`);
        if (res.success) {
            console.log(`✓ ${firstName} ${lastName} [${className}] - ${seq.label}: ${score}/${seq.config.maxScore} (${res.action})`);
            results.success++;
        } else {
            console.error(`❌ Grade Error: ${res.error}`);
            results.failures.push(`${firstName} ${lastName} (Grade error)`);
        }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Processed: ${results.processed}`);
  console.log(`Successes: ${results.success}`);
  console.log(`Failures: ${results.failures.length}`);
  if (results.failures.length > 0) {
      console.log('Failure details:');
      results.failures.forEach(f => console.log(` - ${f}`));
  }
}

main().catch(console.error);
