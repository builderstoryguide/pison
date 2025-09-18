import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Available permissions by role
const availablePermissions = {
  admin: [
    'all',
    'manage_users',
    'manage_system',
    'view_reports',
    'manage_finances',
    'manage_classes',
    'grade_students',
    'mark_attendance',
    'communicate_parents',
    'view_grades',
    'view_schedule',
    'submit_assignments',
    'communicate_teachers',
    'view_child_progress',
    'view_financial_records',
    'track_payments',
    'generate_reports',
    'send_fee_notices'
  ],
  teacher: [
    'manage_classes',
    'grade_students',
    'mark_attendance',
    'communicate_parents',
    'view_grades',
    'view_schedule',
    'submit_assignments',
    'communicate_teachers',
    'view_reports'
  ],
  student: [
    'view_grades',
    'view_schedule',
    'submit_assignments',
    'communicate_teachers',
    'view_attendance'
  ],
  parent: [
    'view_child_progress',
    'communicate_teachers',
    'view_financial_records',
    'view_attendance'
  ],
  bursar: [
    'manage_finances',
    'track_payments',
    'generate_reports',
    'send_fee_notices',
    'view_financial_records'
  ]
}

// GET - Get available permissions for a role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    if (!role) {
      return NextResponse.json(
        { error: 'Role parameter is required' },
        { status: 400 }
      )
    }

    if (!availablePermissions[role as keyof typeof availablePermissions]) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      permissions: availablePermissions[role as keyof typeof availablePermissions]
    })

  } catch (error) {
    console.error('Error in GET /api/users/access-rights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user access rights
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, permissions, updatedBy } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      )
    }

    // Check if user exists and get their role
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('id', userId)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate permissions against role
    const rolePermissions = availablePermissions[existingUser.role as keyof typeof availablePermissions]
    if (!rolePermissions) {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 400 }
      )
    }

    // Check if all provided permissions are valid for the role
    const invalidPermissions = permissions.filter(p => !rolePermissions.includes(p))
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { 
          error: `Invalid permissions for ${existingUser.role} role: ${invalidPermissions.join(', ')}`,
          validPermissions: rolePermissions
        },
        { status: 400 }
      )
    }

    // Update user permissions
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({
        permissions: permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user permissions:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user permissions' },
        { status: 500 }
      )
    }

    // Log activity (only if updatedBy is provided)
    if (updatedBy) {
      await supabase.rpc('log_user_activity', {
        p_user_id: updatedBy,
        p_action: 'UPDATE_ACCESS_RIGHTS',
        p_details: `Updated access rights for ${user.name}. New permissions: ${permissions.join(', ')}`,
        p_ip_address: request.headers.get('x-forwarded-for') || '',
        p_user_agent: request.headers.get('user-agent')
      })
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'Access rights updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/users/access-rights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
