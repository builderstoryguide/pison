import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'
import { fetchParentsForStudents, getParentInfoForStudent } from '@/lib/utils/parent-data-fetcher'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: teacherId } = await params
    
    // Parse query parameters for pagination and options
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const includeDetails = searchParams.get('includeDetails') === 'true'
    const summaryOnly = searchParams.get('summaryOnly') === 'true'

    if (!teacherId) {
      return NextResponse.json(
        { ok: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Verify user exists and is a teacher
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, name')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Teacher not found or not authorized' },
        { status: 404 }
      )
    }

    // First, find the teacher's record in the teachers table
    // The teachers table has a user_id column that links to users.id
    let { data: teacherRecord, error: teacherRecordError } = await supabase
      .from('teachers')
      .select('id, user_id, teacher_id, subjects, classes')
      .eq('user_id', teacherId)
      .single()

    // Log for debugging
    if (teacherRecordError) {
      // Try to find teacher by email as fallback
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', teacherId)
        .single()
      
        if (userData?.email) {
          const { data: teacherByEmail } = await supabase
            .from('teachers')
            .select('id, user_id, teacher_id, email, subjects, classes')
            .eq('email', userData.email)
            .single()
        
        if (teacherByEmail) {
          // Auto-repair: Link the teacher to the user account
          if (!teacherByEmail.user_id) {
            const { error: linkError } = await supabase
              .from('teachers')
              .update({ user_id: teacherId })
              .eq('id', teacherByEmail.id)
            
            if (linkError) {
              return NextResponse.json({
                ok: false,
                error: 'Teacher record found but failed to link to user account. Please contact administrator.',
                teacherRecord: teacherByEmail,
                linkError: serializeSupabaseError(linkError)
              }, { status: 500 })
            }
            
            // Set teacherRecord to continue with normal flow
            teacherRecord = { ...teacherByEmail, user_id: teacherId }
            teacherRecordError = null
          } else {
            // Teacher already linked, use it
            teacherRecord = teacherByEmail
            teacherRecordError = null
          }
        } else {
          // If not found by email, try finding by teacher_id from user_profiles
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role_specific_id')
            .eq('user_id', teacherId)
            .like('role_specific_id', 'TCH%')
            .maybeSingle()
          
          if (!profileError && userProfile?.role_specific_id) {
            const { data: teacherById, error: teacherByIdError } = await supabase
              .from('teachers')
              .select('id, user_id, teacher_id, email, subjects, classes')
              .eq('teacher_id', userProfile.role_specific_id)
              .maybeSingle()
            
            if (!teacherByIdError && teacherById) {
              if (!teacherById.user_id) {
                const { error: linkError } = await supabase
                  .from('teachers')
                  .update({ user_id: teacherId })
                  .eq('id', teacherById.id)
                
                if (!linkError) {
                  teacherRecord = { ...teacherById, user_id: teacherId }
                  teacherRecordError = null
                }
              } else {
                // Teacher already linked
                teacherRecord = teacherById
                teacherRecordError = null
              }
            }
          }
        }
      }
    }

    // Get teacher's assigned subjects
    let subjects: any[] = []

    if (teacherRecord) {
      const { data: teacherSubjects, error: subjectsError } = await supabase
        .from('teacher_subjects')
        .select(`
          id,
          teacher_id,
          subject_id,
          subject_name,
          sub_branch_id,
          assignment_type,
          is_active,
          created_at,
          subjects (
            id,
            name,
            code
          ),
          subject_sub_branches (
            id,
            name
          )
        `)
        .eq('teacher_id', teacherRecord.id)
        .eq('is_active', true)
  
      if (subjectsError) {
        // console.error('Error loading teacher subjects:', serializeSupabaseError(subjectsError))
      }
  
      // Transform subjects data
      subjects = (teacherSubjects || []).map((ts: any) => ({
        id: ts.id,
        subjectId: ts.subject_id,
        subjectName: ts.subject_name || ts.subjects?.name || 'Unknown',
        subjectCode: ts.subjects?.code || null,
        subBranchId: ts.sub_branch_id || null,
        subBranchName: ts.subject_sub_branches?.name || null,
        assignmentType: ts.assignment_type || 'main_subject',
        isActive: ts.is_active,
        createdAt: ts.created_at,
      }))

      // Also include subjects from teachers.subjects array (for admin-edited subjects)
      if (teacherRecord.subjects && Array.isArray(teacherRecord.subjects) && teacherRecord.subjects.length > 0) {
        // Fetch subject codes for subjects in the array
        const subjectNames = teacherRecord.subjects
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, name, code')
          .in('name', subjectNames)

        const subjectsMap = new Map((subjectsData || []).map((s: any) => [s.name, s]))

        // Add subjects from teachers.subjects array that aren't already in the list
        const existingSubjectNames = new Set(subjects.map(s => s.subjectName))
        
        teacherRecord.subjects.forEach((subjectName: string, index: number) => {
          if (!existingSubjectNames.has(subjectName)) {
            const subjectData = subjectsMap.get(subjectName)
            subjects.push({
              id: `teachers-table-${teacherRecord.id}-${index}`,
              subjectId: subjectData?.id || null,
              subjectName: subjectName,
              subjectCode: subjectData?.code || null,
              subBranchId: null,
              subBranchName: null,
              assignmentType: 'main_subject',
              isActive: true,
              createdAt: new Date().toISOString(),
            })
          }
        })
      }
    }

    // Get classes where teacher is the class teacher
    // class_teacher_id references teachers.id, not users.id
    let classTeacherClasses: any[] = []
    if (!teacherRecordError && teacherRecord) {
      const { data: classes, error: classTeacherError } = await supabase
        .from('classes')
        .select(`
          id,
          class_name,
          class_level,
          subsystem,
          stream,
          academic_year,
          capacity,
          current_enrollment,
          status
        `)
        .eq('class_teacher_id', teacherRecord.id)
        .eq('status', 'active')

      if (classTeacherError) {
        // console.error('Error loading class teacher classes:', serializeSupabaseError(classTeacherError))
      } else {
        classTeacherClasses = classes || []
      }
    }

    // Transform classes data
    const classesAsClassTeacher = classTeacherClasses.map((cls: any) => ({
      id: cls.id,
      name: cls.class_name || 'Unknown',
      level: cls.class_level || '',
      subsystem: cls.subsystem || '',
      branch: cls.stream || '',
      academicYear: cls.academic_year || '',
      capacity: cls.capacity || 0,
      currentEnrollment: cls.current_enrollment || 0,
      assignmentType: 'class_teacher',
      status: cls.status || 'active',
    }))

    // Get classes from timetable periods where teacher teaches subjects
    // First, we need to get the teacher's timetable_teacher_id
    // timetable_teachers.teacher_id references teachers.id, not users.id
    let timetableTeacher: any = null
    if (!teacherRecordError && teacherRecord) {
      const { data: tt, error: timetableTeacherError } = await supabase
        .from('timetable_teachers')
        .select('id')
        .eq('teacher_id', teacherRecord.id)
        .single()

      if (!timetableTeacherError) {
        timetableTeacher = tt
      }
    }

    let classesFromTimetable: any[] = []

    if (timetableTeacher) {
      const { data: periods, error: periodsError } = await supabase
        .from('timetable_periods')
        .select(`
          id,
          class_id,
          subject_id,
          timetable_classes (
            id,
            class_id,
            name,
            level,
            subsystem,
            branch
          ),
          timetable_subjects (
            id,
            subject_name
          )
        `)
        .eq('teacher_id', timetableTeacher.id)

      if (!periodsError && periods) {
        // Group periods by class and subject
        const classSubjectMap = new Map<string, {
          classId: string
          className: string
          level: string
          subsystem: string
          branch: string
          subjects: string[]
        }>()

        periods.forEach((period: any) => {
          const classInfo = period.timetable_classes
          const subjectInfo = period.timetable_subjects

          if (classInfo && subjectInfo) {
            const key = `${classInfo.id}_${classInfo.class_id || ''}`
            if (!classSubjectMap.has(key)) {
              classSubjectMap.set(key, {
                classId: classInfo.id,
                className: classInfo.name || 'Unknown',
                level: classInfo.level || '',
                subsystem: classInfo.subsystem || '',
                branch: classInfo.branch || '',
                subjects: [],
              })
            }

            const entry = classSubjectMap.get(key)!
            const subjectName = subjectInfo.subject_name || 'Unknown'
            if (!entry.subjects.includes(subjectName)) {
              entry.subjects.push(subjectName)
            }
          }
        })

        classesFromTimetable = Array.from(classSubjectMap.values()).map((entry) => ({
          id: entry.classId,
          name: entry.className || 'Unknown',
          level: entry.level || '',
          subsystem: entry.subsystem || '',
          branch: entry.branch || '',
          subjects: entry.subjects || [],
          assignmentType: 'subject_teacher',
        }))
      }
    }

    // Also check for classes from the main classes table that might be linked via class_teachers junction table
    let classesFromJunction: any[] = []

    if (!teacherRecordError && teacherRecord) {
      const { data: classTeachers, error: classTeachersError } = await supabase
        .from('class_teachers')
        .select(`
          class_id,
          teacher_row_id,
          classes (
            id,
            class_name,
            class_level,
            subsystem,
            stream,
            academic_year,
            capacity,
            current_enrollment,
            status
          )
        `)
        .eq('teacher_row_id', teacherRecord.id)

      if (classTeachersError) {
        // console.error('Error loading classes from class_teachers junction:', serializeSupabaseError(classTeachersError))
      } else if (classTeachers) {
        // console.log(`Found ${classTeachers.length} classes from class_teachers junction table`)
        classesFromJunction = (classTeachers || []).map((ct: any) => {
          const cls = ct.classes
          if (!cls) {
            // console.warn('Class not found for class_teachers entry:', ct.class_id)
            return null
          }
          return {
            id: cls.id,
            name: cls.class_name || 'Unknown',
            level: cls.class_level || '',
            subsystem: cls.subsystem || '',
            branch: cls.stream || '',
            academicYear: cls.academic_year || '',
            capacity: cls.capacity || 0,
            currentEnrollment: cls.current_enrollment || 0,
            assignmentType: 'subject_teacher',
            status: cls.status || 'active',
          }
        }).filter(Boolean)
      } else {
        // console.log('No classes found in class_teachers junction table for teacher:', teacherRecord.id)
      }
    } else {
      // console.warn('Cannot fetch classes from junction table - teacher record not found or error occurred')
    }

    // Also include classes from teachers.classes array (for admin-edited classes)
    let classesFromTeachersTable: any[] = []
    if (teacherRecord && teacherRecord.classes && Array.isArray(teacherRecord.classes) && teacherRecord.classes.length > 0) {
      const classNames = teacherRecord.classes
      
      // Fetch class details from classes table by name
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          id,
          class_name,
          class_level,
          subsystem,
          stream,
          academic_year,
          capacity,
          current_enrollment,
          status
        `)
        .in('class_name', classNames)
        .eq('status', 'active')

      if (classesData && classesData.length > 0) {
        classesFromTeachersTable = classesData.map((cls: any) => ({
          id: cls.id,
          name: cls.class_name || 'Unknown',
          level: cls.class_level || '',
          subsystem: cls.subsystem || '',
          branch: cls.stream || '',
          academicYear: cls.academic_year || '',
          capacity: cls.capacity || 0,
          currentEnrollment: cls.current_enrollment || 0,
          assignmentType: 'subject_teacher',
          status: cls.status || 'active',
        }))
      }
    }

    // Combine all classes and remove duplicates
    const allClasses = [...classesAsClassTeacher, ...classesFromTimetable, ...classesFromJunction, ...classesFromTeachersTable]
    const uniqueClasses = Array.from(
      new Map(allClasses.map((cls) => [cls.id, cls])).values()
    )

    // Apply pagination to classes
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedClasses = uniqueClasses.slice(startIndex, endIndex)
    const totalClasses = uniqueClasses.length
    const hasMore = endIndex < totalClasses

    // If summaryOnly, return lightweight response without details
    if (summaryOnly) {
      return NextResponse.json({
        ok: true,
        teacher: {
          id: user.id,
          name: user.name,
        },
        subjects: subjects.map(s => ({
          id: s.id,
          subjectId: s.subjectId,
          subjectName: s.subjectName || 'Unknown',
          subjectCode: s.subjectCode || null,
          subBranchId: s.subBranchId || null,
          subBranchName: s.subBranchName || null,
          assignmentType: s.assignmentType || 'main_subject',
          isActive: s.isActive ?? true,
          createdAt: s.createdAt,
        })),
        classes: paginatedClasses.map(cls => ({
          id: cls.id,
          name: cls.name || 'Unknown',
          level: cls.level || '',
          subsystem: cls.subsystem || '',
          branch: cls.branch || '',
          academicYear: cls.academicYear || '',
          capacity: cls.capacity || 0,
          currentEnrollment: cls.currentEnrollment || 0,
          assignmentType: cls.assignmentType || 'subject_teacher',
          status: cls.status || 'active',
        })),
        pagination: {
          page,
          limit,
          total: totalClasses,
          hasMore,
        },
      })
    }

    // If not including details, return classes without students/subjects
    if (!includeDetails) {
      return NextResponse.json({
        ok: true,
        teacher: {
          id: user.id,
          name: user.name,
        },
        subjects,
        classes: paginatedClasses.map(cls => ({
          ...cls,
          students: [],
          subjects: [],
        })),
        pagination: {
          page,
          limit,
          total: totalClasses,
          hasMore,
        },
      })
    }

    // Optimized batch queries for students and subjects
    const classIds = paginatedClasses.map(cls => cls.id)

    // Batch fetch all students for all classes at once
    // Students are linked to classes via students.class (VARCHAR) or class_students junction table
    // The class column can store either UUIDs (as strings) or class names
    const classNames = paginatedClasses.map(cls => cls.name).filter(Boolean)
    
    const [studentsByClassIdResult, studentsByClassNameResult, studentsByClassColumnResult, classStudentsJunctionResult] = await Promise.all([
      // Method 1: Query via students.class column matching class IDs (UUIDs stored as strings)
      classIds.length > 0 ? supabase
          .from('students')
          .select(`
            id,
            student_id,
            first_name,
            last_name,
            email,
            phone,
            status,
            date_of_birth,
            address,
            class,
            class_id,
            class_name,
            enrollment_status
          `)
          .in('class', classIds)
          .eq('status', 'active') : { data: [], error: null },
      // Method 2: Query via students.class column matching class names
      classNames.length > 0 ? supabase
          .from('students')
          .select(`
            id,
            student_id,
            first_name,
            last_name,
            email,
            phone,
            status,
            date_of_birth,
            address,
            class,
            class_id,
            class_name,
            enrollment_status
          `)
          .in('class', classNames)
          .eq('status', 'active') : { data: [], error: null },
      // Method 3: Query ALL active students and filter later (fallback if above methods don't work)
      // This ensures we don't miss students due to type mismatches
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
            date_of_birth,
            address,
            class,
            class_id,
            class_name,
            enrollment_status
          `)
          .eq('status', 'active'),
      // Method 4: Query via class_students junction table (if it exists)
      classIds.length > 0 ? supabase
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
              date_of_birth,
              address,
              class,
              class_id,
              class_name,
              enrollment_status
            )
          `)
          .in('class_id', classIds) : { data: [], error: null }
    ])

    const studentsByClassId = studentsByClassIdResult.data || []
    const studentsByClassName = studentsByClassNameResult.data || []
    const allActiveStudents = studentsByClassColumnResult.data || []
    const classStudentsJunction = classStudentsJunctionResult.data || []

    // Log query results for debugging
    if (studentsByClassIdResult.error) {
      // console.error('Error fetching students by class ID:', serializeSupabaseError(studentsByClassIdResult.error))
    }
    if (studentsByClassNameResult.error) {
      // console.error('Error fetching students by class name:', serializeSupabaseError(studentsByClassNameResult.error))
    }
    if (studentsByClassColumnResult.error) {
      // console.error('Error fetching all active students:', serializeSupabaseError(studentsByClassColumnResult.error))
    }
    if (classStudentsJunctionResult.error) {
      // It's okay if this table doesn't exist, just log it
      // const _errorMsg = serializeSupabaseError(classStudentsJunctionResult.error)
      // console.log('Note: class_students junction table may not exist or be accessible:', _errorMsg)
    }
    
    // console.log(`Student query results: ${studentsByClassId.length} by class ID, ${studentsByClassName.length} by class name, ${allActiveStudents.length} total active, ${classStudentsJunction.length} from junction table`)

    // Batch fetch parents for all students from ALL sources
    // Collect unique student IDs from all query methods to ensure complete parent data coverage
    const allStudentIds = new Set<string>()
    
    // From class_students junction table
    classStudentsJunction.forEach((junction: any) => {
      if (junction.students?.student_id) {
        allStudentIds.add(junction.students.student_id)
      }
    })
    
    // From students query by class_id
    studentsByClassId.forEach((student: any) => {
      if (student.student_id) {
        allStudentIds.add(student.student_id)
      }
    })
    
    // From students query by class name
    studentsByClassName.forEach((student: any) => {
      if (student.student_id) {
        allStudentIds.add(student.student_id)
      }
    })
    
    // From all active students
    allActiveStudents.forEach((student: any) => {
      if (student.student_id) {
        allStudentIds.add(student.student_id)
      }
    })
    
    const studentIds = Array.from(allStudentIds).filter(Boolean)
    console.log(`📊 Fetching parent data for ${studentIds.length} unique students from all sources`)
    
    const parentsByStudentId = await fetchParentsForStudents(supabase, studentIds)

    // Batch fetch all subjects for all classes from teacher_branch_assignments
    // This shows subjects that the teacher teaches in each class
    let allTeacherAssignmentsData: any[] = []
    let allTeacherAssignmentsError: any = null

    if (classIds.length > 0 && teacherRecord) {
      // console.log(`🔍 Fetching subjects for teacher ${teacherRecord.id} in classes:`, classIds)
      
      // Fetch assignments with branch details first
      // Then fetch subjects separately and join them
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('teacher_branch_assignments')
        .select(`
          id,
          class_id,
          is_primary_teacher,
          academic_year,
          term,
          branch_id,
          subject_branches (
            id,
            branch_name,
            branch_code,
            subject_id
          )
        `)
        .eq('teacher_id', teacherRecord.id)
        .in('class_id', classIds)

      const { data, error } = { data: assignmentsData, error: assignmentsError }

      allTeacherAssignmentsData = data || []
      allTeacherAssignmentsError = error

      if (allTeacherAssignmentsError) {
        // console.error('❌ Error fetching assignments:', serializeSupabaseError(allTeacherAssignmentsError))
        allTeacherAssignmentsData = []
      } else if (data && data.length > 0) {
        // console.log(`✅ Found ${data.length} assignments, fetching subject details...`)
        
        // Extract unique subject IDs from branches
        const subjectIds = data
          .map(a => (Array.isArray(a.subject_branches) ? a.subject_branches[0] : a.subject_branches)?.subject_id)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i) // unique

        if (subjectIds.length > 0) {
          // Fetch subjects separately
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('subjects')
            .select('id, subject_name, subject_code, coefficient, description')
            .in('id', subjectIds)

          if (subjectsError) {
            // console.error('❌ Error fetching subjects:', serializeSupabaseError(subjectsError))
          } else {
            // Create a map of subject_id -> subject
            const subjectMap = new Map((subjectsData || []).map(s => [s.id, s]))
            
            // Join subjects back to assignments
            allTeacherAssignmentsData = data.map(assignment => {
              // subject_branches is returned as an array by Supabase when joined
              const branches = assignment.subject_branches as any
              const subjectId = Array.isArray(branches) 
                ? branches[0]?.subject_id 
                : branches?.subject_id
              
              const subject = subjectId ? subjectMap.get(subjectId) : null
              
              return {
                ...assignment,
                subject_branches: assignment.subject_branches ? {
                  ...assignment.subject_branches,
                  subjects: subject || null
                } : null
              }
            })
            
            // console.log(`✅ Successfully loaded ${allTeacherAssignmentsData.length} assignments with subject data`)
            if (allTeacherAssignmentsData.length > 0) {
              /* console.log('📋 Sample assignment:', {
                classId: allTeacherAssignmentsData[0].class_id,
                branchName: allTeacherAssignmentsData[0].subject_branches?.branch_name,
                subjectName: allTeacherAssignmentsData[0].subject_branches?.subjects?.subject_name
              }) */
            }
          }
        } else {
          // console.log('⚠️ No subject IDs found in branches')
        }
      } else {
        // console.log('ℹ️ No assignments found for this teacher and classes')
        // console.log('   Teacher ID:', teacherRecord.id)
        // console.log('   Class IDs:', classIds)
      }
    } else {
      if (!teacherRecord) {
        // console.warn('⚠️ Cannot fetch subjects: teacherRecord not found')
      }
      if (classIds.length === 0) {
        // console.warn('⚠️ Cannot fetch subjects: no class IDs provided')
      }
    }

    
    // Fetch class_subjects for fallback subject matching
    // This ensures we show subjects even if teacher_branch_assignments is empty
    let classSubjectsData: any[] = []
    if (classIds.length > 0) {
      const { data, error } = await supabase
        .from('class_subjects')
        .select(`
          class_id,
          subject_id,
          subjects (
            id,
            name,
            code,
            coefficient,
            description
          )
        `)
        .in('class_id', classIds)
      
      if (!error && data) {
        classSubjectsData = data
        // console.log(`✅ Fetched ${data.length} class_subjects for fallback matching`)
      } else if (error) {
        // console.error('Error fetching class_subjects:', serializeSupabaseError(error))
      }
    }

    // Group students by class using multiple methods
    const allStudentsMap = new Map<string, any[]>()
    
    // Initialize map for each class - use class ID as the primary key
    paginatedClasses.forEach(cls => {
      allStudentsMap.set(cls.id, [])
    })

    // Helper function to add student to map if it doesn't already exist
    const addStudentToMap = (student: any, classId: string, _method: string = 'unknown') => {
      const existing = allStudentsMap.get(classId) || []
      if (!existing.find((s: any) => s.id === student.id)) {
        existing.push({
          ...student,
          enrollment_status: student.enrollment_status || 'enrolled'
        })
        allStudentsMap.set(classId, existing)
        /* console.log(`✅ Student matched via ${method}:`, {
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          classId,
          studentClass: student.class || student.class_id || student.class_name,
          enrollmentStatus: student.enrollment_status || 'enrolled'
        }) */
      }
    }

    // Method 1: Group students from class_students junction table (if available)
    // console.log(`🔍 Matching students via junction table: ${classStudentsJunction.length} junctions`)
    classStudentsJunction.forEach((junction: any) => {
      const classId = junction.class_id
      const student = junction.students
      
      if (student && allStudentsMap.has(classId)) {
        addStudentToMap(student, classId, 'junction_table')
      } else if (student && !allStudentsMap.has(classId)) {
        /* console.log(`⚠️ Junction student found but classId not in map:`, {
          classId,
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          availableClassIds: Array.from(allStudentsMap.keys())
        }) */
      }
    })

    // Method 2: Group students by class column matching class IDs
    // console.log(`🔍 Matching students by class ID: ${studentsByClassId.length} students`)
    studentsByClassId.forEach((student: any) => {
      const studentClassValue = student.class
      if (!studentClassValue) {
        /* console.log(`⚠️ Student has no class value:`, {
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          class: student.class,
          class_id: student.class_id,
          class_name: student.class_name
        }) */
        return
      }
      
      // Find matching class by ID (exact match)
      let matchingClass = paginatedClasses.find(cls => cls.id === studentClassValue)
      
      // Also try case-insensitive string comparison
      if (!matchingClass) {
        matchingClass = paginatedClasses.find(cls => 
          cls.id?.toString().toLowerCase().trim() === studentClassValue.toString().toLowerCase().trim()
        )
      }
      
      if (matchingClass) {
        addStudentToMap(student, matchingClass.id, 'class_id_exact')
      } else {
        /* console.log(`⚠️ Student class ID not matched:`, {
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          studentClassValue,
          availableClassIds: paginatedClasses.map(c => c.id),
          availableClassNames: paginatedClasses.map(c => c.name)
        }) */
      }
    })

    // Method 3: Group students by class column matching class names
    // console.log(`🔍 Matching students by class name: ${studentsByClassName.length} students`)
    studentsByClassName.forEach((student: any) => {
      const studentClassValue = student.class
      if (!studentClassValue) return
      
      // Find matching class by name (case-insensitive, exact match)
      let matchingClass = paginatedClasses.find(cls => 
        cls.name?.toLowerCase().trim() === studentClassValue?.toLowerCase().trim()
      )
      
      // Try partial match - check if class name contains student class or vice versa
      if (!matchingClass) {
        matchingClass = paginatedClasses.find(cls => {
          const className = cls.name?.toLowerCase().trim() || ''
          const studentClass = studentClassValue?.toLowerCase().trim() || ''
          return className.includes(studentClass) || studentClass.includes(className) ||
                 className.startsWith(studentClass) || studentClass.startsWith(className)
        })
      }
      
      if (matchingClass) {
        addStudentToMap(student, matchingClass.id, 'class_name_match')
      }
    })

    // Method 4: Fallback - Filter all active students by class (handles any type mismatches)
    // This catches students that weren't found by the above methods
    // console.log(`🔍 Fallback matching: checking ${allActiveStudents.length} active students`)
    const unmatchedStudents: any[] = []
    
    allActiveStudents.forEach((student: any) => {
      // Check if student was already matched
      const alreadyMatched = Array.from(allStudentsMap.values())
        .some(students => students.some((s: any) => s.id === student.id))
      
      if (alreadyMatched) return
      
      const studentClassValue = student.class || student.class_id || student.class_name
      if (!studentClassValue) {
        unmatchedStudents.push({
          student,
          reason: 'no_class_value',
          studentData: {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            class: student.class,
            class_id: student.class_id,
            class_name: student.class_name
          }
        })
        return
      }
      
      // Try to find matching class by ID first (exact and case-insensitive)
      let matchingClass = paginatedClasses.find(cls => cls.id === studentClassValue)
      
      if (!matchingClass) {
        matchingClass = paginatedClasses.find(cls => 
          cls.id?.toString().toLowerCase().trim() === studentClassValue.toString().toLowerCase().trim()
        )
      }
      
      // If no match by ID, try by name (exact and partial)
      if (!matchingClass) {
        matchingClass = paginatedClasses.find(cls => 
          cls.name?.toLowerCase().trim() === studentClassValue?.toLowerCase().trim()
        )
      }
      
      if (!matchingClass) {
        matchingClass = paginatedClasses.find(cls => {
          const className = cls.name?.toLowerCase().trim() || ''
          const studentClass = studentClassValue?.toLowerCase().trim() || ''
          return className.includes(studentClass) || studentClass.includes(className) ||
                 className.startsWith(studentClass) || studentClass.startsWith(className)
        })
      }
      
      // Also check if student's class_id field matches class ID
      if (!matchingClass && student.class_id) {
        matchingClass = paginatedClasses.find(cls => 
          cls.id?.toString().toLowerCase().trim() === student.class_id?.toString().toLowerCase().trim()
        )
      }
      
      // Also check if student's class_name field matches class name
      if (!matchingClass && student.class_name) {
        matchingClass = paginatedClasses.find(cls => 
          cls.name?.toLowerCase().trim() === student.class_name?.toLowerCase().trim()
        )
      }
      
      if (matchingClass) {
        addStudentToMap(student, matchingClass.id, 'fallback_match')
      } else {
        unmatchedStudents.push({
          student,
          reason: 'no_class_match',
          studentData: {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            class: student.class,
            class_id: student.class_id,
            class_name: student.class_name,
            studentClassValue
          },
          availableClasses: paginatedClasses.map(c => ({ id: c.id, name: c.name }))
        })
      }
    })
    
    // Log unmatched students for debugging
    if (unmatchedStudents.length > 0) {
      // console.log(`⚠️ ${unmatchedStudents.length} students could not be matched to any class:`, unmatchedStudents)
    }

    // Group subjects by class from teacher_branch_assignments
    const subjectsByClass = new Map<string, any[]>()
    paginatedClasses.forEach(cls => {
      subjectsByClass.set(cls.id, [])
    })

    if (allTeacherAssignmentsData && allTeacherAssignmentsData.length > 0) {
      allTeacherAssignmentsData.forEach((assignment: any) => {
        const classId = assignment.class_id
        if (subjectsByClass.has(classId)) {
          const subjectData = assignment.subject_branches?.subjects
          // Only include subjects that exist
          if (subjectData && subjectData.subject_name) {
            // Check if subject already exists in the class (avoid duplicates)
            const existingSubjects = subjectsByClass.get(classId) || []
            const subjectExists = existingSubjects.some(
              (s: any) => s.id === subjectData.id || s.name === subjectData.subject_name
            )
            
            if (!subjectExists) {
              subjectsByClass.get(classId)!.push({
                id: subjectData.id || `sub_${subjectData.subject_name}`,
                name: subjectData.subject_name || 'Unknown Subject',
                code: subjectData.subject_code || subjectData.subject_name?.substring(0, 4).toUpperCase() || 'N/A',
                coefficient: subjectData.coefficient || 1,
                description: subjectData.description || undefined,
              })
            }
          } else {
            /* console.warn('⚠️ Assignment found but subject data is missing:', {
              assignmentId: assignment.id,
              classId: assignment.class_id,
              hasSubjectBranches: !!assignment.subject_branches,
              hasSubjects: !!assignment.subject_branches?.subjects
            }) */
          }
        }
      })
      
      // Log summary of subjects loaded per class
      subjectsByClass.forEach((subjects, _classId) => {
        if (subjects.length > 0) {
          // console.log(`📚 Class ${_classId}: ${subjects.length} subjects loaded`)
        }
      })
    } else {
      // console.log('ℹ️ No teacher assignments found for these classes')
    }

    // Fallback: Match teacher subjects with class subjects
    if (classSubjectsData.length > 0 && subjects.length > 0) {
      // console.log('🔄 Running fallback subject matching...')
      const teacherSubjectIds = new Set(subjects.map(s => s.subjectId))
      
      classSubjectsData.forEach((cs: any) => {
        const classId = cs.class_id
        const subject = cs.subjects
        
        if (classId && subject && teacherSubjectIds.has(subject.id)) {
          if (subjectsByClass.has(classId)) {
            const existingSubjects = subjectsByClass.get(classId) || []
            const subjectExists = existingSubjects.some((s: any) => s.id === subject.id)
            
            if (!subjectExists) {
              subjectsByClass.get(classId)!.push({
                id: subject.id,
                name: subject.name || 'Unknown Subject',
                code: subject.code || 'N/A',
                coefficient: subject.coefficient || 1,
                description: subject.description || undefined,
              })
            }
          }
        }
      })
    }

    // Transform classes with batched data
    const classesWithDetails = paginatedClasses.map((cls) => {
      // Get students for this class
      const studentsData = allStudentsMap.get(cls.id) || []
      
      // Log for debugging
      if (studentsData.length > 0) {
        // console.log(`Found ${studentsData.length} students for class ${cls.name} (ID: ${cls.id})`)
      } else {
        /* console.log(`No students found for class ${cls.name} (ID: ${cls.id}). Available keys in map:`, Array.from(allStudentsMap.keys()))
        console.log(`Students by class ID: ${studentsByClassId.length}, by class name: ${studentsByClassName.length}, total active: ${allActiveStudents.length}, from junction: ${classStudentsJunction.length}`) */
      }
      
      // Remove duplicates by student id (shouldn't happen, but just in case)
      const uniqueStudentsMap = new Map()
      studentsData.forEach((student: any) => {
        uniqueStudentsMap.set(student.id, student)
      })
      const uniqueStudents = Array.from(uniqueStudentsMap.values())

      // Transform students data
      const students = uniqueStudents.map((student: any) => {
        // Use enrollment_status from enrollment if available, otherwise derive from student.status
        // Default to 'enrolled' for active students
        let enrollmentStatus: 'enrolled' | 'pending' | 'transferred' = 'enrolled'
        
        // Priority 1: Check enrollment_status field (from database or set during matching)
        if (student.enrollment_status) {
          const status = student.enrollment_status.toString().toLowerCase().trim()
          if (status === 'enrolled') {
            enrollmentStatus = 'enrolled'
          } else if (status === 'pending') {
            enrollmentStatus = 'pending'
          } else if (status === 'transferred' || status === 'inactive') {
            enrollmentStatus = 'transferred'
          } else {
            // If enrollment_status exists but has unexpected value, default to enrolled for active students
            enrollmentStatus = 'enrolled'
          }
        } 
        // Priority 2: Check student.status field
        else if (student.status) {
          const status = student.status.toString().toLowerCase().trim()
          if (status === 'active' || status === 'enrolled') {
            enrollmentStatus = 'enrolled'
          } else if (status === 'pending') {
            enrollmentStatus = 'pending'
          } else if (status === 'transferred' || status === 'inactive') {
            enrollmentStatus = 'transferred'
          } else {
            // Default to enrolled for any other status if student is in the system
            enrollmentStatus = 'enrolled'
          }
        }
        // Priority 3: Default to 'enrolled' if no status information
        // This ensures all students in classes are treated as enrolled by default
        else {
          enrollmentStatus = 'enrolled'
        }

        // Log when enrollmentStatus is set to non-enrolled for debugging
        if (enrollmentStatus !== 'enrolled') {
          /* console.log(`📋 Student enrollmentStatus set to '${enrollmentStatus}':`, {
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            enrollment_status: student.enrollment_status,
            status: student.status,
            finalEnrollmentStatus: enrollmentStatus
          }) */
        }

        const parentInfo = getParentInfoForStudent(student.student_id, parentsByStudentId)

        return {
          id: student.id,
          studentId: student.student_id || '',
          firstName: student.first_name || '',
          lastName: student.last_name || '',
          email: student.email || '',
          phone: student.phone || undefined,
          // photo column doesn't exist in students table, so we don't include it
          enrollmentStatus,
          parentName: parentInfo.parentName,
          parentPhone: parentInfo.parentPhone,
          parentEmail: parentInfo.parentEmail,
          dateOfBirth: student.date_of_birth || undefined,
          address: student.address || undefined,
        }
      })
      
      // Log enrollment status summary for debugging
      // const _enrolledCount = students.filter(s => s.enrollmentStatus === 'enrolled').length
      // const _pendingCount = students.filter(s => s.enrollmentStatus === 'pending').length
      // const _transferredCount = students.filter(s => s.enrollmentStatus === 'transferred').length
      /* console.log(`📊 Student enrollment status for class ${cls.name} (${cls.id}):`, {
        total: students.length,
        enrolled: _enrolledCount,
        pending: _pendingCount,
        transferred: _transferredCount
      }) */

      // Log parent data coverage
      // const _parentCoverage = calculateParentCoverage(students)
      // console.log(`👪 Parent data summary for class ${cls.name}:`, _parentCoverage)

      // Get subjects for this class
      let finalSubjects = subjectsByClass.get(cls.id) || []
      
      // If no subjects from class_subjects, use subjects from timetable or class data
      if (finalSubjects.length === 0 && cls.subjects && Array.isArray(cls.subjects)) {
        finalSubjects = cls.subjects.map((subjectName: string) => ({
          id: `sub_${subjectName}`,
          name: subjectName,
          code: subjectName.substring(0, 4).toUpperCase(),
          coefficient: 1,
          description: undefined,
        }))
      }

      return {
        ...cls,
        students,
        subjects: finalSubjects,
      }
    })

    // Log summary for debugging
    const studentSummary = classesWithDetails.map(cls => ({
      classId: cls.id,
      className: cls.name,
      studentsCount: cls.students?.length || 0,
      enrolledCount: cls.students?.filter((s: any) => s.enrollmentStatus === 'enrolled').length || 0,
      studentIds: cls.students?.map((s: any) => s.id) || []
    }))
    
    console.log('📊 Teacher assignments summary:', {
      teacherId: user.id,
      teacherName: user.name,
      subjectsCount: subjects.length,
      classesCount: classesWithDetails.length,
      classTeacherClasses: classesAsClassTeacher.length,
      timetableClasses: classesFromTimetable.length,
      junctionClasses: classesFromJunction.length,
      teacherRecordFound: !teacherRecordError && !!teacherRecord,
      teacherRecordId: teacherRecord?.id,
      totalStudents: classesWithDetails.reduce((sum, cls) => sum + (cls.students?.length || 0), 0),
      totalEnrolledStudents: classesWithDetails.reduce((sum, cls) => 
        sum + (cls.students?.filter((s: any) => s.enrollmentStatus === 'enrolled').length || 0), 0),
      totalSubjects: classesWithDetails.reduce((sum, cls) => sum + (cls.subjects?.length || 0), 0),
      studentSummary
    })
    
    // Log detailed student matching results for each class
    classesWithDetails.forEach(cls => {
      if (cls.students && cls.students.length > 0) {
        console.log(`✅ Class "${cls.name}" (${cls.id}) has ${cls.students.length} students:`, {
          students: cls.students.map((s: any) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            enrollmentStatus: s.enrollmentStatus,
            studentId: s.studentId
          }))
        })
      } else {
        console.warn(`⚠️ Class "${cls.name}" (${cls.id}) has NO students`, {
          classId: cls.id,
          className: cls.name,
          studentsInMap: allStudentsMap.get(cls.id)?.length || 0
        })
      }
    })

    return NextResponse.json({
      ok: true,
      teacher: {
        id: user.id,
        name: user.name,
      },
      subjects,
      classes: classesWithDetails,
      pagination: {
        page,
        limit,
        total: totalClasses,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/teachers/[id]/assignments:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

