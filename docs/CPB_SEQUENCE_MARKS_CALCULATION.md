# How Sequence Marks are Calculated for CPB (Construction process and Building practice) with Sub-Branches

## Overview

CPB (Construction process and Building practice) is a subject with **sub-branches**. The calculation of sequence marks for branch subjects works differently from regular subjects.

## Current Implementation

### For Branch Subjects (like CPB)

**Location**: `app/api/admin/reports/student-report/route.ts` (lines 694-727)

**Current Logic**:
1. **Get all branches** for the subject (CPB)
2. **For each branch**:
   - Filter branch grades by `branch_id` and `term`
   - Calculate average marks for that branch (averages ALL assessments in the term)
   - Add to running total
3. **Final calculation**: Average of all branch averages

**Important Limitation**: 
- ❌ **Sequence marks are NOT calculated separately** for branch subjects
- The system takes ALL branch grades for the term and calculates a single term average
- It does NOT group by sequence number (First Sequence, Second Sequence, etc.)

### Code Reference

```typescript
// Lines 694-727 in student-report/route.ts
if (hasSubBranches) {
    // Logic for Sub-branches
    const branches = subBranches?.filter(sb => sb.subject_id === subjectId) || [];
    
    if (branches.length > 0) {
        let sumScaledMarks = 0;
        let countBranchedGraded = 0;

        for (const branch of branches) {
            // Filter by branch_id and term only - NO sequence filtering
            const bGrades = branchGradesData?.filter(bg => {
                const assessment = bg.assessment as any;
                return bg.branch_id === branch.id && 
                    isTargetTerm(assessment?.term || null, assessment?.title || null);
            }) || [];

            if (bGrades.length > 0) {
                // Average marks for this branch (ALL assessments in term)
                const branchAvgRaw = bGrades.reduce((acc, curr) => acc + curr.marks_obtained, 0) / bGrades.length;
                
                // Marks are already out of 20
                const scaledTo20 = branchAvgRaw; 
                
                sumScaledMarks += scaledTo20;
                countBranchedGraded++;
            }
        }

        if (countBranchedGraded > 0) {
            // Average of available branches
            finalMark = sumScaledMarks / countBranchedGraded;
            hasMark = true;
        }
    }
}
```

### For Regular Subjects (without branches)

**Location**: `app/api/admin/reports/student-report/route.ts` (lines 729-900)

**Logic**:
1. Filter grades by subject and term
2. **Group grades by sequence number** (extracted from assessment title)
3. Calculate average for each sequence (seq1, seq2, seq3, etc.)
4. Calculate term average from sequence averages

**Code Reference**:
```typescript
// Lines 821-869
// Group grades by GLOBAL sequence number (1-6)
const gradesBySequence: Record<number, number[]> = {};

for (const grade of sGrades) {
    const assessmentTitle = (grade.assessment as any).title || '';
    // Extract in-term sequence number (1 or 2) based on term
    const inTermSeqNum = extractInTermSequenceNumber(assessmentTitle, currentTermNumber);
    
    if (inTermSeqNum !== null) {
        // Map to global sequence number based on term
        const globalSeqNum = mapToGlobalSequence(inTermSeqNum, currentTermNumber);
        if (!gradesBySequence[globalSeqNum]) {
            gradesBySequence[globalSeqNum] = [];
        }
        gradesBySequence[globalSeqNum].push(grade.marks_obtained);
    }
}

// Calculate average per sequence
const sequenceMarks: Record<string, number | undefined> = {
    seq1: undefined,
    seq2: undefined,
    seq3: undefined,
    seq4: undefined,
    seq5: undefined,
    seq6: undefined
};

for (const seqNumStr of Object.keys(gradesBySequence)) {
    const seqNum = parseInt(seqNumStr, 10);
    const marks = gradesBySequence[seqNum];
    if (marks.length > 0) {
        const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
        if (seqNum >= 1 && seqNum <= 6) {
            sequenceMarks[`seq${seqNum}`] = parseFloat(avg.toFixed(2));
        }
    }
}
```

## How Branch Assessments Store Sequence Information

Branch assessments **DO** have sequence information in their `title` field:

**Location**: `components/teacher/teacher-grades-entry-refactored.tsx` (line 233)

```typescript
title: `${sequenceName}`,  // e.g., "First Sequence", "Second Sequence"
```

The `branch_assessments` table includes:
- `title` - Contains sequence name (e.g., "First Sequence", "Second Sequence")
- `term` - Term information
- `academic_year` - Academic year

## Current Behavior Summary

### What Happens Now:
1. ✅ Teachers create branch assessments with sequence names in the title
2. ✅ Teachers enter grades for each branch assessment
3. ❌ **Report card calculation ignores sequence information**
4. ❌ **All branch grades for the term are averaged together**
5. ❌ **No separate sequence marks (seq1, seq2, etc.) are calculated**

### Example Calculation:

**Scenario**: CPB has 2 branches (Branch A and Branch B)

**Branch A**:
- First Sequence: 15/20
- Second Sequence: 18/20

**Branch B**:
- First Sequence: 16/20
- Second Sequence: 17/20

