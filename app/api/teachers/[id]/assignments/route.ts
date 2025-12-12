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
    let { data: teacherRecord, error: teacherRecordError } = await supabase
      .from('teachers')
      .select('id, user_id, teacher_id, subjects, classes')
      .eq('user_id', teacherId)
      .single()

    // Fallback logic for finding teacher record (same as original)
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
          if (!teacherByEmail.user_id) {
            const { error: linkError } = await supabase
              .from('teachers')
              .update({ user_id: teacherId })
              .eq('id', teacherByEmail.id)
            
            if (linkError) {
              return NextResponse.json({
                ok: false,
                error: 'Teacher record found but failed to link to user account.',
                teacherRecord: teacherByEmail,
                linkError: serializeSupabaseError(linkError)
              }, { status: 500 })
            }
            teacherRecord = { ...teacherByEmail, user_id: teacherId }
            teacherRecordError = null
          } else {
            teacherRecord = teacherByEmail
            teacherRecordError = null
          }
        } else {
          // Try finding by teacher_id from user_profiles
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
                teacherRecord = teacherById
                teacherRecordError = null
              }
            }
          }
        }
      }
    }

    // START PARALLEL DATA FETCHING
    const teacherRecordId = teacherRecord?.id
    const teacherRecordClasses = teacherRecord?.classes || []
    const teacherRecordSubjects = teacherRecord?.subjects || []

    const [
      teacherSubjectsResult,
      classTeacherClassesResult,
      junctionClassesResult,
      timetableDataResult,
      namedClassesResult
    ] = await Promise.all([
      // 1. Get teacher's assigned subjects
      teacherRecordId ? supabase
        .from('teacher_subjects')
        .select(`
          id, teacher_id, subject_id, subject_name, sub_branch_id, assignment_type, is_active, created_at,
          subjects (id, name, code),
          subject_sub_branches (id, name)
        `)
        .eq('teacher_id', teacherRecordId)
        .eq('is_active', true) : Promise.resolve({ data: [], error: null }),

      // 2. Get classes where teacher is the class teacher
      teacherRecordId ? supabase
        .from('classes')
        .select(`
          id, class_name, class_level, subsystem, stream, academic_year, capacity, current_enrollment, status
        `)
        .eq('class_teacher_id', teacherRecordId)
        .eq('status', 'active') : Promise.resolve({ data: [], error: null }),

      // 3. Get classes from class_teachers junction table
      teacherRecordId ? supabase
        .from('class_teachers')
        .select(`
          class_id, teacher_row_id,
          classes (
            id, class_name, class_level, subsystem, stream, academic_year, capacity, current_enrollment, status
          )
        `)
        .eq('teacher_row_id', teacherRecordId) : Promise.resolve({ data: [], error: null }),

      // 4. Get classes from timetable - REMOVED
      Promise.resolve({ classes: [] }),

      // 5. Get named classes from teachers table array
      (teacherRecordClasses && teacherRecordClasses.length > 0) ? supabase
        .from('classes')
        .select(`
          id, class_name, class_level, subsystem, stream, academic_year, capacity, current_enrollment, status
        `)
        .in('class_name', teacherRecordClasses)
        .eq('status', 'active') : Promise.resolve({ data: [], error: null })
    ])

    // PROCESS RESULTS

    // 1. Process Subjects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subjects: any[] = []
    const teacherSubjects = teacherSubjectsResult.data || []
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subjects = teacherSubjects.map((ts: any) => ({
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

    // Additional subjects from teachers table array
    if (teacherRecordSubjects.length > 0) {
       // Fetch subject codes for these names
       const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name, code')
        .in('name', teacherRecordSubjects)
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subjectsMap = new Map((subjectsData || []).map((s: any) => [s.name, s]))
       const existingSubjectNames = new Set(subjects.map(s => s.subjectName))

       teacherRecordSubjects.forEach((subjectName: string, index: number) => {
         // @ts-ignore - string vs unknown
         if (!existingSubjectNames.has(subjectName)) {
           const subjectData = subjectsMap.get(subjectName)
           subjects.push({
             id: `teachers-table-${teacherRecordId}-${index}`,
             subjectId: subjectData?.id || null,
             subjectName: subjectName as string,
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

    // 2. Process Classes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classesAsClassTeacher = (classTeacherClassesResult.data || []).map((cls: any) => ({
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classesFromJunction = (junctionClassesResult.data || []).map((ct: any) => {
      const cls = ct.classes
      if (!cls) return null
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

    const classesFromTimetable = timetableDataResult.classes || []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classesFromTeachersTable = (namedClassesResult.data || []).map((cls: any) => ({
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

    // Combine and Deduplicate
    const allClasses = [
      ...classesAsClassTeacher, 
      ...classesFromTimetable, 
      ...classesFromJunction, 
      ...classesFromTeachersTable
    ]
    const uniqueClasses = Array.from(
      new Map(allClasses.filter((c): c is NonNullable<typeof c> => !!c && !!c.id).map((cls) => [cls.id, cls])).values()
    )

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedClasses = uniqueClasses.slice(startIndex, endIndex)
    const totalClasses = uniqueClasses.length
    const hasMore = endIndex < totalClasses

    // RESPONSE GENERATION

    if (summaryOnly) {
      return NextResponse.json({
        ok: true,
        teacher: { id: user.id, name: user.name },
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
        classes: paginatedClasses.filter((c): c is NonNullable<typeof c> => !!c).map(cls => ({
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
        pagination: { page, limit, total: totalClasses, hasMore },
      })
    }



    // DETAILED FETCH (Students & Subjects per Class)
    // Optimized batch queries for students and subjects
    const classIds = paginatedClasses.map(cls => cls.id)
    const classNames = paginatedClasses.map(cls => cls.name).filter(Boolean)
    
    const [studentsByClassIdResult, studentsByClassNameResult, studentsByClassColumnResult, classStudentsJunctionResult] = await Promise.all([
      // Method 1: Query via students.class column matching class IDs
      classIds.length > 0 ? supabase
          .from('students')
          .select(`id, student_id, first_name, last_name, email, phone, status, date_of_birth, address, class, class_id, class_name, enrollment_status`)
          .in('class', classIds)
          .eq('status', 'active') : { data: [], error: null },
      // Method 2: Query via students.class column matching class names
      classNames.length > 0 ? supabase
          .from('students')
          .select(`id, student_id, first_name, last_name, email, phone, status, date_of_birth, address, class, class_id, class_name, enrollment_status`)
          .in('class', classNames)
          .eq('status', 'active') : { data: [], error: null },
      // Method 3: Query ALL active students and filter later (fallback)
      supabase
          .from('students')
          .select(`id, student_id, first_name, last_name, email, phone, status, date_of_birth, address, class, class_id, class_name, enrollment_status`)
          .eq('status', 'active'),
      // Method 4: Query via class_students junction table
      classIds.length > 0 ? supabase
          .from('class_students')
          .select(`class_id, students (id, student_id, first_name, last_name, email, phone, status, date_of_birth, address, class, class_id, class_name, enrollment_status)`)
          .in('class_id', classIds) : { data: [], error: null }
    ])

    const studentsByClassId = studentsByClassIdResult.data || []
    const studentsByClassName = studentsByClassNameResult.data || []
    const allActiveStudents = studentsByClassColumnResult.data || []
    const classStudentsJunction = classStudentsJunctionResult.data || []

    // Batch fetch parents
    const allStudentIds = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classStudentsJunction.forEach((j: any) => j.students?.student_id && allStudentIds.add(j.students.student_id))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentsByClassId.forEach((s: any) => s.student_id && allStudentIds.add(s.student_id))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentsByClassName.forEach((s: any) => s.student_id && allStudentIds.add(s.student_id))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allActiveStudents.forEach((s: any) => s.student_id && allStudentIds.add(s.student_id))
    
    const studentIds = Array.from(allStudentIds).filter(Boolean)
    
    // Only fetch parents if details are requested
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parentsByStudentId: any = new Map()
    if (includeDetails) {
      parentsByStudentId = await fetchParentsForStudents(supabase, studentIds)
    }

    // Fetch assignments for class subjects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allTeacherAssignmentsData: any[] = []
    if (classIds.length > 0 && teacherRecordId) {
       const { data: assignmentsData } = await supabase
        .from('teacher_branch_assignments')
        .select(`
          id, class_id, is_primary_teacher, academic_year, term, branch_id,
          subject_branches (id, branch_name, branch_code, subject_id)
        `)
        .eq('teacher_id', teacherRecordId)
        .in('class_id', classIds)
        
       if (assignmentsData && assignmentsData.length > 0) {
         const subjectIds = assignmentsData
          .map(a => (Array.isArray(a.subject_branches) ? a.subject_branches[0] : a.subject_branches)?.subject_id)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)

         if (subjectIds.length > 0) {
            const { data: subjectsData } = await supabase
              .from('subjects')
              .select('id, subject_name, subject_code, coefficient, description')
              .in('id', subjectIds)
              
            const subjectMap = new Map((subjectsData || []).map(s => [s.id, s]))
            
            allTeacherAssignmentsData = assignmentsData.map(assignment => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const branches = assignment.subject_branches as any
              const subjectId = Array.isArray(branches) ? branches[0]?.subject_id : branches?.subject_id
              const subject = subjectId ? subjectMap.get(subjectId) : null
              return {
                ...assignment,
                subject_branches: assignment.subject_branches ? {
                  ...assignment.subject_branches,
                  subjects: subject || null
                } : null
              }
            })
         }
       }
    }
    
    // Fallback class subjects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let classSubjectsData: any[] = []
    if (classIds.length > 0) {
      const { data } = await supabase
        .from('class_subjects')
        .select(`class_id, subject_id, subjects (id, name, code, coefficient, description)`)
        .in('class_id', classIds)
      if (data) classSubjectsData = data
    }

    // Map students to classes
    const allStudentsMap = new Map<string, any[]>()
    paginatedClasses.forEach(cls => allStudentsMap.set(cls.id, []))

    const addStudentToMap = (student: any, classId: string) => {
      const existing = allStudentsMap.get(classId) || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!existing.find((s: any) => s.id === student.id)) {
        existing.push({ ...student, enrollment_status: student.enrollment_status || 'enrolled' })
        allStudentsMap.set(classId, existing)
      }
    }

    // 1. Junction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classStudentsJunction.forEach((j: any) => {
      if (j.students && allStudentsMap.has(j.class_id)) addStudentToMap(j.students, j.class_id)
    })
    // 2. Class ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentsByClassId.forEach((s: any) => {
        // logic to match s.class to class ID
        if (!s.class) return
        let matchingClass = paginatedClasses.find(cls => cls.id === s.class)
        if (!matchingClass) matchingClass = paginatedClasses.find(cls => cls.id?.toString().toLowerCase() === s.class.toString().toLowerCase())
        if (matchingClass) addStudentToMap(s, matchingClass.id)
    })
    // 3. Class Name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentsByClassName.forEach((s: any) => {
        if (!s.class) return
        let matchingClass = paginatedClasses.find(cls => cls.name?.toLowerCase() === s.class?.toLowerCase())
        if (!matchingClass) {
             matchingClass = paginatedClasses.find(cls => {
              const cName = cls.name?.toLowerCase() || ''
              const sClass = s.class?.toLowerCase() || ''
              return cName.includes(sClass) || sClass.includes(cName)
            })
        }
        if (matchingClass) addStudentToMap(s, matchingClass.id)
    })
    // 4. Fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allActiveStudents.forEach((s: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alreadyMatched = Array.from(allStudentsMap.values()).some(list => list.some((existing: any) => existing.id === s.id))
      if (alreadyMatched) return
      
      const sVal = s.class || s.class_id || s.class_name
      if (!sVal) return
      
      // Try match ID
      let matchingClass = paginatedClasses.find(cls => cls.id === sVal)
      if (!matchingClass) matchingClass = paginatedClasses.find(cls => cls.id?.toString().toLowerCase() === sVal.toString().toLowerCase())
      // Try match Name
      if (!matchingClass) matchingClass = paginatedClasses.find(cls => cls.name?.toLowerCase() === sVal?.toLowerCase())
      // Try partial
      if (!matchingClass) {
         matchingClass = paginatedClasses.find(cls => {
              const cName = cls.name?.toLowerCase() || ''
              const sValLower = sVal?.toLowerCase() || ''
              return cName.includes(sValLower) || sValLower.includes(cName)
         })
      }
      if (matchingClass) addStudentToMap(s, matchingClass.id)
    })

    // Map subjects to classes
    const subjectsByClass = new Map<string, any[]>()
    paginatedClasses.forEach(cls => subjectsByClass.set(cls.id, []))

    if (allTeacherAssignmentsData.length > 0) {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       allTeacherAssignmentsData.forEach((assignment: any) => {
         const classId = assignment.class_id
         if (subjectsByClass.has(classId)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subjectData = assignment.subject_branches?.subjects
            if (subjectData && subjectData.subject_name) {
               const existingSubjects = subjectsByClass.get(classId) || []
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const exists = existingSubjects.some((s: any) => s.id === subjectData.id || s.name === subjectData.subject_name)
               if (!exists) {
                 subjectsByClass.get(classId)!.push({
                   id: subjectData.id || `sub_${subjectData.subject_name}`,
                   name: subjectData.subject_name || 'Unknown Subject',
                   code: subjectData.subject_code || 'N/A',
                   coefficient: subjectData.coefficient || 1,
                   description: subjectData.description
                 })
               }
            }
         }
       })
    }

    // Fallback Subjects
    if (classSubjectsData.length > 0) {
       const teacherSubjectIds = new Set(subjects.map(s => s.subjectId))
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       classSubjectsData.forEach((cs: any) => {
          if (cs.class_id && cs.subjects) {
             if (subjectsByClass.has(cs.class_id)) {
                const existing = subjectsByClass.get(cs.class_id) || []
                // Logic:
                // 1. If specific assignments exist (length > 0), only add if teacher is assigned this subject
                // 2. If NO specific assignments exist (length === 0), add ALL class subjects (so teacher sees what subjects the class has)
                // 3. OR if teacherSubjectIds has it, add it (covers mixed cases)
                
                const isAssignedToTeacher = teacherSubjectIds.has(cs.subjects.id)
                
                if (isAssignedToTeacher) {
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   if (!existing.some((s: any) => s.id === cs.subjects.id)) {
                      subjectsByClass.get(cs.class_id)!.push({
                         id: cs.subjects.id,
                         name: cs.subjects.name,
                         code: cs.subjects.code,
                         coefficient: cs.subjects.coefficient,
                         description: cs.subjects.description
                      })
                   }
                }
             }
          }
       })
    }

    // Final Assembly
    const classesWithDetails = paginatedClasses.map((cls) => {
      if (!cls) return null
      const studentsRaw = allStudentsMap.get(cls.id) || []
      // Dedup students
      const uniqueStudentsMap = new Map()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      studentsRaw.forEach((s: any) => uniqueStudentsMap.set(s.id, s))
      const uniqueStudents = Array.from(uniqueStudentsMap.values())
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const students = uniqueStudents.map((student: any) => {
         let enrollmentStatus: 'enrolled' | 'pending' | 'transferred' = 'enrolled'
         if (student.enrollment_status) {
             const s = student.enrollment_status.toString().toLowerCase().trim()
             if (s === 'pending') enrollmentStatus = 'pending'
             else if (s === 'transferred' || s === 'inactive') enrollmentStatus = 'transferred'
         } else if (student.status) {
             const s = student.status.toString().toLowerCase().trim()
             if (s === 'pending') enrollmentStatus = 'pending'
             else if (s === 'transferred' || s === 'inactive') enrollmentStatus = 'transferred'
         }

         const parentInfo = getParentInfoForStudent(student.student_id, parentsByStudentId)
         return {
            id: student.id,
            studentId: student.student_id || '',
            firstName: student.first_name || '',
            lastName: student.last_name || '',
            email: student.email || '',
            phone: student.phone || undefined,
            enrollmentStatus,
            parentName: parentInfo.parentName,
            parentPhone: parentInfo.parentPhone,
            parentEmail: parentInfo.parentEmail,
            dateOfBirth: student.date_of_birth || undefined,
            address: student.address || undefined
         }
      })

      const finalSubjects = subjectsByClass.get(cls.id) || []
      /*
      // Removed invalid fallback: 'subjects' property does not exist on class records fetched above
      if (finalSubjects.length === 0 && cls.subjects && Array.isArray(cls.subjects)) {
         finalSubjects = cls.subjects.map((subjectName: string) => ({
            id: `sub_${subjectName}`,
            name: subjectName,
            code: subjectName.substring(0, 4).toUpperCase(),
            coefficient: 1
         }))
      }
      */

      return {
        ...cls,
        students: includeDetails ? students : [],
        studentCount: students.length,
        subjects: finalSubjects
      }
    }).filter(Boolean)

    return NextResponse.json({
      ok: true,
      teacher: { id: user.id, name: user.name },
      subjects,
      classes: classesWithDetails,
      pagination: { page, limit, total: totalClasses, hasMore },
    })

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in GET /api/teachers/[id]/assignments:', serializeSupabaseError(error as any))
    return NextResponse.json(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}
