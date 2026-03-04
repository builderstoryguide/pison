import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAcademicYearFromConfig } from '@/lib/app-config-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const classId = searchParams.get('classId')
    const subsystem = searchParams.get('subsystem')
    const academicYear = searchParams.get('academicYear')
    const studentId = searchParams.get('studentId')
    const includeMarks = searchParams.get('includeMarks') === 'true'

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

    // Apply filters
    if (studentId) {
      query = query.eq('id', studentId)
    }
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
    
    // Apply ordering (only if not fetching single student)
    if (!studentId) {
      query = query.order('first_name', { ascending: true })
    }

    let data, error
    try {
      const result = studentId 
        ? await query.maybeSingle()
        : await query
      data = result.data
      error = result.error
    } catch (err) {
      console.error('Network or connection error when fetching students from Supabase:', err)
      return NextResponse.json(
        {
          error: 'Failed to connect to database',
          details: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined,
        },
        { status: 503 }
      )
    }

    if (error) {
      console.error('Error fetching students from Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    // Handle single student vs array - normalize early for consistent processing
    const studentsArray = studentId && data ? [data] : (data || [])

    // If the join didn't work (students.class is VARCHAR, not a proper FK), fetch class names separately
    let classMap = new Map<string, string>()
    const studentsWithClassIds = studentsArray.filter((s: any) => 
      s.class && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.class)
    )
    
    // Check if join worked by seeing if any student with a class ID has a classes relationship
    const joinWorked = studentsArray.some((s: any) => 
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
    
    // Fetch marks if requested
    const marksMap = new Map<string, any[]>()
    if (includeMarks && studentsArray.length > 0) {
      const academicYearForMarks = academicYear || await getAcademicYearFromConfig()
      const studentIds = studentsArray.map((s: any) => s.id)
      
      // Build a map of student IDs to their class identifiers (UUID or class name)
      const studentClassMap = new Map<string, { classId: string | null, className: string | null }>()
      studentsArray.forEach((s: any) => {
        const classValue = s.class
        const isUUID = classValue && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classValue)
        const className = s.classes?.class_name || classMap.get(classValue) || (isUUID ? null : classValue)
        
        studentClassMap.set(s.id, {
          classId: isUUID ? classValue : null,
          className: className
        })
      })
      
      // Get unique class IDs (UUIDs only) for fetching class subjects
      const classIds = [...new Set(
        Array.from(studentClassMap.values())
          .map(c => c.classId)
          .filter((id): id is string => id !== null)
      )]
      
      // Fetch class subjects to ensure we only get marks for subjects in the student's class
      const classSubjectsMap = new Map<string, Set<string>>()
      if (classIds.length > 0) {
        const { data: classSubjectsData } = await supabase
          .from('class_subjects')
          .select('class_id, subject_id, subjects!inner(name)')
          .in('class_id', classIds)
        
        if (classSubjectsData) {
          classSubjectsData.forEach((cs: any) => {
            if (!classSubjectsMap.has(cs.class_id)) {
              classSubjectsMap.set(cs.class_id, new Set())
            }
            const subjectName = cs.subjects?.name
            if (subjectName) {
              classSubjectsMap.get(cs.class_id)!.add(subjectName)
            }
          })
        }
      }
      
      // Fetch all grades for these students
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          student_id,
          marks_obtained,
          percentage,
          grade_letter,
          remarks,
          assessment:assessments!inner (
            id,
            subject,
            type,
            title,
            academic_year,
            term,
            class_id
          )
        `)
        .in('student_id', studentIds)
        .eq('assessment.academic_year', academicYearForMarks)
      
      if (gradesError) {
        console.warn('Failed to fetch grades for students:', gradesError)
      } else if (gradesData) {
        // Group grades by student_id, filtering by class subjects
        gradesData.forEach((grade: any) => {
          const studentClassInfo = studentClassMap.get(grade.student_id)
          if (!studentClassInfo) return
          
          const assessmentSubject = grade.assessment?.subject
          const assessmentClassId = grade.assessment?.class_id
          
          // Only include marks if:
          // 1. Assessment class_id matches student's class ID (UUID match), OR
          // 2. Subject is in the student's class subjects list (if we have class ID)
          let shouldInclude = false
          
          if (studentClassInfo.classId && assessmentClassId === studentClassInfo.classId) {
            // Direct UUID match
            shouldInclude = true
          } else if (studentClassInfo.classId) {
            // Check if subject is in the class subjects list
            const classSubjects = classSubjectsMap.get(studentClassInfo.classId)
            shouldInclude = !!(classSubjects && assessmentSubject && classSubjects.has(assessmentSubject))
          } else {
            // If student's class is not a UUID (might be class name), include all marks
            // This is a fallback for backward compatibility
            shouldInclude = true
          }
          
          if (shouldInclude) {
            if (!marksMap.has(grade.student_id)) {
              marksMap.set(grade.student_id, [])
            }
            marksMap.get(grade.student_id)!.push({
              id: grade.id,
              assessment_id: grade.assessment?.id,
              subject: assessmentSubject,
              type: grade.assessment?.type,
              title: grade.assessment?.title,
              term: grade.assessment?.term,
              marks_obtained: grade.marks_obtained,
              percentage: grade.percentage,
              grade_letter: grade.grade_letter,
              remarks: grade.remarks
            })
          }
        })
      }
    }

    // Transform data to match the expected interface
    const transformedData = studentsArray.map(student => {
      let className = student.classes?.class_name
      
      // If join didn't work, try to get from our map
      if (!className && student.class && classMap.has(student.class)) {
        className = classMap.get(student.class)
      }
      
      // If class is not a UUID, it might be a class name already
      if (!className && student.class && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.class)) {
        className = student.class
      }
      
      const studentData: any = {
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
      
      // Add marks if requested
      if (includeMarks) {
        studentData.marks = marksMap.get(student.id) || []
      }
      
      return studentData
    })

    // If fetching single student, return object instead of array
    if (studentId) {
      if (transformedData.length === 0) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(transformedData[0])
    }

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
      matricule_number,
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
      .maybeSingle()

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student ID already exists' },
        { status: 409 }
      )
    }
    // Check if matricule_number already exists (if provided)
    if (matricule_number) {
      const { data: existingMatricule } = await supabase
        .from('students')
        .select('id')
        .eq('matricule_number', matricule_number)
        .single()

      if (existingMatricule) {
        return NextResponse.json(
          { error: 'Matricule Number already exists' },
          { status: 409 }
        )
      }
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
        matricule_number,
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