**Current Implementation** (INCORRECT):
```
Branch A Average = (15 + 18) / 2 = 16.5  (averages sequences within branch)
Branch B Average = (16 + 17) / 2 = 16.5  (averages sequences within branch)
Final CPB Mark = (16.5 + 16.5) / 2 = 16.5  (averages branches)
```

**Correct Calculation Method** (WHAT SHOULD HAPPEN):
```
Step 1: For each sequence, average across all branches
  First Sequence Average = (15 + 16) / 2 = 15.5
    - Branch A: 15
    - Branch B: 16
  
  Second Sequence Average = (18 + 17) / 2 = 17.5
    - Branch A: 18
    - Branch B: 17

Step 2: Average the sequence averages to get final mark
  Final CPB Mark = (15.5 + 17.5) / 2 = 16.5
```

**Key Difference**:
- ❌ Current: Averages sequences within each branch first, then averages branches
- ✅ Correct: Averages branches within each sequence first, then averages sequences

## Weighted Average Consideration

The system also supports **weighted averages** for branches (see `app/api/aggregated-grades/route.ts`), but this is used for the aggregated grades table, not for report card sequence marks.

**Weighted Calculation** (if weights are set):
```typescript
// From aggregated-grades/route.ts
totalWeightedMarks += (averagePercentage * branch.weight_percentage / 100)
totalWeight += branch.weight_percentage
finalPercentage = totalWeight > 0 ? (totalWeightedMarks / totalWeight * 100) : 0
```

## Recommendations

To properly calculate sequence marks for CPB (and other branch subjects), the calculation should follow this **correct method**:

### Correct Calculation Flow:

1. **Group branch grades by sequence number** (extract from `branch_assessments.title`)
2. **For each sequence**:
   - Collect all branch grades for that sequence
   - Calculate average across all branches: `(Branch A mark + Branch B mark + ...) / number of branches`
   - Store as sequence mark (seq1, seq2, etc.)
3. **Calculate term average** from sequence averages: `(seq1 average + seq2 average + ...) / number of sequences`

### Required Code Changes:

Modify the branch subject calculation logic in `student-report/route.ts` (lines 694-727) to:

1. **Parse sequence numbers** from `branch_assessments.title` using `extractInTermSequenceNumber()` (already exists for regular subjects)
2. **Group branch grades by sequence** before calculating averages
3. **For each sequence**:
   - Filter branch grades by sequence number
   - Average marks across all branches for that sequence
   - Store as sequence mark
4. **Calculate term average** from sequence marks (similar to regular subjects)

### Implementation Example:

```typescript
if (hasSubBranches) {
    const branches = subBranches?.filter(sb => sb.subject_id === subjectId) || [];
    
    if (branches.length > 0) {
        // Step 1: Group branch grades by sequence number
        const gradesBySequence: Record<number, number[]> = {};
        
        for (const branch of branches) {
            const bGrades = branchGradesData?.filter(bg => {
                const assessment = bg.assessment as any;
                return bg.branch_id === branch.id && 
                    isTargetTerm(assessment?.term || null, assessment?.title || null);
            }) || [];
            
            // Extract sequence number from assessment title
            for (const grade of bGrades) {
                const assessment = grade.assessment as any;
                const assessmentTitle = assessment?.title || '';
                const inTermSeqNum = extractInTermSequenceNumber(assessmentTitle, currentTermNumber);
                
                if (inTermSeqNum !== null) {
                    const globalSeqNum = mapToGlobalSequence(inTermSeqNum, currentTermNumber);
                    if (!gradesBySequence[globalSeqNum]) {
                        gradesBySequence[globalSeqNum] = [];
                    }
                    gradesBySequence[globalSeqNum].push(grade.marks_obtained);
                }
            }
        }
        
        // Step 2: Calculate average for each sequence (across all branches)
        const sequenceMarks: Record<string, number> = {};
        for (const seqNumStr of Object.keys(gradesBySequence)) {
            const seqNum = parseInt(seqNumStr, 10);
            const marks = gradesBySequence[seqNum];
            if (marks.length > 0) {
                const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
                sequenceMarks[`seq${seqNum}`] = parseFloat(avg.toFixed(2));
            }
        }
        
        // Step 3: Calculate term average from sequence marks
        const availableSeqMarks = Object.values(sequenceMarks);
        if (availableSeqMarks.length > 0) {
            finalMark = availableSeqMarks.reduce((a, b) => a + b, 0) / availableSeqMarks.length;
            hasMark = true;
        }
    }
}
```

## Database Structure

### Relevant Tables:
- `subject_branches` - Defines branches for subjects
- `branch_assessments` - Assessments for each branch (has `title` with sequence name)
- `branch_grades` - Grades for branch assessments
- `student_branch_enrollments` - Which branches students are enrolled in

### Key Fields:
- `branch_assessments.title` - Contains sequence name (e.g., "First Sequence")
- `branch_assessments.term` - Term information
- `branch_grades.marks_obtained` - The actual marks
- `subject_branches.weight_percentage` - Optional weight for each branch
