import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { userIds } = body

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: userIds array is required' },
        { status: 400 }
      )
    }

    // Check authentication and require admin role
    const user = await requireRole(request, 'admin')

    // Prevent deletion of the current user
    if (userIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get user details for validation and logging
    const { data: usersToDelete, error: fetchError } = await supabase
      .from('users')
      .select('id, name, role, email')
      .in('id', userIds)

    if (fetchError) {
      console.error('Error fetching users for deletion:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500 }
      )
    }

    // Prevent deletion of other admin users (optional safety measure)
    const adminUsers = usersToDelete.filter(u => u.role === 'admin')
    if (adminUsers.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete admin users',
          details: `Attempted to delete admin users: ${adminUsers.map(u => u.name).join(', ')}`
        },
        { status: 400 }
      )
    }

    // Use batch operations for better performance
    const errors: string[] = []
    let deletedCount = 0

    try {
      // Batch delete user profiles
      const { error: profileDeleteError } = await supabase
        .from('user_profiles')
        .delete()
        .in('user_id', userIds)

      if (profileDeleteError) {
        console.error('Error deleting user profiles:', profileDeleteError)
        errors.push(`Failed to delete user profiles: ${profileDeleteError.message}`)
      }

      // Batch delete user activity logs
      const { error: logsDeleteError } = await supabase
        .from('user_activity_logs')
        .delete()
        .in('user_id', userIds)

      if (logsDeleteError) {
        console.error('Error deleting user activity logs:', logsDeleteError)
        errors.push(`Failed to delete user activity logs: ${logsDeleteError.message}`)
      }

      // Batch delete users
      const { error: usersDeleteError, count } = await supabase
        .from('users')
        .delete()
        .in('id', userIds)

      if (usersDeleteError) {
        console.error('Error deleting users:', usersDeleteError)
        errors.push(`Failed to delete users: ${usersDeleteError.message}`)
      } else {
        deletedCount = count || 0
      }

      // If any batch operation failed, try individual deletions as fallback
      if (errors.length > 0 && deletedCount === 0) {
        console.log('Batch operations failed, trying individual deletions...')
        
        for (const userId of userIds) {
          try {
            // Delete user profile first (if exists)
            await supabase
              .from('user_profiles')
              .delete()
              .eq('user_id', userId)

            // Delete user activity logs
            await supabase
              .from('user_activity_logs')
              .delete()
              .eq('user_id', userId)

            // Delete the user
            const { error: deleteError } = await supabase
              .from('users')
              .delete()
              .eq('id', userId)

            if (deleteError) {
              console.error(`Error deleting user ${userId}:`, deleteError)
              errors.push(`Failed to delete user ${userId}: ${deleteError.message}`)
            } else {
              deletedCount++
            }
          } catch (error) {
            console.error(`Error processing user ${userId}:`, error)
            errors.push(`Failed to delete user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }
    } catch (error) {
      console.error('Error in batch deletion:', error)
      errors.push(`Batch deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Return results
    if (deletedCount === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No users were deleted',
          deletedCount: 0,
          errors
        },
        { status: 500 }
      )
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: true,
          deletedCount,
          errors,
          message: `Successfully deleted ${deletedCount} users with ${errors.length} errors`
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        deletedCount,
        errors: [],
        message: `Successfully deleted ${deletedCount} users`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in bulk delete users:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
