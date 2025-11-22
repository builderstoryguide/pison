import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    // Await params first to catch any errors early
    const { classId } = await params
    
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

    // Try multiple methods to fetch subjects for this class
    let subjects: any[] = []

    // Method 1: Fetch from class_subjects junction table
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

    if (!classSubjectsError && classSubjects && classSubjects.length > 0) {
      subjects = classSubjects.map((cs: any) => ({
        id: cs.subjects?.id || cs.subject_id,
        name: cs.subjects?.name || 'Unknown Subject',
        code: cs.subjects?.code || '',
        coefficient: cs.subjects?.coefficient ? parseFloat(cs.subjects.coefficient) : 1.0
      }))
    }

    // Method 2: If no subjects from class_subjects, try teacher_subject_assignments
    if (subjects.length === 0) {
      const { data: teacherAssignments, error: assignmentsError } = await supabase
        .from('teacher_subject_assignments')
        .select(`
          id,
          subject_id,
          subjects:subject_id (
            id,
            subject_name,
            subject_code,
            coefficient
          )
        `)
        .eq('class_id', classId)

      if (!assignmentsError && teacherAssignments && teacherAssignments.length > 0) {
        const uniqueSubjectIds = new Set<string>()
        subjects = teacherAssignments
          .filter((ta: any) => {
            const subjectId = ta.subjects?.id || ta.subject_id
            if (!subjectId || uniqueSubjectIds.has(subjectId)) return false
            uniqueSubjectIds.add(subjectId)
            return true
          })
          .map((ta: any) => ({
            id: ta.subjects?.id || ta.subject_id,
            name: ta.subjects?.subject_name || 'Unknown Subject',
            code: ta.subjects?.subject_code || '',
            coefficient: ta.subjects?.coefficient ? parseFloat(ta.subjects.coefficient) : 1.0
          }))
      }
    }

    // Method 3: Fallback to teacher_branch_assignments (if table exists)
    if (subjects.length === 0) {
      try {
        const { data: branchAssignments, error: branchError } = await supabase
          .from('teacher_branch_assignments')
          .select(`
            id,
            subject_branches (
              subjects (
                id,
                subject_name,
                subject_code,
                coefficient
              )
            )
          `)
          .eq('class_id', classId)

        if (!branchError && branchAssignments && branchAssignments.length > 0) {
          const uniqueSubjectIds = new Set<string>()
          subjects = branchAssignments
            .map((ba: any) => ba.subject_branches?.subjects)
            .filter((s: any) => s && s.id && !uniqueSubjectIds.has(s.id))
            .map((s: any) => {
              uniqueSubjectIds.add(s.id)
              return {
                id: s.id,
                name: s.subject_name || 'Unknown Subject',
                code: s.subject_code || '',
                coefficient: s.coefficient ? parseFloat(s.coefficient) : 1.0
              }
            })
        }
      } catch (err) {
        // Table doesn't exist, ignore this method
        console.warn('teacher_branch_assignments table not available:', err)
      }
    }

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
