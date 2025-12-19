/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser, isAdmin } from '@/lib/auth/server'
import { getAcademicYearFromConfig } from '@/lib/app-config-server'
import { getSequenceName } from '@/lib/report-card-utils'

/**
 * POST /api/admin/manual-marks
 * Allows admins to manually enter/edit sequence marks for students
 * Handles both regular subjects and branch subjects
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser(request)
    if (authError || !user) {
      return authError || NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const isUserAdmin = isAdmin(user)
    if (!isUserAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId, subjectId, classId, sequenceNumber, mark, term, academicYear: providedAcademicYear } = body

    // Validate required fields
    if (!studentId || !subjectId || !classId || !sequenceNumber || mark === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentId, subjectId, classId, sequenceNumber, mark' },
        { status: 400 }
      )
    }

    // Validate mark range
    if (typeof mark !== 'number' || mark < 0 || mark > 20) {
      return NextResponse.json(
        { success: false, error: 'Mark must be a number between 0 and 20' },
        { status: 400 }
      )
    }

    // Validate sequence number
    if (typeof sequenceNumber !== 'number' || sequenceNumber < 1 || sequenceNumber > 6) {
      return NextResponse.json(
        { success: false, error: 'Sequence number must be between 1 and 6' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get academic year (use provided or fetch from config)
    const academicYear = providedAcademicYear || await getAcademicYearFromConfig()

    // Get subject name
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, has_sub_branches')
      .eq('id', subjectId)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    const subjectName = subject.name.trim()
    const sequenceName = getSequenceName(sequenceNumber)

    // Check if subject has branches
    const { data: oldBranches } = await supabase
      .from('subject_sub_branches')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .limit(1)

    const { data: newBranches } = await supabase
      .from('subject_branches')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .limit(1)

    const hasBranches = (oldBranches && oldBranches.length > 0) || (newBranches && newBranches.length > 0)

    if (hasBranches) {
      // Handle branch subject
      return await handleBranchSubjectMark(
        supabase,
        studentId,
        subjectId,
        classId,
        sequenceName,
        mark,
        term,
        academicYear,
        user.id
      )
    } else {
      // Handle regular subject
      return await handleRegularSubjectMark(
        supabase,
        studentId,
        subjectName,
        classId,
        sequenceName,
        mark,
        user.id
      )
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error in POST /api/admin/manual-marks:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle mark entry for regular subjects
 */
async function handleRegularSubjectMark(
  supabase: SupabaseClient,
  studentId: string,
  subjectName: string,
  classId: string,
  sequenceName: string,
  mark: number,
  adminUserId: string
): Promise<NextResponse> {
  // Find or create assessment
  let { data: assessment } = await supabase
    .from('assessments')
    .select('id, total_marks')
    .eq('class_id', classId)
    .eq('subject', subjectName)
    .eq('title', sequenceName)
    .maybeSingle()

  // Case-insensitive fallback
  if (!assessment) {
    const { data: allMatches } = await supabase
      .from('assessments')
      .select('id, subject, total_marks')
      .eq('class_id', classId)
      .eq('title', sequenceName)

    if (allMatches && allMatches.length > 0) {
      const normalizedSubject = subjectName.toLowerCase().trim()
      const match = allMatches.find((a: { subject: string }) =>
        a.subject && a.subject.trim().toLowerCase() === normalizedSubject
      )
      if (match) {
        assessment = match
      }
    }
  }

  // Create assessment if it doesn't exist
  if (!assessment) {
    const { data: newAssessment, error: createError } = await supabase
      .from('assessments')
      .insert({
        title: sequenceName,
        type: 'test',
        subject: subjectName,
        class_id: classId,
        teacher_id: adminUserId, // Admin user ID
        total_marks: 20,
        status: 'published',
        assessment_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating assessment:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to create assessment' },
        { status: 500 }
      )
    }
    assessment = newAssessment
  }

  if (!assessment) {
    return NextResponse.json(
      { success: false, error: 'Failed to find or create assessment' },
      { status: 500 }
    )
  }

  const totalMarks = assessment.total_marks || 20
  const percentage = (mark / totalMarks) * 100
  const gradeLetter = calculateGrade(mark, totalMarks)
  const remarks = calculateRemarks(gradeLetter)

  // Check if grade already exists
  const { data: existingGrade } = await supabase
    .from('grades')
    .select('id')
    .eq('assessment_id', assessment.id)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existingGrade) {
    // Update existing grade
    const { error: updateError } = await supabase
      .from('grades')
      .update({
        marks_obtained: mark,
        percentage: Math.round(percentage * 100) / 100,
        grade_letter: gradeLetter,
        remarks: remarks,
      })
      .eq('id', existingGrade.id)

    if (updateError) {
      console.error('Error updating grade:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update grade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
      gradeId: existingGrade.id,
    })
  } else {
    // Create new grade
    const { data: newGrade, error: insertError } = await supabase
      .from('grades')
      .insert({
        assessment_id: assessment.id,
        student_id: studentId,
        marks_obtained: mark,
        percentage: Math.round(percentage * 100) / 100,
        grade_letter: gradeLetter,
        remarks: remarks,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting grade:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create grade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Grade created successfully',
      gradeId: newGrade.id,
    })
  }
}

/**
 * Handle mark entry for branch subjects
 */
