import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { classId } = await params

    // Fetch subjects assigned to this class through teacher assignments
    const { data: assignments, error } = await supabase
      .from('teacher_branch_assignments')
      .select(`
        id,
        is_primary_teacher,
        subject_branches (
          id,
          branch_name,
          branch_code,
          subjects (
            id,
            subject_name,
            subject_code,
            coefficient,
            description
          )
        )
      `)
      .eq('class_id', classId)
      .eq('academic_year', '2024-2025')
      .eq('term', 'Term 1')

    if (error) {
      console.error('Error fetching class subjects:', error)
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
    }

    // Transform the data to match our interface
    const transformedSubjects = assignments?.map((assignment: any) => ({
      id: assignment.subject_branches?.subjects?.id,
      name: assignment.subject_branches?.subjects?.subject_name,
      code: assignment.subject_branches?.subjects?.subject_code,
      coefficient: assignment.subject_branches?.subjects?.coefficient,
      description: assignment.subject_branches?.subjects?.description,
      branch: {
        id: assignment.subject_branches?.id,
        name: assignment.subject_branches?.branch_name,
        code: assignment.subject_branches?.branch_code
      },
      isPrimary: assignment.is_primary_teacher
    })) || []

    // Remove duplicates based on subject ID
    const uniqueSubjects = transformedSubjects.filter((subject, index, self) => 
      index === self.findIndex(s => s.id === subject.id)
    )

    return NextResponse.json({
      success: true,
      subjects: uniqueSubjects
    })

  } catch (error) {
    console.error('Error in class subjects API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
