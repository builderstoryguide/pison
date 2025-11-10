import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          classes: []
        },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          classes: []
        },
        { status: 500 }
      )
    }

    // Get teacher ID from query parameters or auth
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher ID is required',
          classes: []
        },
        { status: 400 }
      )
    }

    // Fetch teacher's assigned classes with subject assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('teacher_subject_assignments')
      .select(`
        id,
        teacher_id,
        subject_id,
        class_id,
        academic_year,
        term,
        created_at,
        classes:class_id(
          id,
          class_name,
          class_level,
          stream,
          subsystem,
          academic_year,
          capacity,
          current_enrollment,
          status,
          created_at,
          updated_at
        ),
        subjects:subject_id(
          id,
          subject_name,
          subject_code,
          subsystem,
          description
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('classes.status', 'active')

    if (assignmentsError) {
      console.error('Error fetching teacher assignments:', assignmentsError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch teacher assignments',
          classes: []
        },
        { status: 500 }
      )
    }

    // Group assignments by class and create class structure
    const classMap = new Map()
    
    assignments?.forEach(assignment => {
      const classData = assignment.classes as any
      const subjectData = assignment.subjects as any
      
      if (!classData) return

      const classId = classData.id
      
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          id: classData.id,
          name: classData.class_name,
          level: classData.class_level,
          subsystem: classData.subsystem,
          branch: classData.stream || 'grammar',
          academicYear: classData.academic_year,
          capacity: classData.capacity,
          currentEnrollment: classData.current_enrollment,
          status: classData.status,
          subjects: [],
          students: [], // Will be populated separately
          schedule: [] // Will be populated from timetable
        })
      }

      // Add subject to class
      if (subjectData) {
        const existingSubject = classMap.get(classId).subjects.find(
          (s: any) => s.id === subjectData.id
        )
        
        if (!existingSubject) {
          classMap.get(classId).subjects.push({
            id: subjectData.id,
            name: subjectData.subject_name,
            code: subjectData.subject_code,
            subsystem: subjectData.subsystem,
            description: subjectData.description
          })
        }
      }
    })

    // Convert map to array
    const classes = Array.from(classMap.values())

    // Fetch students for each class
    for (const classData of classes) {
      const { data: students, error: studentsError } = await supabase
        .from('student_class_enrollments')
        .select(`
          id,
          student_id,
          enrollment_status,
          students:student_id(
            id,
            student_id,
            first_name,
            last_name,
            email,
            photo_url
          )
        `)
        .eq('class_id', classData.id)
        .eq('enrollment_status', 'enrolled')

      if (!studentsError && students) {
        classData.students = students.map((enrollment: any) => ({
          id: enrollment.students?.id || enrollment.student_id,
          studentId: enrollment.students?.student_id || enrollment.student_id,
          firstName: enrollment.students?.first_name || '',
          lastName: enrollment.students?.last_name || '',
          email: enrollment.students?.email || '',
          photo: enrollment.students?.photo_url || '/placeholder-user.jpg',
          enrollmentStatus: enrollment.enrollment_status
        }))
      }
    }

    // Fetch timetable schedule for each class
    for (const classData of classes) {
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetable_periods')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          subject,
          room,
          period_number
        `)
        .eq('class_id', classData.id)
        .eq('is_active', true)

      if (!timetableError && timetableData) {
        classData.schedule = timetableData.map(period => ({
          id: period.id,
          day: period.day_of_week,
          startTime: period.start_time,
          endTime: period.end_time,
          subject: period.subject,
          period: `Period ${period.period_number}`,
          room: period.room
        }))
      }
    }

    return NextResponse.json({
      success: true,
      classes,
      total: classes.length
    })

  } catch (error) {
    console.error('Error in teacher assigned classes API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        classes: []
      },
      { status: 500 }
    )
  }
}
