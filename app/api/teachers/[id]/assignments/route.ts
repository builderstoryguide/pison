import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: teacherId } = await params

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

    // Get teacher's assigned subjects
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
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (subjectsError) {
      console.error('Error loading teacher subjects:', serializeSupabaseError(subjectsError))
    }

    // Transform subjects data
    const subjects = (teacherSubjects || []).map((ts: any) => ({
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

    // First, find the teacher's record in the teachers table
    // The teachers table has a user_id column that links to users.id
    let { data: teacherRecord, error: teacherRecordError } = await supabase
      .from('teachers')
      .select('id, user_id, teacher_id')
      .eq('user_id', teacherId)
      .single()

    // Log for debugging
    if (teacherRecordError) {
      console.error('Error finding teacher record:', serializeSupabaseError(teacherRecordError))
      console.log('Looking for teacher with user_id:', teacherId)
      
      // Try to find teacher by email as fallback
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', teacherId)
        .single()
      
      if (userData?.email) {
        const { data: teacherByEmail } = await supabase
          .from('teachers')
          .select('id, user_id, teacher_id, email')
          .eq('email', userData.email)
          .single()
        
        if (teacherByEmail) {
          console.log('Found teacher by email, but user_id is not set:', teacherByEmail)
          // Auto-repair: Link the teacher to the user account
          if (!teacherByEmail.user_id) {
            console.log(`🔧 Auto-repair: Linking teacher ${teacherByEmail.id} to user ${teacherId}`)
            const { error: linkError } = await supabase
              .from('teachers')
              .update({ user_id: teacherId })
              .eq('id', teacherByEmail.id)
            
            if (linkError) {
              console.error('Failed to auto-link teacher to user:', serializeSupabaseError(linkError))
              return NextResponse.json({
                ok: false,
                error: 'Teacher record found but failed to link to user account. Please contact administrator.',
                teacherRecord: teacherByEmail,
                linkError: serializeSupabaseError(linkError)
              }, { status: 500 })
            }
            
            console.log(`✅ Successfully auto-linked teacher ${teacherByEmail.id} to user ${teacherId}`)
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
              .select('id, user_id, teacher_id, email')
              .eq('teacher_id', userProfile.role_specific_id)
              .maybeSingle()
            
            if (!teacherByIdError && teacherById) {
              if (!teacherById.user_id) {
                console.log(`🔧 Auto-repair: Linking teacher ${teacherById.id} (${teacherById.teacher_id}) to user ${teacherId}`)
                const { error: linkError } = await supabase
                  .from('teachers')
                  .update({ user_id: teacherId })
                  .eq('id', teacherById.id)
                
                if (!linkError) {
                  console.log(`✅ Successfully auto-linked teacher ${teacherById.id} to user ${teacherId}`)
                  teacherRecord = { ...teacherById, user_id: teacherId }
                  teacherRecordError = null
                } else {
                  console.error('Failed to auto-link teacher by teacher_id:', serializeSupabaseError(linkError))
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
    } else if (teacherRecord) {
      console.log('Found teacher record:', { id: teacherRecord.id, user_id: teacherRecord.user_id, teacher_id: teacherRecord.teacher_id })
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
        console.error('Error loading class teacher classes:', serializeSupabaseError(classTeacherError))
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
          name: entry.className,
          level: entry.level,
          subsystem: entry.subsystem,
          branch: entry.branch,
          subjects: entry.subjects,
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
        console.error('Error loading classes from class_teachers junction:', serializeSupabaseError(classTeachersError))
      } else if (classTeachers) {
        console.log(`Found ${classTeachers.length} classes from class_teachers junction table`)
        classesFromJunction = (classTeachers || []).map((ct: any) => {
          const cls = ct.classes
          if (!cls) {
            console.warn('Class not found for class_teachers entry:', ct.class_id)
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
        console.log('No classes found in class_teachers junction table for teacher:', teacherRecord.id)
      }
    } else {
      console.warn('Cannot fetch classes from junction table - teacher record not found or error occurred')
    }

    // Combine all classes and remove duplicates
    const allClasses = [...classesAsClassTeacher, ...classesFromTimetable, ...classesFromJunction]
    const uniqueClasses = Array.from(
      new Map(allClasses.map((cls) => [cls.id, cls])).values()
    )

    // Fetch students and subjects for each class
    const classesWithDetails = await Promise.all(
      uniqueClasses.map(async (cls) => {
        // Fetch students for this class (all statuses)
        // Query by both class ID (UUID) and class name to handle data format inconsistencies
        // Some students may have class stored as UUID, others as class name
        // Use two queries and merge results to handle both formats
        const [studentsByIdResult, studentsByNameResult] = await Promise.all([
          // Query by class ID (UUID format)
          supabase
            .from('students')
            .select(`
              id,
              student_id,
              first_name,
              last_name,
              email,
              phone,
              photo,
              status,
              date_of_birth,
              address,
              parent_name,
              parent_phone,
              parent_email,
              class
            `)
            .eq('class', cls.id),
          // Query by class name (for backward compatibility)
          supabase
            .from('students')
            .select(`
              id,
              student_id,
              first_name,
              last_name,
              email,
              phone,
              photo,
              status,
              date_of_birth,
              address,
              parent_name,
              parent_phone,
              parent_email,
              class
            `)
            .eq('class', cls.name)
        ])

        // Merge results and remove duplicates (by student id)
        const studentsById = studentsByIdResult.data || []
        const studentsByName = studentsByNameResult.data || []
        const studentsMap = new Map()
        
        // Add students found by ID
        studentsById.forEach((student: any) => {
          studentsMap.set(student.id, student)
        })
        
        // Add students found by name (won't overwrite if already added)
        studentsByName.forEach((student: any) => {
          if (!studentsMap.has(student.id)) {
            studentsMap.set(student.id, student)
          }
        })
        
        const studentsData = Array.from(studentsMap.values())

        // Log errors
        if (studentsByIdResult.error) {
          console.error(`Error loading students by ID for class ${cls.id}:`, serializeSupabaseError(studentsByIdResult.error))
        }
        if (studentsByNameResult.error) {
          console.error(`Error loading students by name for class ${cls.name}:`, serializeSupabaseError(studentsByNameResult.error))
        }

        // Log for debugging and monitoring
        if (studentsData.length > 0) {
          const studentsByClassId = studentsById.length
          const studentsByClassName = studentsByName.length
          console.log(`Class ${cls.name} (${cls.id}): Found ${studentsData.length} total students (${studentsByClassId} by ID, ${studentsByClassName} by name)`)
        }

        // Transform students data and map status to enrollmentStatus
        const students = (studentsData || []).map((student: any) => {
          // Map database status to enrollmentStatus
          let enrollmentStatus: 'enrolled' | 'pending' | 'transferred' = 'enrolled'
          if (student.status === 'active' || student.status === 'enrolled') {
            enrollmentStatus = 'enrolled'
          } else if (student.status === 'pending') {
            enrollmentStatus = 'pending'
          } else if (student.status === 'transferred' || student.status === 'inactive') {
            enrollmentStatus = 'transferred'
          }

          return {
            id: student.id,
            studentId: student.student_id || '',
            firstName: student.first_name || '',
            lastName: student.last_name || '',
            email: student.email || '',
            phone: student.phone || undefined,
            photo: student.photo || undefined,
            enrollmentStatus,
            parentName: student.parent_name || undefined,
            parentPhone: student.parent_phone || undefined,
            parentEmail: student.parent_email || undefined,
            dateOfBirth: student.date_of_birth || undefined,
            address: student.address || undefined,
          }
        })

        // Fetch subjects for this class from class_subjects table
        const { data: classSubjectsData, error: classSubjectsError } = await supabase
          .from('class_subjects')
          .select(`
            id,
            subject_id,
            is_trade_subject,
            subjects (
              id,
              name,
              code,
              coefficient,
              description,
              is_active
            )
          `)
          .eq('class_id', cls.id)

        if (classSubjectsError) {
          console.error(`Error loading subjects for class ${cls.id}:`, serializeSupabaseError(classSubjectsError))
        }

        // Transform subjects data
        const classSubjects = (classSubjectsData || []).map((cs: any) => {
          const subject = cs.subjects
          if (!subject) {
            return null
          }
          return {
            id: subject.id || cs.subject_id || `sub_${subject.name}`,
            name: subject.name || 'Unknown Subject',
            code: subject.code || subject.name?.substring(0, 4).toUpperCase() || 'N/A',
            coefficient: subject.coefficient || 1,
            description: subject.description || undefined,
          }
        }).filter(Boolean)

        // If no subjects from class_subjects, use subjects from timetable or class data
        let finalSubjects = classSubjects
        if (classSubjects.length === 0 && cls.subjects && Array.isArray(cls.subjects)) {
          // Convert subject names to subject objects
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
    )

    // Log summary for debugging
    console.log('Teacher assignments summary:', {
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
      totalSubjects: classesWithDetails.reduce((sum, cls) => sum + (cls.subjects?.length || 0), 0),
    })

    return NextResponse.json({
      ok: true,
      teacher: {
        id: user.id,
        name: user.name,
      },
      subjects,
      classes: classesWithDetails,
    })
  } catch (error) {
    console.error('Error in GET /api/teachers/[id]/assignments:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

