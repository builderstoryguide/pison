import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export const runtime = 'nodejs'

// Helper function to calculate grade using custom grading system or default
function calculateGrade(
  marksObtained: number, 
  totalMarks: number, 
  gradingSystem?: Array<{ label: string; minPercentage: number; maxPercentage: number }>
): string {
  const percentage = (marksObtained / totalMarks) * 100
  
  // Use custom grading system if provided
  if (gradingSystem && gradingSystem.length > 0) {
    // Sort by minPercentage to ensure correct order
    const sortedGrades = [...gradingSystem].sort((a, b) => a.minPercentage - b.minPercentage)
    
    // Find the grade that matches the percentage
    for (const grade of sortedGrades) {
      // Check if percentage falls within the range (inclusive)
      if (percentage >= grade.minPercentage && percentage <= grade.maxPercentage) {
        return grade.label
      }
    }
    
    // Fallback to default if no match found (shouldn't happen if grading system is valid)
    console.warn(`Percentage ${percentage}% not found in grading system, using default`)
  }
  
  // Default grading system (fallback)
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  if (percentage >= 30) return 'D'
  return 'F'
}

// GET - Retrieve existing marks for an examination/class/subject
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: examinationId } = await params
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subject = searchParams.get('subject')
    const teacherId = searchParams.get('teacherId')

    if (!examinationId) {
      return NextResponse.json(
        { error: 'Examination ID is required' },
        { status: 400 }
      )
    }

    // Verify teacher is authorized (if teacherId provided)
    if (teacherId) {
      // Verify teacher is assigned to the class/subject
      const { data: teacherClass, error: classError } = await supabase
        .from('classes')
        .select('class_teacher_id')
        .eq('id', classId || '')
        .single()

      if (classError || !teacherClass || teacherClass.class_teacher_id !== teacherId) {
        // Also check teacher_subjects
        if (subject) {
          const { data: teacherSubject, error: subjectError } = await supabase
            .from('teacher_subjects')
            .select('teacher_id')
            .eq('teacher_id', teacherId)
            .eq('subject_name', subject)
            .eq('is_active', true)
            .single()

          if (subjectError || !teacherSubject) {
            return NextResponse.json(
              { error: 'Unauthorized: Teacher not assigned to this class/subject' },
              { status: 403 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'Unauthorized: Teacher not assigned to this class' },
            { status: 403 }
          )
        }
      }
    }

    // Build query
    let query = supabase
      .from('exam_results')
      .select('*')
      .eq('examination_id', examinationId)

    if (classId) {
      // Get student IDs for the class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('class', classId)
        .eq('status', 'active')

      if (studentsError) {
        console.error('Error loading students:', serializeSupabaseError(studentsError))
        return NextResponse.json(
          { error: 'Failed to load students', details: serializeSupabaseError(studentsError) },
          { status: 500 }
        )
      }

      const studentIds = (students || []).map((s: any) => s.id)
      if (studentIds.length > 0) {
        query = query.in('student_id', studentIds)
      } else {
        // No students in class, return empty array
        return NextResponse.json({
          success: true,
          marks: [],
        })
      }
    }

    if (subject) {
      query = query.eq('subject', subject)
    }

    const { data: marksData, error: marksError } = await query

    if (marksError) {
      console.error('Error loading exam marks:', serializeSupabaseError(marksError))
      return NextResponse.json(
        { error: 'Failed to load marks', details: serializeSupabaseError(marksError) },
        { status: 500 }
      )
    }

    // Transform data
    const marks = (marksData || []).map((mark: any) => ({
      id: mark.id,
      examinationId: mark.examination_id,
      studentId: mark.student_id,
      studentName: mark.student_name,
      subject: mark.subject,
      marksObtained: parseFloat(mark.marks_obtained),
      totalMarks: mark.total_marks,
      percentage: parseFloat(mark.percentage),
      grade: mark.grade,
      remarks: mark.remarks,
      dateRecorded: mark.date_recorded,
    }))

    return NextResponse.json({
      success: true,
      marks,
    })
  } catch (error) {
    console.error('Error in GET /api/examinations/[id]/marks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Create new exam marks entries
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: examinationId } = await params
    const body = await request.json()
    const { marks, teacherId } = body

    if (!examinationId || !marks || !Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json(
        { error: 'Examination ID and marks array are required' },
        { status: 400 }
      )
    }

    // Verify teacher is authorized
    if (teacherId) {
      // Get first mark to check class/subject
      const firstMark = marks[0]
      
      // Verify teacher is assigned to the class/subject
      if (firstMark.classId) {
        const { data: teacherClass, error: classError } = await supabase
          .from('classes')
          .select('class_teacher_id')
          .eq('id', firstMark.classId)
          .single()

        if (classError || !teacherClass || teacherClass.class_teacher_id !== teacherId) {
          // Check teacher_subjects
          if (firstMark.subject) {
            const { data: teacherSubject, error: subjectError } = await supabase
              .from('teacher_subjects')
              .select('teacher_id')
              .eq('teacher_id', teacherId)
              .eq('subject_name', firstMark.subject)
              .eq('is_active', true)
              .single()

            if (subjectError || !teacherSubject) {
              return NextResponse.json(
                { error: 'Unauthorized: Teacher not assigned to this class/subject' },
                { status: 403 }
              )
            }
          } else {
            return NextResponse.json(
              { error: 'Unauthorized: Teacher not assigned to this class' },
              { status: 403 }
            )
          }
        }
      }
    }

    // Fetch examination to get grading system
    const { data: examination, error: examError } = await supabase
      .from('examinations')
      .select('grading_system')
      .eq('id', examinationId)
      .single()

    if (examError) {
      console.error('Error fetching examination:', examError)
      // Continue with default grading if exam fetch fails
    }

    const gradingSystem = examination?.grading_system as Array<{ label: string; minPercentage: number; maxPercentage: number }> | null

    // Validate marks
    for (const mark of marks) {
      if (mark.marksObtained < 0) {
        return NextResponse.json(
          { error: `Marks cannot be negative for ${mark.studentName}` },
          { status: 400 }
        )
      }
      if (mark.marksObtained > mark.totalMarks) {
        return NextResponse.json(
          { error: `Marks cannot exceed total marks (${mark.totalMarks}) for ${mark.studentName}` },
          { status: 400 }
        )
      }
    }

    // Prepare data for insertion
    const marksData = marks.map((mark: any) => {
      const percentage = (mark.marksObtained / mark.totalMarks) * 100
      const grade = calculateGrade(mark.marksObtained, mark.totalMarks, gradingSystem || undefined)

      return {
        examination_id: examinationId,
        student_id: mark.studentId,
        student_name: mark.studentName,
        subject: mark.subject,
        marks_obtained: mark.marksObtained,
        total_marks: mark.totalMarks,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        grade: grade,
        remarks: mark.remarks || null,
      }
    })

    // Insert marks (use upsert to handle duplicates)
    const { error: insertError } = await supabase
      .from('exam_results')
      .upsert(marksData, {
        onConflict: 'examination_id,student_id,subject',
      })

    if (insertError) {
      console.error('Error saving exam marks:', serializeSupabaseError(insertError))
      return NextResponse.json(
        { error: 'Failed to save marks', details: serializeSupabaseError(insertError) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Marks saved successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/examinations/[id]/marks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing exam marks entries
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PUT uses the same logic as POST (upsert handles both create and update)
  return POST(request, { params })
}

