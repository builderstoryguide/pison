import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  CreateBranchAssessmentRequest,
  BranchAssessmentsResponse,
  BranchAssessmentWithDetails 
} from '@/lib/subject-branches-types'

// GET /api/branch-assessments - List branch assessments
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          assessments: [],
          total: 0
        } as BranchAssessmentsResponse,
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          assessments: [],
          total: 0
        } as BranchAssessmentsResponse,
        { status: 500 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const teacherId = searchParams.get('teacherId')
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build the query
    let query = supabase
      .from('branch_assessments')
      .select(`
        *,
        branch:subject_branches(
          id,
          branch_name,
          branch_code,
          subject_id
        ),
        subject:subject_branches!inner(
          subject_id,
          subjects:subject_id(
            id,
            subject_name,
            subject_code
          )
        ),
        teacher:teachers(
          id,
          teacher_id,
          first_name,
          last_name
        ),
        class:classes(
          id,
          class_name,
          class_level
        )
      `)

    // Apply filters
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    if (teacherId) {
      query = query.eq('teacher_id', teacherId)
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
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('type', type)
    }

    const { data: assessments, error } = await query.order('assessment_date', { ascending: false })

    if (error) {
      console.error('Error fetching branch assessments:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch branch assessments',
          assessments: [],
          total: 0
        } as BranchAssessmentsResponse,
        { status: 500 }
      )
    }

    // Get additional details for each assessment
    const assessmentsWithDetails: BranchAssessmentWithDetails[] = []
    
    for (const assessment of assessments || []) {
      // Get grades count and average
      const { data: grades } = await supabase
        .from('branch_grades')
        .select('percentage')
        .eq('assessment_id', assessment.id)

      const gradesCount = grades?.length || 0
      const averageGrade = grades && grades.length > 0
        ? grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length
        : null

      assessmentsWithDetails.push({
        ...assessment,
        branch: {
          id: assessment.branch.id,
          branch_name: assessment.branch.branch_name,
          branch_code: assessment.branch.branch_code,
          subject_id: assessment.branch.subject_id
        },
        subject: {
          id: assessment.subject.subjects.id,
          subject_name: assessment.subject.subjects.subject_name,
          subject_code: assessment.subject.subjects.subject_code
        },
        teacher: {
          id: assessment.teacher.id,
          teacher_id: assessment.teacher.teacher_id,
          first_name: assessment.teacher.first_name,
          last_name: assessment.teacher.last_name
        },
        class: {
          id: assessment.class.id,
          class_name: assessment.class.class_name,
          class_level: assessment.class.class_level
        },
        grades_count: gradesCount,
        average_grade: averageGrade
      })
    }

    return NextResponse.json({
      success: true,
      assessments: assessmentsWithDetails,
      total: assessmentsWithDetails.length
    } as BranchAssessmentsResponse)

  } catch (error) {
    console.error('Error in branch assessments API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        assessments: [],
        total: 0
      } as BranchAssessmentsResponse,
      { status: 500 }
    )
  }
}

// POST /api/branch-assessments - Create a new branch assessment
export async function POST(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed'
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

    const body: CreateBranchAssessmentRequest = await request.json()

    // Validate required fields
    if (!body.branch_id || !body.teacher_id || !body.class_id || !body.title || !body.academic_year) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: branch_id, teacher_id, class_id, title, academic_year'
        },
        { status: 400 }
      )
    }

    // Validate assessment type
    const validTypes = ['quiz', 'test', 'exam', 'assignment', 'project', 'practical']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid assessment type. Must be one of: ${validTypes.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Validate marks
    if (body.total_marks <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Total marks must be greater than 0'
        },
        { status: 400 }
      )
    }

    // Check if branch exists
    const { data: branch, error: branchError } = await supabase
      .from('subject_branches')
      .select('id, branch_name, branch_code, subject_id')
      .eq('id', body.branch_id)
      .single()

    if (branchError || !branch) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subject branch not found'
        },
        { status: 404 }
      )
    }

    // Check if teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, teacher_id, first_name, last_name')
      .eq('id', body.teacher_id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher not found'
        },
        { status: 404 }
      )
    }

    // Check if class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, class_name, class_level')
      .eq('id', body.class_id)
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

    // Check if teacher is assigned to this branch
    const { data: teacherAssignment } = await supabase
      .from('teacher_branch_assignments')
      .select('id')
      .eq('teacher_id', body.teacher_id)
      .eq('branch_id', body.branch_id)
      .eq('class_id', body.class_id)
      .eq('academic_year', body.academic_year)
      .eq('term', body.term || null)
      .single()

    if (!teacherAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher is not assigned to this branch for the specified class, academic year, and term'
        },
        { status: 403 }
      )
    }

    // Generate unique assessment_id
    const assessmentId = `ASS-${body.branch_id.substring(0, 8)}-${Date.now()}`

    // Create the assessment
    const { data: newAssessment, error: createError } = await supabase
      .from('branch_assessments')
      .insert({
        assessment_id: assessmentId,
        branch_id: body.branch_id,
        teacher_id: body.teacher_id,
        class_id: body.class_id,
        title: body.title,
        description: body.description || null,
        type: body.type,
        total_marks: body.total_marks,
        passing_marks: body.passing_marks || 50.0,
        weight_percentage: body.weight_percentage || 100.0,
        assessment_date: body.assessment_date,
        due_date: body.due_date || null,
        academic_year: body.academic_year,
        term: body.term || null,
        status: 'draft'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating branch assessment:', createError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create branch assessment'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assessment: newAssessment,
      message: 'Branch assessment created successfully'
    })

  } catch (error) {
    console.error('Error in create branch assessment API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
