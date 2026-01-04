const fs = require('fs');
const data = JSON.parse(fs.readFileSync('hec4_debug.json', 'utf8'));

// Mock Logic
function normalizeSubjectName(name) {
    if (!name) return '';
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function subjectNamesMatch(name1, name2) {
    const n1 = normalizeSubjectName(name1);
    const n2 = normalizeSubjectName(name2);
    if (n1 === n2) return true;
    // Basic fuzzy
    if (n1.includes(n2) || n2.includes(n1)) return true;
    return false;
}

function extractGlobalSequenceNumber(title) {
    // Simplified mapping
    if(title.includes('First Sequence')) return 1;
    if(title.includes('Second Sequence')) return 2;
    return null;
}

function getTermFromTitle(title) {
    if (!title) return null;
    const seq = extractGlobalSequenceNumber(title);
    if (seq >= 1 && seq <=2) return 1;
    return null;
}

function isTargetTerm(termStr, title) {
    // Current Term = 1 (Simulated)
    const currentTerm = 1;

    // From Title
    if (title) {
        const t = getTermFromTitle(title);
        if (t !== null && t === currentTerm) return true;
    }
    
    // Fallback?
    // The API says:
    /*
    console.warn(`[Report Card] Could not determine term... Including grade anyway.`);
    return true; 
    */
   
    // If termStr is null and title doesn't match?
    // Wait, the API returns TRUE if title matching fails?
    // Let's check lines 644 in route.ts view 697.
    // "If we can't determine term... include anyway"
    return true;
}


// MAIN CHECK
if (!data.classSubjects || !data.classSubjects[0] || !data.classSubjects[0].name) {
    console.error('Error: Invalid data structure - classSubjects not found');
    process.exit(1);
}
if (!data.gradeSample || !data.gradeSample[0]) {
    console.error('Error: Invalid data structure - gradeSample not found');
    process.exit(1);
}

const subjectName = data.classSubjects[0].name;
const grade = data.gradeSample[0];
const assessment = data.assessments.find(a => a.id === grade.assessment_id);

if (!assessment) {
    console.error('Error: Assessment not found for grade:', grade.assessment_id);
    process.exit(1);
}

console.log('--- Simulation ---');
console.log('Subject Class:', subjectName);
console.log('Assessment Subject:', assessment.subject);
console.log('Assessment Term:', assessment.term); // null
console.log('Assessment Title:', assessment.title); // First Sequence// 1. Subject Match
const match = subjectNamesMatch(assessment.subject, subjectName);
console.log('1. Subject Match:', match);

// 2. Term Match
const termMatch = isTargetTerm(assessment.term, assessment.title);
console.log('2. Term Match:', termMatch);

// 3. Teacher Match (Relaxed)
// We assume checking against map fails, but code returns TRUE.
console.log('3. Teacher Match: (Assumed TRUE via Relaxed Rule)');

if (match && termMatch) {
    console.log('RESULT: Grade SHOULD be visible.');
} else {
    console.log('RESULT: HIDDEN.');
}
