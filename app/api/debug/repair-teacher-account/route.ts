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

    const { teacherEmail, authUserId } = await request.json()

    if (!teacherEmail && !authUserId) {
      return NextResponse.json({ error: 'Either teacherEmail or authUserId is required' }, { status: 400 })
    }

    console.log('🔧 Repair: Attempting to repair teacher account for:', { teacherEmail, authUserId })

    let teacher = null
    let user = null
    let userProfile = null

    // Step 1: Find the teacher record
    if (teacherEmail) {
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
    if (authUserId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single()

      if (!userError && userData) {
        user = userData
      }
    }

    // Step 3: If no user found, try to find by email
    if (!user && teacher) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', teacher.email)
        .single()

      if (!userError && userData) {
        user = userData
      }
    }

    // Step 4: Check if user profile exists
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

    // Step 5: Determine what needs to be created
    const needsUser = !user
    const needsProfile = user && !userProfile
    const needsTeacher = !teacher

    if (!needsUser && !needsProfile && !needsTeacher) {
      return NextResponse.json({
        success: true,
        message: 'Teacher account is already complete',
        data: { teacher, user, userProfile }
      })
    }

    const results = { teacher, user, userProfile }

    // Step 6: Create missing user account
    if (needsUser && teacher) {
      console.log('🔧 Creating missing user account for teacher:', teacher.email)
      
      // Generate default password
      const defaultPassword = 'Teacher123!' // You might want to make this configurable
      
      // Hash password
      const hashResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hash-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: defaultPassword }),
      })
      
      if (!hashResponse.ok) {
        throw new Error('Failed to hash password')
      }
      
      const hashResult = await hashResponse.json()
      if (!hashResult.success) {
        throw new Error(hashResult.error || 'Failed to hash password')
      }

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: teacher.email,
          password_hash: hashResult.hashedPassword,
          name: `${teacher.first_name} ${teacher.last_name}`,
          role: 'teacher',
          status: 'active',
          avatar_url: `initials:${teacher.first_name[0]}${teacher.last_name[0]}`,
          phone: teacher.phone,
          has_default_password: true,
          password_last_changed: new Date().toISOString(),
          password_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          permissions: ['manage_classes', 'grade_students', 'communicate_parents'],
        })
        .select()
        .single()

      if (userError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create user account',
          details: userError.message 
        }, { status: 500 })
      }

      results.user = newUser
      console.log('✅ User account created:', newUser.id)
    }

    // Step 7: Create missing user profile
    if (needsProfile && results.user && teacher) {
      console.log('🔧 Creating missing user profile for user:', results.user.id)
      
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: results.user.id,
          role_specific_id: teacher.teacher_id,
          subsystem: teacher.subsystem,
          occupation: teacher.employment_type,
          emergency_contact_name: teacher.emergency_contact_name,
          emergency_contact_phone: teacher.emergency_contact_phone,
          emergency_contact_relationship: teacher.emergency_contact_relationship,
        })
        .select()
        .single()

      if (profileError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create user profile',
          details: profileError.message 
        }, { status: 500 })
      }

      results.userProfile = newProfile
      console.log('✅ User profile created:', newProfile.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher account repaired successfully',
      data: results,
      actions: {
        createdUser: needsUser,
        createdProfile: needsProfile,
        createdTeacher: needsTeacher
      }
    })

  } catch (error) {
    console.error('❌ Repair endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
