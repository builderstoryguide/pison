import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    // Await params first to catch any errors early
    const { classId } = await params
    
    // Get teacherId from query params
    const searchParams = request.nextUrl.searchParams
    const teacherId = searchParams.get('teacherId')
    
    if (!classId) {
      return NextResponse.json({ 
        success: false,
        error: 'Class ID is required',
        subjects: []
      }, { status: 400 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: 'Database connection failed',
        subjects: []
      }, { status: 500 })
    }

    const allSubjectsMap = new Map<string, any>()

    // 1. Fetch ALL subjects for this class (Base set)
    const { data: classSubjects, error: classSubjectsError } = await supabase
      .from('class_subjects')
      .select(`
        id,
        subject_id,
        subjects!inner (
          id,
          name,
          code,
          coefficient
        )
      `)
      .eq('class_id', classId)

    if (classSubjectsError) {
      throw new Error(`Failed to fetch class subjects: ${classSubjectsError.message}`)
    }

    // Process class subjects into a map
    const classSubjectsMap = new Map<string, any>()
    if (classSubjects) {
      classSubjects.forEach((cs: any) => {
        if (cs.subjects) {
          classSubjectsMap.set(cs.subjects.id, {
            id: cs.subjects.id,
            name: cs.subjects.name || 'Unknown Subject',
            code: cs.subjects.code || '',
            coefficient: cs.subjects.coefficient ? parseFloat(cs.subjects.coefficient) : 1.0
          })
        }
      })
    }

    // 2. If NO teacherId (Admin view), return all class subjects
    if (!teacherId) {
      return NextResponse.json({
        success: true,
        subjects: Array.from(classSubjectsMap.values())
      })
    }

    // 3. If teacherId IS present, fetch teacher's assigned subjects (Global assignment)
    const { data: teacherSubjects, error: teacherSubjectsError } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (teacherSubjectsError) {
      throw new Error(`Failed to fetch teacher subjects: ${teacherSubjectsError.message}`)
    }

    // Create set of allowed subject IDs
    const allowedSubjectIds = new Set(teacherSubjects?.map(ts => ts.subject_id) || [])

    // 4. Intersect: Add class subjects ONLY if they are in allowedSubjectIds
    classSubjectsMap.forEach((subject, subjectId) => {
      if (allowedSubjectIds.has(subjectId)) {
        allSubjectsMap.set(subjectId, subject)
      }
    })

    // 5. Fetch Branch Assignments (Explicitly assigned to this teacher for this class)
    // These are added regardless of the intersection above (union)
    try {
      const { data: branchAssignments, error: branchError } = await supabase
        .from('teacher_branch_assignments')
        .select(`
          id,
          branch_id,
          subject_branches (
            id,
            branch_name,
            branch_code,
            weight_percentage,
            subjects (
              id,
              subject_name,
              subject_code,
              coefficient
            )
          )
        `)
        .eq('class_id', classId)
        .eq('teacher_id', teacherId)

      if (!branchError && branchAssignments) {
        branchAssignments.forEach((ba: any) => {
          const branch = ba.subject_branches
          if (branch) {
            allSubjectsMap.set(branch.id, {
              id: branch.id,
              name: `${branch.subjects?.subject_name} - ${branch.branch_name}`,
              code: branch.branch_code || branch.subjects?.subject_code || '',
              coefficient: branch.subjects?.coefficient ? parseFloat(branch.subjects.coefficient) : 1.0,
              type: 'branch',
              maxMarks: 20, // Sub-branches are marked out of 20
              parentId: branch.subjects?.id
            })
          }
        })
      }
    } catch (err) {
      console.warn('Error fetching from teacher_branch_assignments:', err)
    }

    const subjects = Array.from(allSubjectsMap.values())

    return NextResponse.json({
      success: true,
      subjects: subjects
    })

  } catch (error) {
    console.error('Error in class subjects API:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      subjects: []
    }, { status: 500 })
  }
}
