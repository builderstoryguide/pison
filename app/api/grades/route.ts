/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const sequenceId = searchParams.get('sequenceId')
    const examinationName = searchParams.get('examinationName')

    if (!classId || !subjectId || (!sequenceId && !examinationName)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Get Subject Name
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subjectId)
      .single()
    
    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    const subjectName = subject.name?.trim() ?? ''
    // 2. Determine Title
    let title = examinationName
    if (!title && sequenceId) {
        const SEQUENCE_NAMES: Record<string, string> = {
            "seq1": "First Sequence",
            "seq2": "Second Sequence",
            "seq3": "Third Sequence",
            "seq4": "Fourth Sequence",
            "seq5": "Fifth Sequence",
            "seq6": "Sixth Sequence",
        }
        title = SEQUENCE_NAMES[sequenceId] || sequenceId
    }

    // 3. Find Assessment
    let { data: assessment } = await supabase
      .from('assessments')
      .select('id')
      .eq('class_id', classId)
      .eq('subject', subjectName)
      .eq('title', title)
      .maybeSingle()
    
    // Case-insensitive fallback
    if (!assessment) {
      const { data: allMatches } = await supabase
        .from('assessments')
        .select('id, subject')
        .eq('class_id', classId)
        .eq('title', title)
      
      if (allMatches && allMatches.length > 0) {
        const normalizedNew = subjectName.toLowerCase().trim();
        const match = allMatches.find(a => 
          a.subject && a.subject.trim().toLowerCase() === normalizedNew
        );
        if (match) {
          assessment = match;
        }
      }
    }

    if (!assessment) {
      // No assessment means no grades
      return NextResponse.json({ grades: [] })
    }

    // 4. Fetch Grades
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('student_id, marks_obtained, remarks')
      .eq('assessment_id', assessment!.id)

    if (gradesError) {
      throw gradesError
    }

    // Format for frontend
    const formattedGrades = grades.map(g => ({
        studentId: g.student_id,
        mark: g.marks_obtained,
        remarks: g.remarks
    }))

    return NextResponse.json({ grades: formattedGrades })

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Error in GET /api/grades:", error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, subjectId, sequenceId, examinationName, grades, teacherId } = body

    if (!classId || !subjectId || (!sequenceId && !examinationName) || !grades || !teacherId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        { error: 'Grades must be a non-empty array' },
        { status: 400 }
      )
    }

    for (const g of grades) {
      if (!g.studentId || typeof g.marks !== 'number' || g.marks < 0 || g.marks > 20) {
        return NextResponse.json(
          { error: 'Invalid grade entry: each must have studentId and marks (0-20)' },
          { status: 400 }
        )
      }
    }
    const supabase = await createClient()

    // 1. Get Subject Name
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subjectId)
      .single()
    
    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Normalize subject name: trim whitespace to ensure consistency
    const subjectName = subject.name.trim()

    // 2. Determine Title (Sequence Name)
    // ClassGradeEntry sends 'sequenceId' (e.g. 'seq1'). TeacherGradesEntry sends 'examinationName'.
    let title = examinationName
    if (!title && sequenceId) {
        const SEQUENCE_NAMES: Record<string, string> = {
            "seq1": "First Sequence",
            "seq2": "Second Sequence",
            "seq3": "Third Sequence",
            "seq4": "Fourth Sequence",
            "seq5": "Fifth Sequence",
            "seq6": "Sixth Sequence",
        }
        title = SEQUENCE_NAMES[sequenceId] || sequenceId
    }

    // 3. Find or Create Assessment
    // We check for an existing assessment with same class, subject, title (sequence), and teacher
    // Note: In some systems, multiple teachers might grade the same class/subject. 
    // For now, we'll assume if it exists for this class/subject/title, we use it, 
    // REGARDLESS of teacher (to allow multiple teachers to edit same assessment if needed, 
    // or just use the first creator). 
    // But strictly adhering to schema: teacher_id is required.
    
    // Search for existing assessment
    // First try exact match (most common case)
    let { data: assessment } = await supabase
      .from('assessments')
      .select('id, subject')
      .eq('class_id', classId)
      .eq('subject', subjectName)
      .eq('title', title)
      .maybeSingle()
    
    // If not found with exact match, try case-insensitive search
    // (in case there are legacy assessments with different casing)
    if (!assessment) {
      const { data: allMatches } = await supabase
        .from('assessments')
        .select('id, subject')
        .eq('class_id', classId)
        .eq('title', title)
      
      if (allMatches && allMatches.length > 0) {
        // Find case-insensitive match
        const normalizedNew = subjectName.toLowerCase().trim();
        const match = allMatches.find(a => 
          a.subject && a.subject.trim().toLowerCase() === normalizedNew
        );
        if (match) {
          assessment = match;
        }
      }
    }

    if (!assessment) {
       const { data: newAssessment, error: createError } = await supabase
         .from('assessments')
         .insert({
           title: title,
           type: 'test', // Changed from 'sequence_grade' to 'test' which is allowed by CHECK constraint
           subject: subjectName, // Storing Name as per schema
           class_id: classId,
           teacher_id: teacherId,
           total_marks: 20,
           status: 'published',
           assessment_date: new Date().toISOString().split('T')[0], // Convert to DATE format (YYYY-MM-DD)
         })
         .select()
         .single()
       
       if (createError) {
           console.error("Error creating assessment:", createError)
           return NextResponse.json({ error: "Failed to create assessment record" }, { status: 500 })
       }
       assessment = newAssessment
    }

    // 4. Prepare Grades
    // We'll use a transaction-like approach: Upsert.
    // The 'grades' table might not have a unique constraint on (assessment_id, student_id).
    // To be safe, we check if we should delete existing or just insert.
    // Since we don't know the schema constraint for sure, we'll try to DELETE existing grades 
    // for these students in this assessment first, then INSERT.
    
    const studentIds = grades.map((g: { studentId: string }) => g.studentId)
    
    // Delete existing grades for these students in this assessment
    if (studentIds.length > 0) {
        await supabase
            .from('grades')
            .delete()
            .eq('assessment_id', assessment!.id)
            .in('student_id', studentIds)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gradesToInsert = grades.map((g: any) => ({
      assessment_id: assessment!.id,
      student_id: g.studentId,
      marks_obtained: g.marks, // Raw mark
      percentage: (g.marks / 20) * 100,
      grade_letter: g.grade || calculateGrade(g.marks),
      remarks: g.remarks || calculateRemarks(g.grade || calculateGrade(g.marks)),
      submitted_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('grades')
      .insert(gradesToInsert)

    if (insertError) {
        console.error("Error inserting grades:", insertError)
        throw insertError
    }

    return NextResponse.json({ success: true, assessmentId: assessment!.id })

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Error in POST /api/grades:", error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

function calculateGrade(mark: number) {
    if (mark >= 17) return 'A'
    if (mark >= 14) return 'B'
    if (mark >= 10) return 'C'
    if (mark >= 7) return 'D'
    return 'U'
}

function calculateRemarks(grade: string) {
    switch (grade) {
      case 'A': return 'Excellent'
      case 'B': return 'Very Good'
      case 'C': return 'Pass'
      case 'D': return 'Failed'
      case 'U': return 'Very Weak'
      default: return ''
    }
}

