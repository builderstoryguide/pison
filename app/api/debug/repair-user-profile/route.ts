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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🔧 Repair: Attempting to repair user profile for ID:', userId)

    // Step 1: Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in users table',
        details: userError?.message 
      }, { status: 404 })
    }

    // Step 2: Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        success: true, 
        message: 'User profile already exists',
        profile: existingProfile
      })
    }

    // Step 3: Try to find teacher record by email
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', user.email)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ 
        success: false, 
        error: 'No teacher record found for this user',
        details: teacherError?.message 
      }, { status: 404 })
    }

    // Step 4: Create missing user profile
    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
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

    console.log('✅ User profile created successfully:', newProfile)

    return NextResponse.json({
      success: true,
      message: 'User profile created successfully',
      profile: newProfile,
      teacher: teacher
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
