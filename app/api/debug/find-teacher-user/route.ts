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
    const searchTerm = searchParams.get('search') // Can be email, name, or teacher_id

    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required (email, name, or teacher_id)' }, { status: 400 })
    }

    console.log('🔍 Debug: Searching for teacher with term:', searchTerm)

    // Step 1: Search in teachers table by various fields
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*')
      .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,teacher_id.ilike.%${searchTerm}%`)

    console.log('📊 Teachers found:', teachers, 'Error:', teachersError)

    // Step 2: For each teacher, check if they have a corresponding user
    const teachersWithUsers = []
    for (const teacher of teachers || []) {
      // Check if user exists by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', teacher.email)
        .single()

      // Check if user profile exists
      let userProfile = null
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        userProfile = profile
      }

      teachersWithUsers.push({
        teacher,
        user: user || null,
        userError: userError?.message || null,
        userProfile: userProfile || null,
        hasUser: !!user,
        hasProfile: !!userProfile
      })
    }

    // Step 3: Also search directly in users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)

    console.log('📊 Users found:', users, 'Error:', usersError)

    // Step 4: For each user, check if they have a teacher record
    const usersWithTeachers = []
    for (const user of users || []) {
      // Check if teacher exists by email
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', user.email)
        .single()

      // Check if user profile exists
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      usersWithTeachers.push({
        user,
        teacher: teacher || null,
        teacherError: teacherError?.message || null,
        userProfile: userProfile || null,
        hasTeacher: !!teacher,
        hasProfile: !!userProfile
      })
    }

    return NextResponse.json({
      success: true,
      searchTerm,
      results: {
        teachersFound: teachersWithUsers,
        usersFound: usersWithTeachers,
        summary: {
          totalTeachers: teachersWithUsers.length,
          totalUsers: usersWithTeachers.length,
          teachersWithUsers: teachersWithUsers.filter(t => t.hasUser).length,
          usersWithTeachers: usersWithTeachers.filter(u => u.hasTeacher).length,
          orphanedTeachers: teachersWithUsers.filter(t => !t.hasUser).length,
          orphanedUsers: usersWithTeachers.filter(u => !u.hasTeacher).length
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
