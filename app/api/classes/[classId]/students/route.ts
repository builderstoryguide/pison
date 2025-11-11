import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { classId } = await params
    console.log('🔍 Fetching students for class:', classId)

    // Fetch students enrolled in this class
    const { data: students, error } = await supabase
      .from('student_branch_enrollments')
      .select(`
        id,
        enrollment_status,
        enrolled_at,
        students (
          id,
          student_id,
          first_name,
          last_name,
          email,
          phone,
          parent_name,
          parent_phone,
          parent_email
        )
      `)
      .eq('class_id', classId)
      .eq('enrollment_status', 'enrolled')

    if (error) {
      console.error('Error fetching class students:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch students', 
        details: error.message,
        classId: classId
      }, { status: 500 })
    }

    // Transform the data to match our interface
    const transformedStudents = students?.map((enrollment: any) => ({
      id: enrollment.students?.id,
      studentId: enrollment.students?.student_id,
      firstName: enrollment.students?.first_name,
      lastName: enrollment.students?.last_name,
      email: enrollment.students?.email,
      phone: enrollment.students?.phone,
      photo: null, // Photo column doesn't exist in students table
      enrollmentStatus: enrollment.enrollment_status === 'enrolled' ? 'enrolled' : enrollment.enrollment_status,
      parentName: enrollment.students?.parent_name,
      parentPhone: enrollment.students?.parent_phone,
      parentEmail: enrollment.students?.parent_email
    })).filter((student: any) => student.id) || []

    return NextResponse.json({
      success: true,
      students: transformedStudents
    })

  } catch (error) {
    console.error('Error in class students API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
