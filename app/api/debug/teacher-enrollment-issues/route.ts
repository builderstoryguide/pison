import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Environment guard - only allow in non-production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 403 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 })
    }

    const { teacherEmail, teacherId } = await request.json()

    if (!teacherEmail && !teacherId) {
      return NextResponse.json({ error: 'Either teacherEmail or teacherId is required' }, { status: 400 })
    }

    console.log('🔍 Debug: Checking teacher enrollment issues for:', { teacherEmail, teacherId })

    let teacher = null
    let user = null
    let userProfile = null

    // Step 1: Find the teacher record
    if (teacherId) {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('teacher_id', teacherId)
        .single()

      if (teacherError || !teacherData) {
        return NextResponse.json({ 
          success: false, 
          error: 'Teacher not found with that ID',
          details: teacherError?.message 
        }, { status: 404 })
      }
      teacher = teacherData
    } else if (teacherEmail) {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', teacherEmail)
        .single()

      if (teacherError || !teacherData) {
        return NextResponse.json({ 
          success: false, 
          error: 'Teacher not found with that email',
          details: teacherError?.message 
        }, { status: 404 })
      }
      teacher = teacherData
    }

    // Step 2: Check if user exists in users table
    if (teacher) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', teacher.email)
        .single()

      if (!userError && userData) {
        user = userData
      }

      // Step 3: Check if user profile exists
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!profileError && profileData) {
          userProfile = profileData
        }
      }
    }

    // Step 4: Check for potential issues
    const issues = []
    
    if (teacher && !user) {
      issues.push({
        type: 'missing_user',
        severity: 'high',
        message: 'Teacher exists but no user account found',
        details: 'This is the root cause of the login failure'
      })
    }
    
    if (user && !userProfile) {
      issues.push({
        type: 'missing_profile',
        severity: 'medium',
        message: 'User exists but no user profile found',
        details: 'This will cause ID mapping issues'
      })
    }
    
    if (teacher && user && userProfile) {
      // Check if the profile links correctly
      if (userProfile.role_specific_id !== teacher.teacher_id) {
        issues.push({
          type: 'mismatched_ids',
          severity: 'high',
          message: 'User profile role_specific_id does not match teacher_id',
          details: `Profile has ${userProfile.role_specific_id}, teacher has ${teacher.teacher_id}`
        })
      }
    }

    // Step 5: Check for duplicate emails
    if (teacher) {
      const { data: duplicateUsers, error: duplicateError } = await supabase
        .from('users')
        .select('id, email, role, status')
        .eq('email', teacher.email)

      if (!duplicateError && duplicateUsers && duplicateUsers.length > 1) {
        issues.push({
          type: 'duplicate_email',
          severity: 'high',
          message: 'Multiple users found with the same email',
          details: `Found ${duplicateUsers.length} users with email ${teacher.email}`,
          data: duplicateUsers
        })
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        teacher,
        user,
        userProfile,
        issues,
        summary: {
          hasTeacher: !!teacher,
          hasUser: !!user,
          hasProfile: !!userProfile,
          issueCount: issues.length,
          criticalIssues: issues.filter(i => i.severity === 'high').length
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
