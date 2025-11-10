import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Environment guard - only allow in non-production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 403 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🔍 Debug: Checking user profile for ID:', userId)

    // Step 1: Check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('📊 User in users table:', user, 'Error:', userError)

    // Step 2: Check if user profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('📊 User profile:', userProfile, 'Error:', profileError)

    // Step 3: If user profile exists, check teacher record
    let teacherRecord = null
    let teacherError = null
    if (userProfile?.role_specific_id) {
      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('*')
        .eq('teacher_id', userProfile.role_specific_id)
        .single()
      
      teacherRecord = teacher
      teacherError = tError
      console.log('📊 Teacher record:', teacher, 'Error:', tError)
    }

    // Step 4: Check teacher assignments
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
      debug: {
        userId,
        user: user || null,
        userError: userError?.message || null,
        userProfile: userProfile || null,
        profileError: profileError?.message || null,
        teacherRecord: teacherRecord || null,
        teacherError: teacherError?.message || null,
        assignments: assignments || [],
        assignmentError: assignmentError?.message || null,
        summary: {
          userExists: !!user,
          profileExists: !!userProfile,
          teacherExists: !!teacherRecord,
          hasAssignments: assignments && assignments.length > 0
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
