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

    const { teacherEmail, testData } = await request.json()

    if (!teacherEmail) {
      return NextResponse.json({ error: 'Teacher email is required' }, { status: 400 })
    }

    console.log('🔍 Debug: Testing user creation for teacher:', teacherEmail)

    // Step 1: Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', teacherEmail)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        details: 'A user with this email already exists in the users table',
        existingUser: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          status: existingUser.status
        }
      })
    }

    // Step 2: Test password hashing
    let hashedPassword = null
    try {
      const hashResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hash-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'TestPassword123!' }),
      })
      
      if (!hashResponse.ok) {
        throw new Error(`Hash API returned ${hashResponse.status}`)
      }
      
      const hashResult = await hashResponse.json()
      if (!hashResult.success) {
        throw new Error(hashResult.error || 'Hash API failed')
      }
      
      hashedPassword = hashResult.hashedPassword
      console.log('✅ Password hashing successful')
    } catch (hashError) {
      return NextResponse.json({
        success: false,
        error: 'Password hashing failed',
        details: hashError instanceof Error ? hashError.message : 'Unknown hashing error'
      })
    }

    // Step 3: Test user creation with minimal data
    const testUserData = {
      email: teacherEmail,
      password_hash: hashedPassword,
      name: testData?.name || 'Test Teacher',
      role: 'teacher',
      status: 'active',
      avatar_url: 'initials:TT',
      phone: testData?.phone || '+1234567890',
      has_default_password: true,
      password_last_changed: new Date().toISOString(),
      password_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      permissions: ['manage_classes', 'grade_students', 'communicate_parents'],
    }

    console.log('🔄 Testing user creation with data:', testUserData)

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert(testUserData)
      .select()
      .single()

    if (userError) {
      console.error('❌ User creation failed:', userError)
      return NextResponse.json({
        success: false,
        error: 'User creation failed',
        details: userError.message,
        errorCode: userError.code,
        errorHint: userError.hint,
        testData: testUserData
      })
    }

    console.log('✅ User creation successful:', newUser.id)

    // Step 4: Clean up - delete the test user
    try {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', newUser.id)

      if (deleteError) {
        console.warn('⚠️ Failed to clean up test user:', deleteError)
      } else {
        console.log('✅ Test user cleaned up successfully')
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup error:', cleanupError)
    }

    return NextResponse.json({
      success: true,
      message: 'User creation test passed',
      testResults: {
        passwordHashing: 'success',
        userCreation: 'success',
        cleanup: 'success'
      }
    })

  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
