import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  AggregatedGradesResponse,
  AggregatedSubjectGrade
} from '@/lib/subject-branches-types'

// GET /api/aggregated-grades - Get aggregated grades for students
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      // console.log('Database connection failed - returning error response')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed - service unavailable',
          grades: [],
          total: 0,
          message: 'Database service is currently unavailable'
        } as AggregatedGradesResponse,
        { status: 503 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          grades: [],
          total: 0
        } as AggregatedGradesResponse,
        { status: 500 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const subjectId = searchParams.get('subjectId')
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const recalculate = searchParams.get('recalculate') === 'true'

    // Build the query
    let query = supabase
      .from('aggregated_subject_grades')
      .select(`
        *,
        student:students(
          id,
          student_id,
          first_name,
          last_name,
          email
        ),
        subject:subjects(
          id,
          subject_name,
          subject_code
        ),
        class:classes(
          id,
          class_name,
          class_level
        )
      `)

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }
    if (classId) {
      query = query.eq('class_id', classId)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    if (term) {
      query = query.eq('term', term)
    }

    const { data: grades, error } = await query.order('calculated_at', { ascending: false })

    if (error) {
      // console.error('Error fetching aggregated grades:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch aggregated grades',
          grades: [],
          total: 0
        } as AggregatedGradesResponse,
        { status: 500 }
      )
    }

    // If recalculate is requested, recalculate all grades
    if (recalculate) {
      const recalculatedGrades: AggregatedSubjectGrade[] = []
      
      for (const grade of grades || []) {
        const recalculated = await recalculateAggregatedGrade(
          supabase,
          grade.student_id,
          grade.subject_id,
          grade.class_id,
          grade.academic_year,
          grade.term
        )
        
        if (recalculated) {
          recalculatedGrades.push(recalculated)
        }
      }
      
      return NextResponse.json({
        success: true,
        grades: recalculatedGrades,
        total: recalculatedGrades.length
      } as AggregatedGradesResponse)
    }

    return NextResponse.json({
      success: true,
      grades: grades || [],
      total: (grades || []).length
    } as AggregatedGradesResponse)

  } catch (_error) {
    // console.error('Error in aggregated grades API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        grades: [],
        total: 0
      } as AggregatedGradesResponse,
      { status: 500 }
    )
  }
}

// POST /api/aggregated-grades - Calculate aggregated grade for a specific student/subject
export async function POST(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      // console.log('Database connection failed - returning error response')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed - service unavailable',
          message: 'Database service is currently unavailable'
        },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { studentId, subjectId, classId, academicYear, term } = body

    // Validate required fields
    if (!studentId || !subjectId || !classId || !academicYear) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: studentId, subjectId, classId, academicYear'
        },
        { status: 400 }
      )
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_id, first_name, last_name')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student not found'
        },
        { status: 404 }
      )
    }

    // Check if subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, subject_name, subject_code')
      .eq('id', subjectId)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subject not found'
        },
        { status: 404 }
      )
    }

    // Check if class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, class_name, class_level')
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Class not found'
        },
        { status: 404 }
      )
    }

    // Calculate the aggregated grade
    const aggregatedGrade = await recalculateAggregatedGrade(
      supabase,
      studentId,
      subjectId,
      classId,
      academicYear,
      term
    )

    if (!aggregatedGrade) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No enrolled branches found for this student in the specified subject'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      grade: aggregatedGrade,
      message: 'Aggregated grade calculated successfully'
    })

  } catch (_error) {
    // console.error('Error in calculate aggregated grade API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Helper function to recalculate aggregated grade
async function recalculateAggregatedGrade(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  studentId: string,
  subjectId: string,
  classId: string,
  academicYear: string,
  term?: string | null
): Promise<AggregatedSubjectGrade | null> {
  try {
    // Get all enrolled branches for this student in this subject
    const { data: enrolledBranches, error: branchesError } = await supabase
      .from('student_branch_enrollments')
      .select(`
        branch_id,
        subject_branches!inner(
          id,
          branch_name,
          branch_code,
          weight_percentage,
          subject_id
        )
      `)
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('enrollment_status', 'enrolled')
      .eq('subject_branches.subject_id', subjectId)

    if (branchesError || !enrolledBranches || enrolledBranches.length === 0) {
      return null
    }

    // Calculate weighted average across all enrolled branches
    let totalWeightedMarks = 0
    let totalWeight = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branchBreakdown: Record<string, any> = {}

    for (const enrollment of enrolledBranches) {
      const branch = enrollment.subject_branches
      
      // Get average grade for this branch
      const { data: branchGrades, error: gradesError } = await supabase
        .from('branch_grades')
        .select('percentage')
        .eq('student_id', studentId)
        .eq('branch_id', branch.id)

      if (gradesError) {
        // console.error('Error fetching branch grades:', gradesError)
        continue
      }

      const averagePercentage = branchGrades && branchGrades.length > 0
        ? branchGrades.reduce((sum: number, grade: { percentage: number }) => sum + grade.percentage, 0) / branchGrades.length
        : 0

      // Add to weighted total
      totalWeightedMarks += (averagePercentage * branch.weight_percentage / 100)
      totalWeight += branch.weight_percentage

      // Add to branch breakdown
      branchBreakdown[branch.branch_code] = {
        branch_name: branch.branch_name,
        weight_percentage: branch.weight_percentage,
        average_percentage: averagePercentage,
        assessment_count: branchGrades?.length || 0
      }
    }

    // Calculate final percentage
    const finalPercentage = totalWeight > 0 ? (totalWeightedMarks / totalWeight * 100) : 0

    // Determine grade letter and point
    const finalGradeLetter = calculateGradeLetter(finalPercentage)
    const finalGradePoint = calculateGradePoint(finalPercentage)

    // Generate unique grade_id
    const gradeId = `AGG-${studentId}-${subjectId}-${classId}-${academicYear}${term ? `-${term}` : ''}`

    // Upsert the aggregated grade
    const { data: aggregatedGrade, error: upsertError } = await supabase
      .from('aggregated_subject_grades')
      .upsert({
        grade_id: gradeId,
        student_id: studentId,
        subject_id: subjectId,
        class_id: classId,
        total_marks: totalWeightedMarks,
        total_possible_marks: totalWeight,
        final_percentage: finalPercentage,
        final_grade_letter: finalGradeLetter,
        final_grade_point: finalGradePoint,
        branch_breakdown: branchBreakdown,
        academic_year: academicYear,
        term: term || null,
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,subject_id,class_id,academic_year,term'
      })
      .select()
      .single()

    if (upsertError) {
      // console.error('Error upserting aggregated grade:', upsertError)
      return null
    }

    return aggregatedGrade

  } catch (_error) {
    // console.error('Error in recalculateAggregatedGrade:', error)
    return null
  }
}

// Helper function to calculate grade letter
function calculateGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  if (percentage >= 30) return 'D'
  return 'F'
}

// Helper function to calculate grade point
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
