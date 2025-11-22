import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchParentsForStudents, getParentInfoForStudent } from '@/lib/utils/parent-data-fetcher'

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

    // Try multiple methods to fetch students for this class
    const [
      studentsByClassIdResult,
      studentsByClassColumnResult,
      classStudentsJunctionResult
    ] = await Promise.all([
      // Method 1: Query students where class_id matches
      supabase
        .from('students')
        .select(`
          id,
          student_id,
          first_name,
          last_name,
          email,
          phone,
          status,
          enrollment_status
        `)
        .eq('class_id', classId)
        .eq('status', 'active'),
      
      // Method 2: Query students where class column (VARCHAR) matches class ID
      supabase
        .from('students')
        .select(`
          id,
          student_id,
          first_name,
          last_name,
          email,
          phone,
          status,
          enrollment_status
        `)
        .eq('class', classId)
        .eq('status', 'active'),
      
      // Method 3: Query via class_students junction table
      supabase
        .from('class_students')
        .select(`
          class_id,
          students (
            id,
            student_id,
            first_name,
            last_name,
            email,
            phone,
            status,
            enrollment_status
          )
        `)
        .eq('class_id', classId)
    ])
    
    // Method 4: Try student_branch_enrollments (if table exists) - handle separately to avoid errors
    let branchEnrollmentsResult: { data: any[] | null; error: any } = { data: null, error: null }
    try {
      const result = await supabase
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
            phone
          )
        `)
        .eq('class_id', classId)
        .eq('enrollment_status', 'enrolled')
      branchEnrollmentsResult = result
    } catch (error: any) {
      // Table doesn't exist or other error, ignore this method
      branchEnrollmentsResult = { data: null, error: error?.message || 'Table not found' }
    }

    // Collect all unique students from different sources
    const studentMap = new Map<string, any>()

    // Process Method 1: students by class_id
    if (studentsByClassIdResult.data) {
      studentsByClassIdResult.data.forEach((student: any) => {
        if (student.id && !studentMap.has(student.id)) {
          studentMap.set(student.id, {
            id: student.id,
            studentId: student.student_id,
            firstName: student.first_name,
            lastName: student.last_name,
            email: student.email,
            phone: student.phone,
            enrollmentStatus: student.enrollment_status || 'enrolled'
          })
        }
      })
    }

    // Process Method 2: students by class column
    if (studentsByClassColumnResult.data) {
      studentsByClassColumnResult.data.forEach((student: any) => {
        if (student.id && !studentMap.has(student.id)) {
          studentMap.set(student.id, {
            id: student.id,
            studentId: student.student_id,
            firstName: student.first_name,
            lastName: student.last_name,
            email: student.email,
            phone: student.phone,
            enrollmentStatus: student.enrollment_status || 'enrolled'
          })
        }
      })
    }

    // Process Method 3: class_students junction table
    if (classStudentsJunctionResult.data) {
      classStudentsJunctionResult.data.forEach((junction: any) => {
        const student = junction.students
        if (student?.id && !studentMap.has(student.id)) {
          studentMap.set(student.id, {
            id: student.id,
            studentId: student.student_id,
            firstName: student.first_name,
            lastName: student.last_name,
            email: student.email,
            phone: student.phone,
            enrollmentStatus: student.enrollment_status || 'enrolled'
          })
        }
      })
    }

    // Process Method 4: student_branch_enrollments (if table exists)
    if (branchEnrollmentsResult.data) {
      branchEnrollmentsResult.data.forEach((enrollment: any) => {
        const student = enrollment.students
        if (student?.id && !studentMap.has(student.id)) {
          studentMap.set(student.id, {
            id: student.id,
            studentId: student.student_id,
            firstName: student.first_name,
            lastName: student.last_name,
            email: student.email,
            phone: student.phone,
            enrollmentStatus: enrollment.enrollment_status === 'enrolled' ? 'enrolled' : enrollment.enrollment_status
          })
        }
      })
    }

    // Convert map to array
    let transformedStudents = Array.from(studentMap.values())

    // Fetch parent information for all students
    const studentIds = transformedStudents.map(s => s.studentId).filter(Boolean)
    const parentsByStudentId = studentIds.length > 0 
      ? await fetchParentsForStudents(supabase, studentIds)
      : new Map()

    // Enrich students with parent information
    transformedStudents = transformedStudents.map(student => {
      const parentInfo = getParentInfoForStudent(student.studentId, parentsByStudentId)
      return {
        ...student,
        parentName: parentInfo.parentName,
        parentPhone: parentInfo.parentPhone,
        parentEmail: parentInfo.parentEmail
      }
    })

    // Log errors for debugging (but don't fail if some methods fail)
    if (studentsByClassIdResult.error) {
      console.warn('Warning: Error fetching students by class_id:', studentsByClassIdResult.error.message)
    }
    if (studentsByClassColumnResult.error) {
      console.warn('Warning: Error fetching students by class column:', studentsByClassColumnResult.error.message)
    }
    if (classStudentsJunctionResult.error) {
      console.warn('Warning: Error fetching students from junction table:', classStudentsJunctionResult.error.message)
    }
    // Only log branch enrollments error if we attempted the query (not if it was skipped)
    if (branchEnrollmentsResult && branchEnrollmentsResult.error) {
      console.warn('Warning: Error fetching students from branch enrollments:', branchEnrollmentsResult.error.message)
    }

    // If no students found from any method, return empty array (not an error)
    if (transformedStudents.length === 0) {
      console.log(`No students found for class ${classId} using any method`)
    }

    return NextResponse.json({
      success: true,
      students: transformedStudents
    })

  } catch (error) {
    console.error('Error in class students API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
