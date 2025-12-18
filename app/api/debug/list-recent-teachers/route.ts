import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // 1. Get 10 most recent teachers, or filter by email
    let query = supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    if (email) {
      query = supabase.from('teachers').select('*').eq('email', email)
    }
      
    const { data: teachers, error: teachersError } = await query

      
    if (teachersError) {
      return NextResponse.json({ error: teachersError.message }, { status: 500 })
    }
    
    // 2. For each teacher, find their user account and profile
    const results = await Promise.all(teachers.map(async (teacher) => {
      // Find user by email
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', teacher.email)
        .eq('role', 'teacher')
        .maybeSingle()
        
      // Find profile by teacher_id (role_specific_id)
      let profile = null
      
      if (user) {
        const { data: p } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        profile = p
      } else {
         // Try to find profile by role_specific_id just in case user exists but email mismatch? 
         // Actually sticking to user lookup first is safer logic wise for now.
      }

      return {
        teacher: {
            id: teacher.id,
            teacher_id: teacher.teacher_id,
            name: `${teacher.first_name} ${teacher.last_name}`,
            email: teacher.email,
            status: teacher.status,
            created_at: teacher.created_at
        },

        user: user ? {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            has_password_hash: !!user.password_hash,
            password_expiry: user.password_expiry_date
        } : null,
        user_profile: profile ? {
            id: profile.id,
            role_specific_id: profile.role_specific_id,
            subsystem: profile.subsystem
        } : null,
        issues: [
            !user ? "No user account found for email" : null,
            user && user.status !== 'active' ? `User status is ${user.status}` : null,
            user && !user.password_hash ? "No password hash set" : null,
            user && profile && profile.role_specific_id !== teacher.teacher_id ? 
                `Profile ID (${profile.role_specific_id}) doesn't match Teacher ID (${teacher.teacher_id})` : null,
            !user && teacher.status === 'active' ? "Active teacher has no user account" : null
        ].filter(Boolean)
      }
    }))
    
    return NextResponse.json({
      count: results.length,
      teachers: results
    })
    
  } catch (error) {
     return NextResponse.json({ 
        error: 'Internal Error', 
        details: error instanceof Error ? error.message : 'Unknown' 
     }, { status: 500 })
  }
}
