import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'bursar'
  status: 'active' | 'inactive' | 'suspended'
  avatar_url?: string | null
  permissions: string[]
}

export interface AuthResult {
  user: AuthenticatedUser | null
  error: NextResponse | null
}

/**
 * Creates a standardized authentication error response
 */
function createAuthErrorResponse(
  code: string,
  message: string,
  status: number = 401
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Main authentication function
 * Extracts user ID from X-User-Id header and validates user exists and is active
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract user ID from header
    const userId = request.headers.get('X-User-Id')

    if (!userId) {
      return {
        user: null,
        error: createAuthErrorResponse(
          'MISSING_USER_ID',
          'Authentication required. User ID not provided in request headers.',
          401
        ),
      }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return {
        user: null,
        error: createAuthErrorResponse(
          'INVALID_USER_ID',
          'Invalid user ID format.',
          400
        ),
      }
    }

    // Query database for user
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, status, avatar_url, permissions')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return {
        user: null,
        error: createAuthErrorResponse(
          'USER_NOT_FOUND',
          'User not found or invalid credentials.',
          401
        ),
      }
    }

    // Check if user is active
    if (user.status !== 'active') {
      return {
        user: null,
        error: createAuthErrorResponse(
          'USER_INACTIVE',
          `Account is ${user.status}. Please contact administrator.`,
          401
        ),
      }
    }

    // Return authenticated user
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as AuthenticatedUser['role'],
        status: user.status as AuthenticatedUser['status'],
        avatar_url: user.avatar_url,
        permissions: user.permissions || [],
      },
      error: null,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      user: null,
      error: createAuthErrorResponse(
        'AUTH_ERROR',
        'An error occurred during authentication.',
        500
      ),
    }
  }
}

/**
 * Requires authentication - throws error if not authenticated
 * Use this when authentication is mandatory
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const { user, error } = await authenticateUser(request)
  
  if (error || !user) {
    throw error || createAuthErrorResponse('UNAUTHORIZED', 'Authentication required.', 401)
  }
  
  return user
}

/**
 * Requires specific role - throws error if user doesn't have the role
 * Use this for role-based access control
 */
export async function requireRole(
  request: NextRequest,
  role: AuthenticatedUser['role']
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  if (user.role !== role) {
    throw createAuthErrorResponse(
      'INSUFFICIENT_PERMISSIONS',
      `${role} role required.`,
      403
    )
  }
  
  return user
}

/**
 * Requires one of multiple roles - throws error if user doesn't have any of the roles
 */
export async function requireAnyRole(
  request: NextRequest,
  roles: AuthenticatedUser['role'][]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  if (!roles.includes(user.role)) {
    throw createAuthErrorResponse(
      'INSUFFICIENT_PERMISSIONS',
      `One of the following roles required: ${roles.join(', ')}.`,
      403
    )
  }
  
  return user
}

/**
 * Gets user from request without throwing errors
 * Returns null if not authenticated (useful for optional auth)
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const { user } = await authenticateUser(request)
  return user
}

/**
 * Helper function to check if user has a specific permission
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  return user.permissions.includes(permission) || user.role === 'admin'
}

/**
 * Helper function to check if user is admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin'
}

/**
 * Helper function to check if user is bursar
 */
export function isBursar(user: AuthenticatedUser): boolean {
  return user.role === 'bursar'
}

/**
 * Helper function to check if user is teacher
 */
export function isTeacher(user: AuthenticatedUser): boolean {
  return user.role === 'teacher'
}

