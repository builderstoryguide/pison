import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveTeacherId } from '@/lib/teacher-lookup'
import { getAcademicYearFromConfig } from '@/lib/app-config-server'
import { 
  TeacherDataResponse, 
  TeacherDataState, 
  TeacherClass,
  TeacherClassStudent,
  ClassSubject,
  ClassAssignment,
  Assessment,
  Grade,
} from '@/lib/teacher-ultra-fast/types'

// Ultra-fast cache with Redis-like performance
interface UltraFastCache {
  data: any
  timestamp: number
  ttl: number
  hits: number
}

const ultraFastCache = new Map<string, UltraFastCache>()

// Ultra-short TTL for real-time data (30 seconds)
const ULTRA_FAST_TTL = 30 * 1000

// Cache key generator with versioning
function generateUltraFastCacheKey(teacherId: string, academicYear?: string, term?: string): string {
  const version = 'v2'
  return `ultra_fast:${version}:${teacherId}:${academicYear || 'all'}:${term || 'all'}`
}

// Ultra-fast cache operations
function getUltraFastCache(key: string): { data: any; hit: boolean } {
  const cached = ultraFastCache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    cached.hits++
    console.log(`🚀 ULTRA-FAST Cache HIT (${cached.hits} hits): ${key}`)
    return { data: cached.data, hit: true }
  }
  
  if (cached) {
    console.log(`⏰ ULTRA-FAST Cache EXPIRED: ${key}`)
    ultraFastCache.delete(key)
  }
  
  return { data: null, hit: false }
}

function setUltraFastCache(key: string, data: any, ttl: number = ULTRA_FAST_TTL): void {
  ultraFastCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    hits: 0
  })
  console.log(`💾 ULTRA-FAST Cache SET: ${key}`)
}

