import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const classId = searchParams.get('classId')
    const subsystem = searchParams.get('subsystem')
    const academicYear = searchParams.get('academicYear')

    let query = supabase
      .from('students')
      .select(`
        *,
        classes (
          id,
          class_name,
          subsystem,
          academic_year
        )
      `)
      .order('first_name', { ascending: true })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (classId) {
      query = query.eq('class', classId)
    }
    if (subsystem) {
      query = query.eq('subsystem', subsystem)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    // If the join didn't work (students.class is VARCHAR, not a proper FK), fetch class names separately
    let classMap = new Map<string, string>()
    const studentsWithClassIds = data?.filter((s: any) => 
      s.class && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.class)
    ) || []
    
    // Check if join worked by seeing if any student with a class ID has a classes relationship
    const joinWorked = data?.some((s: any) => 
      s.class && s.classes && (s.classes.class_name || s.classes.id)
    )
    
    if (studentsWithClassIds.length > 0 && !joinWorked) {
      // Join failed, fetch classes separately
      const classIds = [...new Set(studentsWithClassIds.map((s: any) => s.class))]
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, class_name')
        .in('id', classIds)
      
      if (classesData) {
        classMap = new Map(classesData.map((cls: any) => [cls.id, cls.class_name]))
      }
    }

    // Transform data to match the expected interface
    const transformedData = data?.map(student => {
      let className = student.classes?.class_name
      
      // If join didn't work, try to get from our map
      if (!className && student.class && classMap.has(student.class)) {
        className = classMap.get(student.class)
      }
      
      // If class is not a UUID, it might be a class name already
      if (!className && student.class && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.class)) {
        className = student.class
      }
      
      return {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        middle_name: student.middle_name,
        student_id: student.student_id,
        email: student.email,
        phone: student.phone,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        place_of_birth: student.place_of_birth,
        nationality: student.nationality,
        religion: student.religion,
        address: student.address,
        city: student.city,
        region: student.region,
        status: student.status,
        enrollment_status: student.enrollment_status,
        fees_status: student.fees_status,
        total_fees: student.total_fees,
        paid_fees: student.paid_fees,
        class: student.class,
        class_name: className,
        subsystem: student.subsystem,
        branch: student.branch,
        previous_school: student.previous_school,
        previous_class: student.previous_class,
        is_new_student: student.is_new_student,
        academic_year: student.academic_year,
        enrollment_date: student.enrollment_date,
        created_at: student.created_at,
        updated_at: student.updated_at
      }
    }) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in students GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      first_name,
      last_name,
      student_id,
      email,
      date_of_birth,
      gender,
      phone,
      address,
      parent_name,
      parent_phone,
      parent_email,
      subsystem,
      academic_year,
      class: classId,
      status = 'active'
    } = body

    // Validate required fields
    if (!first_name || !last_name || !student_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if student_id already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', student_id)
      .single()

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student ID already exists' },
        { status: 409 }
      )
    }

    // Normalize class assignment: ensure we store class ID (UUID) instead of class name
    let classValue = classId || null
    
    if (classId) {
      // Check if classId is a UUID (class ID) or a class name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId)
      
      if (!isUUID) {
        // classId is a class name, look up the class ID
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .eq('class_name', classId)
          .eq('status', 'active')
          .maybeSingle()
        
        if (classData) {
          classValue = classData.id
          console.log(`Resolved class name "${classId}" to class ID: ${classData.id}`)
        } else {
          console.warn(`Could not find class with name "${classId}", storing as-is for backward compatibility`)
          // Keep the original value for backward compatibility
        }
      }
    }

    // Create student
    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert({
        first_name,
        last_name,
        student_id,
        email,
        date_of_birth,
        gender,
        phone,
        address,
        parent_name,
        parent_phone,
        parent_email,
        subsystem,
        academic_year,
        class: classValue, // Store class ID (UUID) if found, otherwise original value
        status
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating student:', insertError)
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        studentId: newStudent.id,
        message: 'Student created successfully' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in students POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
