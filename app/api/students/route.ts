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

    // Transform data to match the expected interface
    const transformedData = data?.map(student => ({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      student_id: student.student_id,
      email: student.email,
      status: student.status,
      class: student.class,
      class_name: student.classes?.class_name,
      subsystem: student.subsystem,
      academic_year: student.academic_year,
      created_at: student.created_at,
      updated_at: student.updated_at
    })) || []

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
        class: classId,
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