// Ultra-optimized data transformer
async function ultraFastTransform(rawData: any): Promise<TeacherDataState> {
  // Transform and optimize data structure
  const classes = new Map<string, TeacherClass>()
  const students = new Map<string, TeacherClassStudent>()
  const subjects = new Map<string, ClassSubject>()
  const assignments = new Map<string, ClassAssignment>()
  
  // Process classes with optimized structure
  if (rawData.classes) {
    rawData.classes.forEach((cls: any) => {
      const classStudents = cls.students?.map((enrollment: any) => ({
        id: enrollment.student.id,
        studentId: enrollment.student.student_id,
        firstName: enrollment.student.first_name,
        lastName: enrollment.student.last_name,
        email: enrollment.student.email,
        photo: null, // Photo column doesn't exist in students table
        enrollmentStatus: enrollment.enrollment_status === 'enrolled' ? 'enrolled' : enrollment.enrollment_status,
        enrollmentDate: enrollment.enrolled_at || new Date().toISOString(),
        phone: enrollment.student.phone,
        parentName: enrollment.student.parent_name,
        parentPhone: enrollment.student.parent_phone,
        parentEmail: enrollment.student.parent_email,
        grades: {
          totalAssessments: enrollment.grades?.total_assessments || 0,
          averageGrade: enrollment.grades?.average_grade || 0,
          highestGrade: enrollment.grades?.highest_grade || 0,
          lowestGrade: enrollment.grades?.lowest_grade || 0,
          gradeDistribution: enrollment.grades?.grade_distribution || {},
          lastGrade: enrollment.grades?.last_grade || new Date().toISOString()
        }
      })) || []
      
      // Store students in global map
      classStudents.forEach((student: TeacherClassStudent) => {
        students.set(student.id, student)
      })
      
      const optimizedClass: TeacherClass = {
        id: cls.id,
        name: cls.class_name || cls.name,
        level: cls.class_level || cls.level,
        subsystem: cls.subsystem || 'english',
        branch: cls.branch || 'grammar',
        code: cls.code,
        academicYear: cls.academic_year || cls.academicYear || defaultAcademicYear,
        capacity: cls.capacity || 0,
        currentEnrollment: cls.current_enrollment || cls.currentEnrollment || classStudents.length,
        room: cls.room,
        students: classStudents,
        subjects: cls.subjects?.map((subject: any) => ({
          id: subject.id,
          name: subject.subject_name || subject.name,
          code: subject.subject_code || subject.code,
          coefficient: subject.coefficient || 1,
          description: subject.description,
          teacherId: subject.teacher_id || subject.teacherId,
          isPrimary: subject.is_primary || subject.isPrimary || false,
          schedule: subject.schedule || []
        })) || [],
        schedule: cls.schedule?.map((schedule: any) => ({
          id: schedule.id,
          day: schedule.day,
          startTime: schedule.start_time || schedule.startTime,
          endTime: schedule.end_time || schedule.endTime,
          subject: schedule.subject,
          subjectId: schedule.subject_id || schedule.subjectId,
          room: schedule.room,
          period: schedule.period,
          isActive: schedule.is_active !== false
        })) || [],
        assignments: cls.assignments?.map((assignment: any) => ({
          id: assignment.id,
          teacherId: assignment.teacher_id || assignment.teacherId,
          branchId: assignment.branch_id || assignment.branchId,
          classId: assignment.class_id || assignment.classId,
          subjectId: assignment.subject_id || assignment.subjectId,
          isPrimary: assignment.is_primary || assignment.isPrimary || false,
          academicYear: assignment.academic_year || assignment.academicYear || defaultAcademicYear,
          term: assignment.term || 'Term 1',
          createdAt: assignment.created_at || assignment.createdAt || new Date().toISOString()
        })) || [],
        performance: {
          averageGrade: cls.performance?.average_grade || 0,
          totalAssessments: cls.performance?.total_assessments || 0,
          completedAssessments: cls.performance?.completed_assessments || 0,
          lastActivity: cls.performance?.last_activity || new Date().toISOString()
        }
      }
      
      classes.set(cls.id, optimizedClass)
    })
  }
  
  // Process subjects
  if (rawData.subjects) {
    rawData.subjects.forEach((subject: any) => {
      subjects.set(subject.id, {
        id: subject.id,
        name: subject.subject_name || subject.name,
        code: subject.subject_code || subject.code,
        coefficient: subject.coefficient || 1,
        description: subject.description,
        teacherId: subject.teacher_id || subject.teacherId,
        isPrimary: subject.is_primary || subject.isPrimary || false,
        schedule: subject.schedule || []
      })
    })
  }
  
  // Process assignments
  if (rawData.assignments) {
    rawData.assignments.forEach((assignment: any) => {
      assignments.set(assignment.id, {
        id: assignment.id,
        teacherId: assignment.teacher_id || assignment.teacherId,
        branchId: assignment.branch_id || assignment.branchId,
        classId: assignment.class_id || assignment.classId,
        subjectId: assignment.subject_id || assignment.subjectId,
        isPrimary: assignment.is_primary || assignment.isPrimary || false,
        academicYear: assignment.academic_year || assignment.academicYear || '2024-2025',
        term: assignment.term || 'Term 1',
        createdAt: assignment.created_at || assignment.createdAt || new Date().toISOString()
      })
    })
  }
  
  // Convert Maps to serializable objects just before returning
  const classesObj = Object.fromEntries(classes)
  const studentsObj = Object.fromEntries(students)
  const subjectsObj = Object.fromEntries(subjects)
  const assignmentsObj = Object.fromEntries(assignments)
  
  
  const gradesAssessmentsObj = Object.fromEntries(new Map(rawData.assessments?.map((assessment: any) => [
    assessment.id,
    {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      subjectId: assessment.subject_id,
      subjectName: assessment.subject_name || '',
      classId: assessment.class_id,
      className: assessment.class_name || '',
      totalMarks: assessment.total_marks,
      date: assessment.date,
      dueDate: assessment.due_date,
      description: assessment.description,
      status: assessment.status,
      createdAt: assessment.created_at,
      publishedAt: assessment.published_at,
      completedAt: assessment.completed_at,
      statistics: {
        totalStudents: assessment.total_students || 0,
        submittedCount: assessment.grades?.length || 0,
        averageGrade: assessment.grades?.length > 0 ? 
          assessment.grades.reduce((sum: number, grade: any) => sum + grade.percentage, 0) / assessment.grades.length : 0,
        highestGrade: assessment.grades?.length > 0 ? 
          Math.max(...assessment.grades.map((g: any) => g.percentage)) : 0,
        lowestGrade: assessment.grades?.length > 0 ? 
          Math.min(...assessment.grades.map((g: any) => g.percentage)) : 0,
        passRate: assessment.grades?.length > 0 ? 
          (assessment.grades.filter((g: any) => g.percentage >= 50).length / assessment.grades.length) * 100 : 0,
        gradeDistribution: assessment.grades?.reduce((acc: any, grade: any) => {
          acc[grade.grade] = (acc[grade.grade] || 0) + 1
          return acc
        }, {}) || {}
      }
    }
  ]) || []))
  
  const gradesObj = Object.fromEntries(new Map(rawData.grades?.map((grade: any) => [
    grade.id,
    {
      id: grade.id,
      assessmentId: grade.assessment_id,
      studentId: grade.student_id,
      studentName: grade.student ? `${grade.student.first_name} ${grade.student.last_name}` : '',
      marks: grade.marks,
      percentage: grade.percentage,
      grade: grade.grade,
      remarks: grade.remarks,
      submittedAt: grade.submitted_at,
      // gradedAt field removed - column doesn't exist in database
    }
  ]) || []))
  
  const assessmentsAssessmentsObj = Object.fromEntries(new Map(rawData.assessments?.map((assessment: any) => [
    assessment.id,
    {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      subjectId: assessment.subject_id,
      subjectName: assessment.subject_name || '',
      classId: assessment.class_id,
      className: assessment.class_name || '',
      totalMarks: assessment.total_marks,
      date: assessment.date,
      dueDate: assessment.due_date,
      description: assessment.description,
      status: assessment.status,
      createdAt: assessment.created_at,
      publishedAt: assessment.published_at,
      completedAt: assessment.completed_at,
      statistics: {
        totalStudents: assessment.total_students || 0,
        submittedCount: assessment.grades?.length || 0,
        averageGrade: assessment.grades?.length > 0 ? 
          assessment.grades.reduce((sum: number, grade: any) => sum + grade.percentage, 0) / assessment.grades.length : 0,
        highestGrade: assessment.grades?.length > 0 ? 
          Math.max(...assessment.grades.map((g: any) => g.percentage)) : 0,
        lowestGrade: assessment.grades?.length > 0 ? 
          Math.min(...assessment.grades.map((g: any) => g.percentage)) : 0,
        passRate: assessment.grades?.length > 0 ? 
          (assessment.grades.filter((g: any) => g.percentage >= 50).length / assessment.grades.length) * 100 : 0,
        gradeDistribution: assessment.grades?.reduce((acc: any, grade: any) => {
          acc[grade.grade] = (acc[grade.grade] || 0) + 1
          return acc
        }, {}) || {}
      }
    }
  ]) || []))
  
  return {
    teacher: {
      id: rawData.teacher_id || rawData.teacherId,
      teacherId: rawData.teacher_id || rawData.teacherId,
      name: rawData.teacher_name || rawData.teacherName || 'Teacher Name',
      email: rawData.teacher_email || rawData.teacherEmail || '',
      phone: rawData.teacher_phone || rawData.teacherPhone,
      photo: rawData.teacher_photo || rawData.teacherPhoto,
      subsystem: rawData.teacher_subsystem || rawData.teacherSubsystem || 'english',
      employmentType: rawData.employment_type || rawData.employmentType || 'full-time',
      status: 'active',
      createdAt: rawData.created_at || rawData.createdAt || new Date().toISOString(),
      lastLoginAt: rawData.last_login_at || rawData.lastLoginAt
    },
    classes: classesObj,
    students: studentsObj,
    subjects: subjectsObj,
    assignments: assignmentsObj,
    grades: {
      assessments: gradesAssessmentsObj as Record<string, Assessment>,
      grades: gradesObj as Record<string, Grade>,
      statistics: {
        totalAssessments: rawData.statistics?.total_assessments || 0,
        totalGrades: rawData.statistics?.total_grades || 0,
        averageGrade: rawData.statistics?.average_grade || 0,
        pendingGrades: rawData.statistics?.pending_grades || 0,
        completedAssessments: rawData.assessments?.filter((a: any) => a.status === 'completed').length || 0
      },
      lastUpdated: new Date().toISOString()
    },
    assessments: {
      assessments: assessmentsAssessmentsObj as Record<string, Assessment>,
      statistics: {
        totalStudents: rawData.statistics?.total_students || 0,
        submittedCount: rawData.grades?.length || 0,
        averageGrade: rawData.statistics?.average_grade || 0,
        highestGrade: rawData.grades?.length > 0 ? 
          Math.max(...rawData.grades.map((g: any) => g.percentage)) : 0,
        lowestGrade: rawData.grades?.length > 0 ? 
          Math.min(...rawData.grades.map((g: any) => g.percentage)) : 0,
        passRate: rawData.grades?.length > 0 ? 
          (rawData.grades.filter((g: any) => g.percentage >= 50).length / rawData.grades.length) * 100 : 0,
        gradeDistribution: rawData.grades?.reduce((acc: any, grade: any) => {
          acc[grade.grade] = (acc[grade.grade] || 0) + 1
          return acc
        }, {}) || {}
      },
      lastUpdated: new Date().toISOString()
    },
    performance: {
      loadTime: 0,
      renderTime: 0,
      cacheHitRate: 0,
      dataFreshness: 0,
      userInteractions: 0,
      apiResponseTime: 0,
      memoryUsage: 0
    },
    cache: {
      version: 'v2',
      lastUpdated: new Date().toISOString(),
      ttl: ULTRA_FAST_TTL,
      hits: 0,
      misses: 0,
      size: Object.keys(classesObj).length + Object.keys(studentsObj).length + Object.keys(subjectsObj).length + Object.keys(assignmentsObj).length
    }
  }
}

