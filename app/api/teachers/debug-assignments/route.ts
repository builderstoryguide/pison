import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Environment guard - only allow in non-production
    if (process.env.NODE_ENV === 'production') {
      console.warn('🚫 Debug endpoint accessed in production environment')
      return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 403 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 })
    }

    // Authorization check - verify user session and role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn('🚫 Unauthorized access attempt to debug endpoint')
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      console.warn('🚫 Non-admin user attempted to access debug endpoint:', user.id)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    console.log('🔍 Debug: Teacher assignments for user:', teacherId)

    // Step 1: Check user profile
    const { data: teacherUserProfile, error: teacherProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', teacherId)
      .single()

    console.log('📊 User Profile:', teacherUserProfile, 'Error:', teacherProfileError)

    if (!teacherUserProfile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found',
        debug: {
          step: 'user_profile',
          userId: teacherId,
          error: teacherProfileError
        }
      })
    }

    // Step 2: Check teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('teacher_id', teacherUserProfile.role_specific_id)
      .single()

    console.log('📊 Teacher Record:', teacher, 'Error:', teacherError)

    if (!teacher) {
      return NextResponse.json({
        success: false,
        error: 'Teacher record not found',
        debug: {
          step: 'teacher_record',
          userId: teacherId,
          roleSpecificId: teacherUserProfile.role_specific_id,
          error: teacherError
        }
      })
    }

    // Step 3: Check teacher branch assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('teacher_branch_assignments')
      .select(`
        *,
        classes:class_id(*),
        branch:branch_id(*)
      `)
      .eq('teacher_id', teacher.id)

    console.log('📊 Assignments:', assignments, 'Error:', assignmentsError)

    // Step 4: Check all teachers in the system (redacted for security)
    const { data: allTeachers, error: allTeachersError } = await supabase
      .from('teachers')
      .select('id, teacher_id, first_name, last_name')

    // Step 5: Check all assignments in the system (limited fields)
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from('teacher_branch_assignments')
      .select(`
        id,
        teacher_id,
        branch_id,
        class_id,
        academic_year,
        term,
        is_primary_teacher,
        teacher:teachers(teacher_id, first_name, last_name),
        classes:class_id(class_name),
        branch:branch_id(branch_name)
      `)

    // Redact sensitive information from user profile
    const redactedUserProfile = teacherUserProfile ? {
      user_id: teacherUserProfile.user_id,
      role: teacherUserProfile.role,
      role_specific_id: teacherUserProfile.role_specific_id,
      // Remove email and other sensitive fields
    } : null

    return NextResponse.json({
      success: true,
      debug: {
        userId: teacherId,
        userProfile: redactedUserProfile,
        teacher: teacher ? {
          id: teacher.id,
          teacher_id: teacher.teacher_id,
          first_name: teacher.first_name,
          last_name: teacher.last_name
          // Remove email and other sensitive fields
        } : null,
        assignments: assignments || [],
        allTeachers: (allTeachers || []).map(t => ({
          id: t.id,
          teacher_id: t.teacher_id,
          first_name: t.first_name,
          last_name: t.last_name
          // Remove email
        })),
        allAssignments: allAssignments || [],
        errors: {
          profileError: teacherProfileError,
          teacherError,
          assignmentsError,
          allTeachersError,
          allAssignmentsError
        }
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
