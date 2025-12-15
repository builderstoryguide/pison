import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// List of courses to verify
const COURSES_TO_VERIFY = [
  'Mathematics',
  'Business Mathematics',
  'Entrepreneurship',
  'Accounting',
  'Introduction to Marketing',
  'Circuit',
  'Electrical Technology',
  'Office Practice',
  'Survey, Soil Mechanics and Materials',
  'Construction Process and Building Practice',
]

interface CourseVerificationResult {
  courseName: string
  hasMarks: boolean
  sources: string[]
  totalMarks: number
  totalStudents: number
  matchedNames: string[]
  details: {
    exam_results?: { count: number; students: number }
    grades?: { count: number; students: number }
    branch_grades?: { count: number; students: number }
  }
}

interface VerificationResponse {
  courses: CourseVerificationResult[]
  summary: {
    totalCourses: number
    coursesWithMarks: number
    coursesWithoutMarks: number
  }
}

/**
 * Normalize course name for matching (lowercase, trim)
 */
function normalizeCourseName(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Check if a subject name matches a course (case-insensitive, partial match)
 */
function matchesCourse(subjectName: string, courseName: string): boolean {
  const normalizedSubject = normalizeCourseName(subjectName)
  const normalizedCourse = normalizeCourseName(courseName)
  
  // Exact match
  if (normalizedSubject === normalizedCourse) {
    return true
  }
  
  // Partial match - course name contains subject or vice versa
  // But be careful - "marketing" shouldn't match "introduction to marketing" as a course
  // Only match if the shorter string is substantially contained in the longer one
  if (normalizedSubject.includes(normalizedCourse) && normalizedCourse.length >= 5) {
    // Subject contains full course name - good match (only if course name is substantial)
    return true
  }
  if (normalizedCourse.includes(normalizedSubject)) {
    // Course contains subject - only match if subject is substantial (more than 3 chars)
    // This prevents "math" from matching "business mathematics" incorrectly
    if (normalizedSubject.length >= 5) {
      return true
    }
  }  
  // Special handling for common variations
  const variations: Record<string, string[]> = {
    'mathematics': ['math', 'maths'],
    'business mathematics': ['business math', 'business maths', 'bus math', 'bus maths'],
    'entrepreneurship': ['entrepreneur'],
    'accounting': ['accounts', 'account'],
    'introduction to marketing': ['intro to marketing', 'introduction to marketing', 'intro marketing'],
    'circuit': ['circuits', 'circuit analysis'],
    'electrical technology': ['electrical', 'electrical tech', 'electrical tech.', 'elect tech'],
    'office practice': ['office', 'office practices'],
    'survey, soil mechanics and materials': ['survey', 'soil mechanics', 'materials', 'survey and soil mechanics', 'soil mechanics and materials'],
    'construction process and building practice': ['construction', 'building practice', 'building', 'construction process', 'building practices'],
  }
  
  const courseKey = normalizedCourse
  if (variations[courseKey]) {
    return variations[courseKey].some(variant => {
      const normalizedVariant = normalizeCourseName(variant)
      return normalizedSubject === normalizedVariant || 
             normalizedSubject.includes(normalizedVariant) ||
             normalizedVariant.includes(normalizedSubject)
    })
  }
  
  return false
}

/**
 * Find which course(s) a subject name matches
 */
function findMatchingCourses(subjectName: string): string[] {
  return COURSES_TO_VERIFY.filter(course => matchesCourse(subjectName, course))
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Initialize results for all courses
    const courseResults = new Map<string, CourseVerificationResult>()
    COURSES_TO_VERIFY.forEach(courseName => {
      courseResults.set(courseName, {
        courseName,
        hasMarks: false,
        sources: [],
        totalMarks: 0,
        totalStudents: 0,
        matchedNames: [],
        details: {},
      })
    })

    // 1. Query exam_results table
    try {
      const { data: examResults, error: examError } = await supabase
        .from('exam_results')
        .select('subject, student_id')

      if (!examError && examResults) {
        // Group by subject
        const subjectMap = new Map<string, { count: number; students: Set<string> }>()
        
        examResults.forEach((result: any) => {
          const subject = result.subject
          if (!subject) return
          
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, { count: 0, students: new Set() })
          }
          
          const entry = subjectMap.get(subject)!
          entry.count++
          if (result.student_id) {
            entry.students.add(result.student_id)
          }
        })

        // Match subjects to courses
        subjectMap.forEach((stats, subjectName) => {
          const matchingCourses = findMatchingCourses(subjectName)
          matchingCourses.forEach(courseName => {
            const result = courseResults.get(courseName)!
            if (!result.matchedNames.includes(subjectName)) {
              result.matchedNames.push(subjectName)
            }
            result.hasMarks = true
            if (!result.sources.includes('exam_results')) {
              result.sources.push('exam_results')
            }
            result.totalMarks += stats.count
            // Track maximum unique students across all sources
            result.totalStudents = Math.max(result.totalStudents, stats.students.size)
            // Aggregate counts when multiple subjects match the same course
            result.details.exam_results = {
              count: (result.details.exam_results?.count || 0) + stats.count,
              students: Math.max(result.details.exam_results?.students || 0, stats.students.size),
            }
          })
        })
      }
    } catch (error) {
      console.warn('Error querying exam_results:', error)
    }

    // 2. Query grades table via assessments
    try {
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          student_id,
          assessment:assessments!inner(
            subject
          )
        `)

      if (!gradesError && gradesData) {
        // Group by subject
        const subjectMap = new Map<string, { count: number; students: Set<string> }>()
        
        gradesData.forEach((grade: any) => {
          const subject = grade.assessment?.subject
          if (!subject) return
          
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, { count: 0, students: new Set() })
          }
          
          const entry = subjectMap.get(subject)!
          entry.count++
          if (grade.student_id) {
            entry.students.add(grade.student_id)
          }
        })

        // Match subjects to courses
        subjectMap.forEach((stats, subjectName) => {
          const matchingCourses = findMatchingCourses(subjectName)
          matchingCourses.forEach(courseName => {
            const result = courseResults.get(courseName)!
            if (!result.matchedNames.includes(subjectName)) {
              result.matchedNames.push(subjectName)
            }
            result.hasMarks = true
            if (!result.sources.includes('grades')) {
              result.sources.push('grades')
            }
            result.totalMarks += stats.count
            result.totalStudents = Math.max(result.totalStudents, stats.students.size)
            // Aggregate counts when multiple subjects match the same course
            result.details.grades = {
              count: (result.details.grades?.count || 0) + stats.count,
              students: Math.max(result.details.grades?.students || 0, stats.students.size),
            }
          })
        })
      }
    } catch (error) {
      console.warn('Error querying grades:', error)
    }

    // 3. Query branch_grades via branch_assessments and subject_branches
    try {
      const { data: branchGradesData, error: branchGradesError } = await supabase
        .from('branch_grades')
        .select(`
          student_id,
          assessment:branch_assessments!inner(
            branch:subject_branches!inner(
              subject_id,
              subjects:subject_id(
                id,
                name
              )
            )
          )
        `)

      if (!branchGradesError && branchGradesData) {
        // Group by subject
        const subjectMap = new Map<string, { count: number; students: Set<string> }>()
        
        branchGradesData.forEach((grade: any) => {
          // Navigate through nested structure to get subject name
          // Try different possible structures (handle both 'name' and 'subject_name' fields)
          const subjectName = grade.assessment?.branch?.subjects?.name ||
                            grade.assessment?.branch?.subjects?.subject_name ||
                            grade.assessment?.branch?.subject?.name ||
                            grade.assessment?.branch?.subject?.subject_name ||
                            (grade.assessment?.branch?.subjects && 
                             Array.isArray(grade.assessment.branch.subjects) && 
                             (grade.assessment.branch.subjects[0]?.name || grade.assessment.branch.subjects[0]?.subject_name))
          if (!subjectName) return
          
          if (!subjectMap.has(subjectName)) {
            subjectMap.set(subjectName, { count: 0, students: new Set() })
          }
          
          const entry = subjectMap.get(subjectName)!
          entry.count++
          if (grade.student_id) {
            entry.students.add(grade.student_id)
          }
        })

        // Match subjects to courses
        subjectMap.forEach((stats, subjectName) => {
          const matchingCourses = findMatchingCourses(subjectName)
          matchingCourses.forEach(courseName => {
            const result = courseResults.get(courseName)!
            if (!result.matchedNames.includes(subjectName)) {
              result.matchedNames.push(subjectName)
            }
            result.hasMarks = true
            if (!result.sources.includes('branch_grades')) {
              result.sources.push('branch_grades')
            }
            result.totalMarks += stats.count
            result.totalStudents = Math.max(result.totalStudents, stats.students.size)
            // Aggregate counts when multiple subjects match the same course
            result.details.branch_grades = {
              count: (result.details.branch_grades?.count || 0) + stats.count,
              students: Math.max(result.details.branch_grades?.students || 0, stats.students.size),
            }
          })
        })
      }
    } catch (error) {
      console.warn('Error querying branch_grades:', error)
    }

    // Convert map to array and calculate summary
    const courses = Array.from(courseResults.values())
    const coursesWithMarks = courses.filter(c => c.hasMarks).length
    const coursesWithoutMarks = courses.length - coursesWithMarks

    const response: VerificationResponse = {
      courses,
      summary: {
        totalCourses: courses.length,
        coursesWithMarks,
        coursesWithoutMarks,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error verifying course marks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

