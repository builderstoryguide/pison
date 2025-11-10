import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Permission validation utilities for API routes
 */

export interface PermissionCheckResult {
  hasPermission: boolean
  user?: any
  error?: string
  statusCode?: number
}

/**
 * Check if the authenticated user has a specific permission
 */
export async function checkUserPermission(
  request: NextRequest,
  requiredPermission: string
): Promise<PermissionCheckResult> {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        hasPermission: false,
        error: 'Authentication required',
        statusCode: 401
      }
    }

    // Get user details and permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, permissions, name')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return {
        hasPermission: false,
        error: 'User not found',
        statusCode: 404
      }
    }

    // Check if user has the required permission
    const userPermissions = userData.permissions || []
    const hasPermission = userPermissions.includes('all') || userPermissions.includes(requiredPermission)

    return {
      hasPermission,
      user: userData
    }

  } catch (error) {
    console.error('Error checking user permission:', error)
    return {
      hasPermission: false,
      error: 'Internal server error',
      statusCode: 500
    }
  }
}

/**
 * Middleware function to validate permissions in API routes
 */
export async function validatePermission(
  request: NextRequest,
  requiredPermission: string
): Promise<NextResponse | null> {
  const result = await checkUserPermission(request, requiredPermission)
  
  if (!result.hasPermission) {
    return NextResponse.json(
      { 
        error: result.error || 'Insufficient permissions',
        message: `This action requires the '${requiredPermission}' permission. Please contact an administrator to grant you access.`,
        requiredPermission
      },
      { status: result.statusCode || 403 }
    )
  }
  
  return null // Permission granted, continue with request
}

/**
 * Check if user has any of the specified permissions
 */
export async function checkUserPermissions(
  request: NextRequest,
  requiredPermissions: string[]
): Promise<PermissionCheckResult> {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        hasPermission: false,
        error: 'Authentication required',
        statusCode: 401
      }
    }

    // Get user details and permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, permissions, name')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return {
        hasPermission: false,
        error: 'User not found',
        statusCode: 404
      }
    }

    // Check if user has any of the required permissions
    const userPermissions = userData.permissions || []
    const hasPermission = userPermissions.includes('all') || 
      requiredPermissions.some(permission => userPermissions.includes(permission))

    return {
      hasPermission,
      user: userData
    }

  } catch (error) {
    console.error('Error checking user permissions:', error)
    return {
      hasPermission: false,
      error: 'Internal server error',
      statusCode: 500
    }
  }
}

/**
 * Get user permissions for display purposes
 */
export async function getUserPermissions(request: NextRequest): Promise<{
  permissions: string[]
  user: any
} | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, permissions, name')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return {
      permissions: userData.permissions || [],
      user: userData
    }

  } catch (error) {
    console.error('Error getting user permissions:', error)
    return null
  }
}
