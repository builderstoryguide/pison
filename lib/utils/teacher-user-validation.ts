/**
 * Teacher-User Linkage Validation and Repair Utility
 * 
 * This utility provides functions to validate and repair teacher-user linkages,
 * ensuring that teacher records are properly linked to user accounts.
 */

import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export interface TeacherLinkageResult {
  success: boolean
  teacherRecordId?: string
  userId?: string
  wasLinked: boolean
  error?: string
  method?: 'email' | 'teacher_id' | 'direct'
}

/**
 * Ensures a teacher record is linked to a user account.
 * Attempts to find and link the teacher if not already linked.
 * 
 * @param userId - The user ID to link the teacher to
 * @param teacherEmail - Optional email to search for teacher record
 * @returns Result object indicating success and linkage status
 */
export async function ensureTeacherLinked(
  userId: string,
  teacherEmail?: string
): Promise<TeacherLinkageResult> {
  try {
    const supabase = await createClient()

    // First, check if teacher is already linked
    const { data: existingTeacher, error: existingError } = await supabase
      .from('teachers')
      .select('id, user_id, teacher_id, email')
      .eq('user_id', userId)
      .single()

    if (!existingError && existingTeacher) {
      return {
        success: true,
        teacherRecordId: existingTeacher.id,
        userId: userId,
        wasLinked: true,
        method: 'direct'
      }
    }

    // Get user information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .eq('role', 'teacher')
      .single()

    if (userError || !user) {
      return {
        success: false,
        error: 'User not found or is not a teacher',
        wasLinked: false
      }
    }

    const searchEmail = teacherEmail || user.email

    // Try to find teacher by email
    if (searchEmail) {
      const { data: teacherByEmail, error: emailError } = await supabase
        .from('teachers')
        .select('id, user_id, teacher_id, email')
        .eq('email', searchEmail)
        .single()

      if (!emailError && teacherByEmail) {
        // Link if not already linked
        if (!teacherByEmail.user_id) {
          const { error: linkError } = await supabase
            .from('teachers')
            .update({ user_id: userId })
            .eq('id', teacherByEmail.id)

          if (linkError) {
            return {
              success: false,
              teacherRecordId: teacherByEmail.id,
              userId: userId,
              error: serializeSupabaseError(linkError),
              wasLinked: false,
              method: 'email'
            }
          }

          return {
            success: true,
            teacherRecordId: teacherByEmail.id,
            userId: userId,
            wasLinked: false,
            method: 'email'
          }
        } else if (teacherByEmail.user_id === userId) {
          // Already linked to this user
          return {
            success: true,
            teacherRecordId: teacherByEmail.id,
            userId: userId,
            wasLinked: true,
            method: 'email'
          }
        } else {
          // Linked to a different user - this is a conflict
          return {
            success: false,
            teacherRecordId: teacherByEmail.id,
            userId: userId,
            error: `Teacher is already linked to a different user (${teacherByEmail.user_id})`,
            wasLinked: false,
            method: 'email'
          }
        }
      }
    }

    // Try to find by teacher_id from user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role_specific_id')
      .eq('user_id', userId)
      .like('role_specific_id', 'TCH%')
      .single()

    if (!profileError && userProfile?.role_specific_id) {
      const { data: teacherById, error: idError } = await supabase
        .from('teachers')
        .select('id, user_id, teacher_id, email')
        .eq('teacher_id', userProfile.role_specific_id)
        .single()

      if (!idError && teacherById) {
        // Link if not already linked
        if (!teacherById.user_id) {
          const { error: linkError } = await supabase
            .from('teachers')
            .update({ user_id: userId })
            .eq('id', teacherById.id)

          if (linkError) {
            return {
              success: false,
              teacherRecordId: teacherById.id,
              userId: userId,
              error: serializeSupabaseError(linkError),
              wasLinked: false,
              method: 'teacher_id'
            }
          }

          return {
            success: true,
            teacherRecordId: teacherById.id,
            userId: userId,
            wasLinked: false,
            method: 'teacher_id'
          }
        } else if (teacherById.user_id === userId) {
          // Already linked to this user
          return {
            success: true,
            teacherRecordId: teacherById.id,
            userId: userId,
            wasLinked: true,
            method: 'teacher_id'
          }
        } else {
          // Linked to a different user - this is a conflict
          return {
            success: false,
            teacherRecordId: teacherById.id,
            userId: userId,
            error: `Teacher is already linked to a different user (${teacherById.user_id})`,
            wasLinked: false,
            method: 'teacher_id'
          }
        }
      }
    }

    // No teacher record found
    return {
      success: false,
      userId: userId,
      error: 'No teacher record found for this user',
      wasLinked: false
    }
  } catch (error) {
    return {
      success: false,
      userId: userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      wasLinked: false
    }
  }
}

/**
 * Validates that a teacher is properly linked to a user account.
 * Does not attempt to repair, only checks status.
 * 
 * @param userId - The user ID to check
 * @returns True if teacher is linked, false otherwise
 */
export async function isTeacherLinked(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('id, user_id')
      .eq('user_id', userId)
      .single()

    return !error && !!teacher && !!teacher.user_id
  } catch {
    return false
  }
}

/**
 * Gets linkage statistics for monitoring purposes.
 * 
 * @returns Object with counts of linked and unlinked teachers
 */
export async function getTeacherLinkageStats(): Promise<{
  total: number
  linked: number
  unlinked: number
  linkable: number
}> {
  try {
    const supabase = await createClient()

    // Get total teachers
    const { count: total } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })

    // Get linked teachers
    const { count: linked } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })
      .not('user_id', 'is', null)

    // Get unlinked teachers that can be linked (have matching user accounts)
    const { data: linkableTeachers } = await supabase
      .from('teachers')
      .select('email, teacher_id')
      .is('user_id', null)

    let linkable = 0
    if (linkableTeachers) {
      for (const teacher of linkableTeachers) {
        // Check if there's a matching user by email
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', teacher.email)
          .eq('role', 'teacher')
          .single()

        if (userByEmail) {
          linkable++
          continue
        }

        // Check if there's a matching user by teacher_id
        const { data: userByProfile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('role_specific_id', teacher.teacher_id)
          .single()

        if (userByProfile) {
          linkable++
        }
      }
    }

    return {
      total: total || 0,
      linked: linked || 0,
      unlinked: (total || 0) - (linked || 0),
      linkable
    }
  } catch (error) {
    console.error('Error getting teacher linkage stats:', error)
    return {
      total: 0,
      linked: 0,
      unlinked: 0,
      linkable: 0
    }
  }
}

