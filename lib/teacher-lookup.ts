import { SupabaseClient } from '@supabase/supabase-js'

export interface Teacher {
  id: string
  teacher_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  photo?: string
  subsystem?: string
  employment_type?: string
  created_at?: string
  updated_at?: string
}

/**
 * Get teacher from Supabase Auth session
 * This is the primary method for finding the current teacher
 */
export async function getTeacherFromSession(supabase: SupabaseClient): Promise<Teacher | null> {
  try {
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('🔍 No authenticated user found in Supabase Auth')
      return null
    }

    console.log('🔍 Getting teacher for authenticated user:', user.email)

    // Look up teacher directly by email
    const teacher = await getTeacherByEmail(supabase, user.email!)
    return teacher
  } catch (error) {
    console.error('❌ Error getting teacher from session:', error)
    return null
  }
}

/**
 * Get teacher from user ID (fallback for non-Supabase Auth users)
 * This handles cases where the user is logged in through a custom system
 */
export async function getTeacherFromUserId(supabase: SupabaseClient, userId: string): Promise<Teacher | null> {
  try {
    console.log('🔍 Getting teacher from user ID:', userId)
    
    // First, try to find the user in the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.log('⚠️ User not found in users table:', userId)
      return null
    }
    
    if (user.role !== 'teacher') {
      console.log('⚠️ User is not a teacher:', user.role)
      return null
    }
    
    console.log('🔍 Found user, looking up teacher by email:', user.email)
    
    // Look up teacher by email
    const teacher = await getTeacherByEmail(supabase, user.email)
    return teacher
  } catch (error) {
    console.error('❌ Error getting teacher from user ID:', error)
    return null
  }
}

/**
 * Get teacher by email (fallback method)
 * This is used when we have an email but no auth session
 */
export async function getTeacherByEmail(supabase: SupabaseClient, email: string): Promise<Teacher | null> {
  try {
    console.log('🔍 Looking up teacher by email:', email)

    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️ No teacher found with email:', email)
        return null
      }
      console.error('❌ Error looking up teacher by email:', error)
      return null
    }

    console.log('✅ Found teacher:', teacher.first_name, teacher.last_name)
    return teacher
  } catch (error) {
    console.error('❌ Error in getTeacherByEmail:', error)
    return null
  }
}

/**
 * Get teacher by ID (for cases where we already have the teacher ID)
 */
export async function getTeacherById(supabase: SupabaseClient, teacherId: string): Promise<Teacher | null> {
  try {
    console.log('🔍 Looking up teacher by ID:', teacherId)

    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️ No teacher found with ID:', teacherId)
        return null
      }
      console.error('❌ Error looking up teacher by ID:', error)
      return null
    }

    console.log('✅ Found teacher by ID:', teacher.first_name, teacher.last_name)
    return teacher
  } catch (error) {
    console.error('❌ Error in getTeacherById:', error)
    return null
  }
}

/**
 * Resolve teacher ID from various input formats
 * Handles UUIDs, teacher IDs, and email addresses
 */
export async function resolveTeacherId(supabase: SupabaseClient, input: string): Promise<Teacher | null> {
  try {
    console.log('🔍 Resolving teacher ID from input:', input)

    // If it's a UUID, try to find teacher by ID first
    if (input.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('🔄 Input is UUID, checking if it\'s a direct teacher ID')
      
      const teacher = await getTeacherById(supabase, input)
      if (teacher) {
        return teacher
      }
      
      // If not found by ID, it might be a user ID - we'll need to get the email
      // For now, return null as we don't have access to user_profiles
      console.log('⚠️ UUID not found as teacher ID, and we don\'t support user ID lookup')
      return null
    }

    // If it looks like an email, try email lookup
    if (input.includes('@')) {
      console.log('🔄 Input looks like email, trying email lookup')
      return await getTeacherByEmail(supabase, input)
    }

    // Otherwise, try as teacher_id
    console.log('🔄 Input looks like teacher_id, trying teacher_id lookup')
    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('teacher_id', input)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️ No teacher found with teacher_id:', input)
        return null
      }
      console.error('❌ Error looking up teacher by teacher_id:', error)
      return null
    }

    console.log('✅ Found teacher by teacher_id:', teacher.first_name, teacher.last_name)
    return teacher
  } catch (error) {
    console.error('❌ Error in resolveTeacherId:', error)
    return null
  }
}
