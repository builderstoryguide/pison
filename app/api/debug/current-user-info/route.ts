import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    // Environment guard - only allow in non-production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 403 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 })
    }

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authenticated user found',
        details: authError?.message 
      }, { status: 401 })
    }

    console.log('🔍 Debug: Current authenticated user:', user.id, user.email)

    // Check if this user exists in the users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('📊 User in users table:', userRecord, 'Error:', userError)

    // Check if user profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('📊 User profile:', userProfile, 'Error:', profileError)

    // Check if teacher record exists
    let teacherRecord = null
    let teacherError = null
    if (userRecord?.email) {
      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', userRecord.email)
        .single()
      
      teacherRecord = teacher
      teacherError = tError
      console.log('📊 Teacher record:', teacher, 'Error:', tError)
    }

    // Check teacher assignments
    let assignments = null
    let assignmentError = null
    if (teacherRecord?.id) {
      const { data: teacherAssignments, error: aError } = await supabase
        .from('teacher_branch_assignments')
        .select('*')
        .eq('teacher_id', teacherRecord.id)
      
      assignments = teacherAssignments
      assignmentError = aError
      console.log('📊 Teacher assignments:', teacherAssignments, 'Error:', aError)
    }

    return NextResponse.json({
      success: true,
      currentUser: {
        authUser: {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'unknown'
        },
        userRecord: userRecord || null,
        userError: userError?.message || null,
        userProfile: userProfile || null,
        profileError: profileError?.message || null,
        teacherRecord: teacherRecord || null,
        teacherError: teacherError?.message || null,
        assignments: assignments || [],
        assignmentError: assignmentError?.message || null,
        summary: {
          hasUserRecord: !!userRecord,
          hasUserProfile: !!userProfile,
          hasTeacherRecord: !!teacherRecord,
          hasAssignments: assignments && assignments.length > 0,
          isComplete: !!(userRecord && userProfile && teacherRecord)
        }
      }
    })

  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