async function handleBranchSubjectMark(
  supabase: SupabaseClient,
  studentId: string,
  subjectId: string,
  classId: string,
  sequenceName: string,
  mark: number,
  term: string | undefined,
  academicYear: string,
  adminUserId: string
): Promise<NextResponse> {
  // Get all active branches for this subject
  const [oldBranchesResult, newBranchesResult] = await Promise.all([
    supabase
      .from('subject_sub_branches')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('is_active', true),
    supabase
      .from('subject_branches')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('is_active', true),
  ])

  const oldBranches = oldBranchesResult.data || []
  const newBranches = newBranchesResult.data || []
  const allBranchIds = [...oldBranches.map((b: { id: string }) => b.id), ...newBranches.map((b: { id: string }) => b.id)]

  if (allBranchIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No active branches found for this subject' },
      { status: 404 }
    )
  }

  // For branch subjects, we need to create/update grades for each branch
  // Find or create branch assessments for each branch
  const gradeResults = []

  for (const branchId of allBranchIds) {
    // Find or create branch assessment
    let { data: branchAssessment } = await supabase
      .from('branch_assessments')
      .select('id, total_marks')
      .eq('branch_id', branchId)
      .eq('class_id', classId)
      .eq('title', sequenceName)
      .eq('academic_year', academicYear)
      .maybeSingle()

    if (!branchAssessment) {
      const insertData = {
        branch_id: branchId,
        class_id: classId,
        title: sequenceName,
        type: 'test',
        total_marks: 20,
        academic_year: academicYear,
        term: term || null,
        teacher_id: adminUserId,
        assessment_date: new Date().toISOString().split('T')[0],
      }

      const { data: newAssessment, error: createError } = await supabase
        .from('branch_assessments')
        .insert(insertData)
        .select()
        .single()

      if (createError) {
        console.error(`Error creating branch assessment for branch ${branchId}:`, createError)
        continue
      }
      branchAssessment = newAssessment
    }

    if (!branchAssessment) {
      console.error(`Failed to find or create assessment for branch ${branchId}`)
      continue
    }

    const totalMarks = branchAssessment.total_marks || 20
    const percentage = (mark / totalMarks) * 100
    const gradeLetter = calculateGrade(mark, totalMarks)
    const remarks = calculateRemarks(gradeLetter)
    const gradePoint = calculateGradePoint(percentage)

    // Check if branch grade already exists
    const { data: existingBranchGrade } = await supabase
      .from('branch_grades')
      .select('id')
      .eq('assessment_id', branchAssessment.id)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existingBranchGrade) {
      // Update existing branch grade
      const updateData = {
        marks_obtained: mark,
        percentage: Math.round(percentage * 100) / 100,
        grade_letter: gradeLetter,
        grade_point: gradePoint,
        remarks: remarks,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('branch_grades')
        .update(updateData)
        .eq('id', existingBranchGrade.id)

      if (!updateError) {
        gradeResults.push({ branchId, success: true, gradeId: existingBranchGrade.id })
      } else {
        console.error(`Error updating branch grade for branch ${branchId}:`, updateError)
      }
    } else {
      // Create new branch grade
      // Generate unique grade_id
      const gradeId = `GRADE-${branchAssessment.id}-${studentId}-${crypto.randomUUID()}`
            const insertData = {
        grade_id: gradeId,
        assessment_id: branchAssessment.id,
        student_id: studentId,
        branch_id: branchId,
        marks_obtained: mark,
        percentage: Math.round(percentage * 100) / 100,
        grade_letter: gradeLetter,
        grade_point: gradePoint,
        remarks: remarks,
        teacher_id: adminUserId,
        academic_year: academicYear,
        term: term || null,
        is_late: false,
        is_absent: false,
        is_excused: false,
        submitted_at: new Date().toISOString(),
      }
      
      const { data: newBranchGrade, error: insertError } = await supabase
        .from('branch_grades')
        .insert(insertData)
        .select()
        .single()

      if (!insertError && newBranchGrade) {
        gradeResults.push({ branchId, success: true, gradeId: newBranchGrade.id })
      } else {
        console.error(`Error inserting branch grade for branch ${branchId}:`, insertError)
      }
    }
  }

  if (gradeResults.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Failed to create/update any branch grades' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Grade created/updated for ${gradeResults.length} branch(es)`,
    gradeResults,
  })
}

/**
 * Calculate grade letter based on mark
 */
function calculateGrade(mark: number, totalMarks: number = 20): string {
  const percentage = (mark / totalMarks) * 100
  if (percentage >= 85) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  if (percentage >= 40) return 'E'
  return 'F'
}

/**
 * Calculate remarks based on grade
 */
function calculateRemarks(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent'
    case 'B': return 'Very Good'
    case 'C': return 'Good'
    case 'D': return 'Pass'
    case 'E': return 'Weak'
    case 'F': return 'Fail'
    default: return ''
  }
}

/**
 * Calculate grade point based on percentage
 */
function calculateGradePoint(percentage: number): number {
  if (percentage >= 90) return 4.0
  if (percentage >= 80) return 3.5
  if (percentage >= 70) return 3.0
  if (percentage >= 60) return 2.5
  if (percentage >= 50) return 2.0
  if (percentage >= 40) return 1.5
  if (percentage >= 30) return 1.0
  return 0.0
}
