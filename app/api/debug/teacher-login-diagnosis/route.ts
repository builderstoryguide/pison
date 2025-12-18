import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  // Restrict to development environment only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  // Add authentication check (e.g., admin-only)
  // const session = await getServerSession()
  // if (!session?.user || session.user.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    const supabase = createServiceClient()
    const { teacherId, email, password } = await request.json()

    if (!teacherId && !email) {
      return NextResponse.json(
        { error: 'Either teacherId or email is required' },
        { status: 400 }
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diagnosis: any = {
      teacherId: teacherId || null,
      email: email || null,
      checks: {
        teacherExists: false,
        userExists: false,
        userProfileExists: false,
        roleSpecificIdMatches: false,
        userStatusActive: false,
        passwordHashValid: false,
        passwordMatches: false,
      },
      details: {},
      issues: [],
      recommendations: [],
    }

    let teacher = null
    let user = null

    // Check 1: Find teacher record
    if (teacherId) {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle()

      if (teacherError && teacherError.code !== 'PGRST116') {
        diagnosis.issues.push(`Error querying teachers table: ${teacherError.message}`)
      } else if (teacherData) {
        teacher = teacherData
        diagnosis.checks.teacherExists = true
        diagnosis.details.teacher = {
          id: teacher.id,
          teacher_id: teacher.teacher_id,
          email: teacher.email,
          name: `${teacher.first_name} ${teacher.last_name}`,
          status: teacher.status,
        }
      } else {
        diagnosis.issues.push(`Teacher with ID ${teacherId} not found in teachers table`)
        diagnosis.recommendations.push('Verify the teacher ID is correct or create the teacher record')
      }
    }

    // Check 2: Find user by email (from teacher or provided)
    const searchEmail = email || teacher?.email
    if (searchEmail) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', searchEmail)
        .eq('role', 'teacher')
        .maybeSingle()

      if (userError && userError.code !== 'PGRST116') {
        diagnosis.issues.push(`Error querying users table: ${userError.message}`)
      } else if (userData) {
        user = userData
        diagnosis.checks.userExists = true
        diagnosis.details.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          has_default_password: user.has_default_password,
          password_last_changed: user.password_last_changed,
          password_expiry_date: user.password_expiry_date,
        }

        // Check user status
        if (user.status === 'active') {
          diagnosis.checks.userStatusActive = true
        } else {
          diagnosis.issues.push(`User account status is '${user.status}', not 'active'`)
          diagnosis.recommendations.push('Update user status to active')
        }

        // Check password hash format
        if (user.password_hash) {
          const hashPattern = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/
          if (hashPattern.test(user.password_hash)) {
            diagnosis.checks.passwordHashValid = true
          } else {
            diagnosis.issues.push('Password hash format is invalid (not a valid bcrypt hash)')
            diagnosis.recommendations.push('Reset the password to generate a valid hash')
          }

          // If password provided, test it
          if (password) {
            try {
              const matches = await bcrypt.compare(password, user.password_hash)
              diagnosis.checks.passwordMatches = matches
              if (!matches) {
                diagnosis.issues.push('Provided password does not match the stored hash')
                diagnosis.recommendations.push('Reset the password or verify the correct password')
              }
            } catch (bcryptError) {
              diagnosis.issues.push(`Error comparing password: ${bcryptError instanceof Error ? bcryptError.message : 'Unknown error'}`)
            }
          }
        } else {
          diagnosis.issues.push('User account has no password hash')
          diagnosis.recommendations.push('Set a password for the user account')
        }
      } else {
        diagnosis.issues.push(`User account with email '${searchEmail}' and role 'teacher' not found`)
        diagnosis.recommendations.push('Create user account for this teacher')
      }
    }

    // Check 3: Find user profile
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        diagnosis.issues.push(`Error querying user_profiles table: ${profileError.message}`)
      } else if (profileData) {
        diagnosis.checks.userProfileExists = true
        diagnosis.details.userProfile = {
          id: profileData.id,
          user_id: profileData.user_id,
          role_specific_id: profileData.role_specific_id,
          subsystem: profileData.subsystem,
        }

        // Check if role_specific_id matches teacher_id
        if (teacher && profileData.role_specific_id === teacher.teacher_id) {
          diagnosis.checks.roleSpecificIdMatches = true
        } else if (teacher) {
          diagnosis.issues.push(
            `role_specific_id mismatch: user_profiles has '${profileData.role_specific_id}' but teacher has '${teacher.teacher_id}'`
          )
          diagnosis.recommendations.push('Update user_profiles.role_specific_id to match teacher.teacher_id')
        }
      } else {
        diagnosis.issues.push('User profile not found for this user account')
        diagnosis.recommendations.push('Create user_profiles entry with correct role_specific_id')
      }
    }

    // Check 4: Try to find user by role_specific_id (for login with teacher ID)
    if (teacherId && !user) {
      const { data: profileByRoleId } = await supabase
        .from('user_profiles')
        .select('user_id, role_specific_id')
        .eq('role_specific_id', teacherId)
        .maybeSingle()
      
      if (profileByRoleId) {
        const { data: userFound } = await supabase
          .from('users')
          .select('id, email')
          .eq('id', profileByRoleId.user_id)
          .maybeSingle()

        if (userFound) {
          diagnosis.details.userFoundByTeacherId = {
            id: userFound.id,
            email: userFound.email
          }
        }
      }
    }

    // Summary
    const checksToValidate = { ...diagnosis.checks }
    if (!password) {
      delete checksToValidate.passwordMatches
    }
    const allChecksPass = Object.values(checksToValidate).every(check => check === true)

    diagnosis.summary = {
      allChecksPass,
      canLogin: diagnosis.checks.userExists && 
                diagnosis.checks.userStatusActive && 
                diagnosis.checks.userProfileExists && 
                diagnosis.checks.roleSpecificIdMatches,
      passwordMatches: diagnosis.checks.passwordMatches,
      loginMethod: diagnosis.checks.userProfileExists && diagnosis.checks.roleSpecificIdMatches
        ? 'Can login with teacher ID'
        : diagnosis.checks.userExists
        ? 'Can login with email only'
        : 'Cannot login',
    }

    return NextResponse.json({
      success: true,
      diagnosis,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Diagnosis endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
