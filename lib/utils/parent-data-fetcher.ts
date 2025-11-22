import type { SupabaseClient} from '@supabase/supabase-js'
import { serializeSupabaseError } from '@/lib/safe-error'

/**
 * Parent data from the parents table
 */
export interface ParentData {
  student_id: string
  name: string
  email: string | null
  phone: string | null
  relationship: 'father' | 'mother' | 'guardian' | 'other'
}

/**
 * Parent information to include in student data
 */
export interface ParentInfo {
  parentName: string | undefined
  parentPhone: string | undefined
  parentEmail: string | undefined
}

/**
 * Map of student IDs to their parents
 */
export type ParentsByStudentId = Map<string, ParentData[]>

/**
 * Batch fetch parents for multiple students from the database
 * 
 * @param supabase - Supabase client instance
 * @param studentIds - Array of student IDs to fetch parents for
 * @returns Map of student_id to array of parent records
 */
export async function fetchParentsForStudents(
  supabase: SupabaseClient,
  studentIds: string[]
): Promise<ParentsByStudentId> {
  // Remove duplicates and filter out null/undefined
  const uniqueStudentIds = Array.from(
    new Set(studentIds.filter(Boolean))
  )

  console.log(`🔍 Fetching parent data for ${uniqueStudentIds.length} students`)

  // If no student IDs, return empty map
  if (uniqueStudentIds.length === 0) {
    console.log('ℹ️ No student IDs provided for parent fetching')
    return new Map()
  }

  // Query parents table - single batch query for all students
  const { data: parentsData, error: parentsError } = await supabase
    .from('parents')
    .select('student_id, name, email, phone, relationship')
    .in('student_id', uniqueStudentIds)

  if (parentsError) {
    console.error('Error fetching parents:', serializeSupabaseError(parentsError))
    console.log('⚠️ Continuing without parent data')
    return new Map()
  }

  // Create lookup map: student_id -> parent[]
  // Note: A student can have multiple parents (mother, father, guardian)
  const parentsByStudentId = new Map<string, ParentData[]>()

  if (parentsData && parentsData.length > 0) {
    parentsData.forEach(parent => {
      const existing = parentsByStudentId.get(parent.student_id) || []
      existing.push(parent as ParentData)
      parentsByStudentId.set(parent.student_id, existing)
    })
    
    console.log(`✅ Loaded ${parentsData.length} parent records for ${parentsByStudentId.size} students`)
  } else {
    console.log('ℹ️ No parent data found in database')
  }

  return parentsByStudentId
}

/**
 * Select the primary parent from a list of parents
 * Prioritizes father/mother over guardians
 * 
 * @param parents - Array of parent records for a student
 * @returns The selected primary parent, or undefined if no parents
 */
export function selectPrimaryParent(parents: ParentData[]): ParentData | undefined {
  if (!parents || parents.length === 0) {
    return undefined
  }

  // Prioritize father or mother
  const primaryParent = parents.find(p => 
    p.relationship === 'father' || p.relationship === 'mother'
  )

  // Fallback to first parent (could be guardian or other)
  return primaryParent || parents[0]
}

/**
 * Enrich student data with parent information
 * 
 * @param studentId - The student's ID
 * @param parentsByStudentId - Map of student IDs to parent arrays
 * @returns Parent information object with name, phone, email
 */
export function getParentInfoForStudent(
  studentId: string,
  parentsByStudentId: ParentsByStudentId
): ParentInfo {
  const parents = parentsByStudentId.get(studentId) || []

  // Log for debugging when student has multiple parents
  if (parents.length > 1) {
    const primaryParent = selectPrimaryParent(parents)
    console.log(`📋 Student ${studentId} has ${parents.length} parents registered:`, {
      relationships: parents.map(p => p.relationship),
      selectedPrimary: primaryParent?.relationship
    })
  }

  const primaryParent = selectPrimaryParent(parents)

  return {
    parentName: primaryParent?.name || undefined,
    parentPhone: primaryParent?.phone || undefined,
    parentEmail: primaryParent?.email || undefined,
  }
}

/**
 * Calculate parent data coverage statistics for a list of students
 * 
 * @param students - Array of students with parent information
 * @returns Statistics object with counts and coverage percentage
 */
export function calculateParentCoverage(students: { parentName?: string }[]) {
  const withParents = students.filter(s => s.parentName).length
  const withoutParents = students.filter(s => !s.parentName).length
  const total = students.length
  const coverage = total > 0 
    ? `${Math.round((withParents / total) * 100)}%`
    : '0%'

  return {
    totalStudents: total,
    withParentInfo: withParents,
    withoutParentInfo: withoutParents,
    parentDataCoverage: coverage
  }
}