// Ultra-fast database query with optimization
async function getUltraFastTeacherData(teacherId: string): Promise<any> {
  const supabase = await createClient()
  const startTime = performance.now()
  
  try {
    // First, map the user ID to teacher ID if needed
    let actualTeacherId = teacherId
    
    // If it's a UUID, we need to map it to the teachers table
    if (teacherId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('🔄 Mapping user ID to teacher ID for optimized function:', teacherId)
      
      // Get the role_specific_id from user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role_specific_id')
        .eq('user_id', teacherId)
        .single()
      
      if (profileError || !userProfile) {
        console.error('❌ User profile not found for optimized function:', profileError)
        
        // Check if user exists in users table
        const { data: user } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', teacherId)
          .single()
        
        // If user exists but profile is missing, try to find teacher by email
        if (user && user.role === 'teacher') {
          console.log('🔄 User exists but profile missing, attempting fallback for optimized function...')
          
          const { data: existingTeacher, error: teacherSearchError } = await supabase
            .from('teachers')
            .select('id, teacher_id')
            .eq('email', user.email)
            .single()
          
          if (existingTeacher && !teacherSearchError) {
            console.log('✅ Found teacher by email for optimized function:', existingTeacher.id)
            actualTeacherId = existingTeacher.id
          } else {
            console.log('⚠️ No teacher found by email, falling back to comprehensive query')
            return await getFallbackTeacherData(teacherId)
          }
        } else {
          console.log('⚠️ User not found or not a teacher, falling back to comprehensive query')
          return await getFallbackTeacherData(teacherId)
        }
      }
      
      // Get the actual teacher ID from teachers table
      const { data: teacherRecord, error: teacherRecordError } = await supabase
        .from('teachers')
        .select('id')
        .eq('teacher_id', userProfile?.role_specific_id)
        .single()
      
      if (teacherRecordError || !teacherRecord) {
        console.error('❌ Teacher record not found for optimized function:', teacherRecordError)
        return await getFallbackTeacherData(teacherId)
      }
      
      actualTeacherId = teacherRecord.id
      console.log('✅ Mapped to actual teacher ID for optimized function:', actualTeacherId)
    }
    
    // Use the optimized function if available
    const defaultAcademicYear = await getAcademicYearFromConfig()
    const { data, error } = await supabase.rpc('get_teacher_assignments_optimized', {
      p_teacher_id: actualTeacherId,
      p_academic_year: defaultAcademicYear,
      p_term: 'Term 1'
    })
    
    if (error) {
      console.error('Optimized function error:', error)
      console.log('🔄 Falling back to regular queries...')
      // Fallback to regular queries
      return await getFallbackTeacherData(teacherId)
    }
    
    // Check if data is null/undefined before spreading
    if (!data || typeof data !== 'object') {
      console.warn('Optimized function returned null/undefined data, falling back')
      return await getFallbackTeacherData(teacherId)
    }
    
    const queryTime = performance.now() - startTime
    console.log(`⚡ Ultra-fast query completed in ${queryTime.toFixed(2)}ms`)
    
    return {
      ...data,
      performance: {
        queryTimeMs: queryTime,
        source: 'optimized_function'
      }
    }
  } catch (error) {
    console.error('Ultra-fast query error:', error)
    return await getFallbackTeacherData(teacherId)
  }
}

