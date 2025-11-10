import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkUserPermission } from '@/lib/permission-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// All available permissions in the system
const ALL_PERMISSIONS = [
  'all',
  'manage_users',
  'manage_system',
  'view_reports',
  'manage_finances',
  'manage_classes',
  'grade_students',
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
]

// Available permissions by role (for reference and default assignments)
const availablePermissions = {
  admin: [
    'all',
    'manage_users',
    'manage_system',
    'view_reports',
    'manage_finances',
    'manage_classes',
    'grade_students',
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
    'communicate_teachers'
  ],
  parent: [
    'view_child_progress',
    'communicate_teachers',
    'view_financial_records'
  ],
  bursar: [
    'manage_finances',
    'track_payments',
    'send_fee_notices',
    'view_financial_records',
    'generate_reports' // Optional - must be granted by admin
  ]
}

// GET - Get available permissions for a role or all permissions for admins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const forAdmin = searchParams.get('forAdmin') === 'true'

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

    // If requesting for admin cross-role assignment, return all permissions
    if (forAdmin) {
      return NextResponse.json({
        success: true,
        permissions: ALL_PERMISSIONS,
        rolePermissions: availablePermissions[role as keyof typeof availablePermissions],
        crossRoleAssignment: true
      })
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
    // Check if the requesting user has admin permissions
    const adminCheck = await checkUserPermission(request, 'manage_users')
    console.log('Permission check result:', adminCheck)
    if (!adminCheck.hasPermission) {
      console.log('Permission denied for access rights update')
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          message: 'Only administrators can manage user access rights'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, permissions, updatedBy, allowCrossRole = false } = body
    
    console.log('Access rights update request:', { userId, permissions, allowCrossRole })

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

    // Validate permissions
    const rolePermissions = availablePermissions[existingUser.role as keyof typeof availablePermissions]
    if (!rolePermissions) {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 400 }
      )
    }

    // Check if all provided permissions are valid
    let invalidPermissions: string[] = []
    
    if (allowCrossRole) {
      // For cross-role assignment, validate against all available permissions
      invalidPermissions = permissions.filter(p => !ALL_PERMISSIONS.includes(p))
    } else {
      // For standard assignment, validate against role-specific permissions
      invalidPermissions = permissions.filter(p => !rolePermissions.includes(p))
    }

    if (invalidPermissions.length > 0) {
      const errorMessage = allowCrossRole 
        ? `Invalid permissions: ${invalidPermissions.join(', ')}. Valid permissions: ${ALL_PERMISSIONS.join(', ')}`
        : `Invalid permissions for ${existingUser.role} role: ${invalidPermissions.join(', ')}`
      
      return NextResponse.json(
        { 
          error: errorMessage,
          validPermissions: allowCrossRole ? ALL_PERMISSIONS : rolePermissions,
          crossRoleAssignment: allowCrossRole
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
      const actionDetails = allowCrossRole 
        ? `Updated access rights for ${existingUser.name} with cross-role permissions. New permissions: ${permissions.join(', ')}`
        : `Updated access rights for ${existingUser.name}. New permissions: ${permissions.join(', ')}`
      
      await supabase.rpc('log_user_activity', {
        p_user_id: updatedBy,
        p_action: 'UPDATE_ACCESS_RIGHTS',
        p_details: actionDetails,
        p_ip_address: request.headers.get('x-forwarded-for') || '',
        p_user_agent: request.headers.get('user-agent')
      })
    }

    return NextResponse.json({
      success: true,
      user,
      message: allowCrossRole 
        ? 'User access rights updated successfully with cross-role permissions'
        : 'User access rights updated successfully',
      crossRoleAssignment: allowCrossRole,
      assignedPermissions: permissions
    })

  } catch (error) {
    console.error('Error in PUT /api/users/access-rights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