// Comprehensive data fetching from database
async function getFallbackTeacherData(teacherId: string): Promise<any> {
  const supabase = await createClient()
  const startTime = performance.now()
  
  try {
    console.log('🔍 Resolving teacher ID:', teacherId)
    
    // Use the centralized teacher lookup utility
    const teacher = await resolveTeacherId(supabase, teacherId)
    
    if (!teacher) {
      console.log('⚠️ No teacher found for ID:', teacherId)
      return {
        teacher_id: teacherId,
        teacher_name: 'Unknown Teacher',
        teacher_email: '',
        teacher_phone: null,
        teacher_photo: null,
        teacher_subsystem: 'english',
        employment_type: 'full-time',
        classes: [],
        assignments: [],
        subjects: [],
        assessments: [],
        grades: [],
        statistics: {
          total_classes: 0,
          total_students: 0,
          total_assessments: 0,
          total_grades: 0,
          average_grade: 0,
          pending_grades: 0
        },
        performance: {
          queryTimeMs: performance.now() - startTime,
          source: 'fallback_empty_data'
        }
      }
    }
    
    const actualTeacherId = teacher.id
    console.log('✅ Found teacher:', teacher.first_name, teacher.last_name, 'ID:', actualTeacherId)
    
    // Get teacher info using the actual teacher ID
    const { error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', actualTeacherId)
      .single()
    
    if (teacherError) {
      throw teacherError
    }
    
    // Get teacher assignments with optimized joins
    const { data: assignments, error: assignmentsError } = await supabase
      .from('teacher_branch_assignments')
      .select(`
        *,
        branch:subject_branches(
          id,
          subject_id,
          branch_name,
          subject:subjects(
            id,
            subject_name,
            subject_code,
            subsystem
          )
        ),
        class:classes(
          id,
          class_name,
          class_level,
          subsystem,
          branch,
          capacity,
          current_enrollment,
          room
        )
      `)
      .eq('teacher_id', actualTeacherId)
      .eq('academic_year', await getAcademicYearFromConfig())
      .eq('term', 'Term 1')
    
    if (assignmentsError) {
      throw assignmentsError
    }
    
    // Get classes with students
    const classIds = assignments?.map(a => a.class_id).filter(Boolean) || []
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        students:student_branch_enrollments(
          *,
          student:students(
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
        )
      `)
      .in('id', classIds)
    
    if (classesError) {
      throw classesError
    }
    
    
    // Get assessments created by this teacher
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select(`
        *,
        grades(
          *,
          student:students(
            id,
            student_id,
            first_name,
            last_name
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (assessmentsError) {
      console.warn('Assessments error:', assessmentsError)
    }
    
    // Get grades for this teacher
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        *,
        assessment:assessments(
          id,
          title,
          total_marks,
          teacher_id
        ),
        student:students(
          id,
          student_id,
          first_name,
          last_name
        )
      `)
      .eq('assessment.teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (gradesError) {
      console.warn('Grades error:', gradesError)
    }
    
    // Get subjects assigned to this teacher
    const { data: subjects, error: subjectsError } = await supabase
      .from('subject_branches')
      .select(`
        *,
        subject:subjects(
          id,
          subject_name,
          subject_code,
          subsystem
        )
      `)
      .in('id', assignments?.map(a => a.branch_id).filter(Boolean) || [])
    
    if (subjectsError) {
      console.warn('Subjects error:', subjectsError)
    }
    
    
    // Calculate grades statistics
    const totalGrades = grades?.length || 0
    const averageGrade = totalGrades > 0 ? 
      (grades || []).reduce((sum, grade) => sum + grade.percentage, 0) / totalGrades : 0
    const pendingGrades = assessments?.filter(a => a.status === 'published').length || 0
    
    const queryTime = performance.now() - startTime
    console.log(`🔄 Comprehensive database query completed in ${queryTime.toFixed(2)}ms`)
    console.log(`📊 Data summary: ${classes?.length || 0} classes, ${assignments?.length || 0} assignments, ${assessments?.length || 0} assessments`)
    
    return {
      teacher_id: teacherId,
      teacher_name: teacher?.first_name + ' ' + teacher?.last_name,
      teacher_email: teacher?.email,
      teacher_phone: teacher?.phone,
      teacher_photo: teacher?.photo,
      teacher_subsystem: teacher?.subsystem,
      employment_type: teacher?.employment_type,
      classes: classes || [],
      assignments: assignments || [],
      subjects: subjects || [],
      assessments: assessments || [],
      grades: grades || [],
      statistics: {
        total_classes: classes?.length || 0,
        total_students: classes?.reduce((sum, cls) => sum + (cls.students?.length || 0), 0) || 0,
        total_assessments: assessments?.length || 0,
        total_grades: totalGrades,
        average_grade: averageGrade,
        pending_grades: pendingGrades
      },
      performance: {
        queryTimeMs: queryTime,
        source: 'comprehensive_database_query'
      }
    }
  } catch (error) {
    console.error('Comprehensive database query error:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const academicYearParam = searchParams.get('academicYear')
    const academicYear = academicYearParam || await getAcademicYearFromConfig()
    const term = searchParams.get('term') || 'Term 1'
    const useCache = searchParams.get('useCache') !== 'false'
    
    if (!teacherId) {
      return NextResponse.json({
        success: false,
        error: 'Teacher ID is required'
      }, { status: 400 })
    }
    
    const cacheKey = generateUltraFastCacheKey(teacherId, academicYear, term)
    
    // Check ultra-fast cache first
    if (useCache) {
      const cached = getUltraFastCache(cacheKey)
      if (cached.hit) {
        const totalTime = performance.now() - startTime
        return NextResponse.json({
          success: true,
          data: cached.data,
          performance: {
            totalTimeMs: totalTime,
            cacheHit: true,
            source: 'ultra_fast_cache',
            timestamp: new Date().toISOString()
          }
        })
      }
    }
    
    // Fetch from database
    const rawData = await getUltraFastTeacherData(teacherId)
    
    // Transform data for optimal performance
    const transformedData = await ultraFastTransform(rawData)
    
    // Cache the transformed data
    if (useCache) {
      setUltraFastCache(cacheKey, transformedData)
    }
    
    const totalTime = performance.now() - startTime
    
    const response: TeacherDataResponse = {
      success: true,
      data: transformedData,
      performance: {
        totalTime: totalTime,
        cacheHit: false,
        source: 'database',
        timestamp: new Date().toISOString()
      }
    }
    
    console.log(`🚀 Ultra-fast teacher data loaded in ${totalTime.toFixed(2)}ms`)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Ultra-fast API error:', error)
    const totalTime = performance.now() - startTime
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch teacher data',
      performance: {
        totalTimeMs: totalTime,
        cacheHit: false,
        source: 'error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, teacherId } = body
    
    if (action === 'clear_cache') {
      const cacheKey = generateUltraFastCacheKey(teacherId)
      ultraFastCache.delete(cacheKey)
      
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Ultra-fast POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
}
