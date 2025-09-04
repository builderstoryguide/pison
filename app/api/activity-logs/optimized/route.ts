import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    let result

    // Use optimized database function for better performance when no filters are applied
    if (!action && !userId && !search) {
      try {
        // Try using the optimized function for recent logs first
        const { data, error } = await supabase.rpc('get_recent_activity_logs', {
          p_limit: limit,
          p_offset: offset
        })

        if (error) {
          console.error('Error calling get_recent_activity_logs:', error)
          // Fall back to regular query if function fails
          throw error
        }

        result = data
      } catch (functionError) {
        console.error('Database function failed, falling back to regular query:', functionError)
        
        // Fallback to regular query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_activity_logs')
          .select(`
            id,
            action,
            details,
            ip_address,
            user_agent,
            created_at,
            user_id,
            users!user_activity_logs_user_id_fkey(
              id,
              name,
              email,
              role
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1)
        
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
          return NextResponse.json(
            { 
              error: 'Failed to fetch activity logs',
              details: fallbackError.message,
              suggestion: 'Please run the database setup script to fix table structure issues.'
            },
            { status: 500 }
          )
        }
        
        result = fallbackData
      }
    } else {
      // Use regular query for filtered results
      let query = supabase
        .from('user_activity_logs')
        .select(`
          id,
          action,
          details,
          ip_address,
          user_agent,
          created_at,
          user_id,
          users!user_activity_logs_user_id_fkey(
            id,
            name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1)

      // Apply filters efficiently
      if (action) {
        query = query.eq('action', action)
      }

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (search) {
        query = query.or(`action.ilike.%${search}%,details.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching activity logs:', error)
        return NextResponse.json(
          { error: 'Failed to fetch activity logs' },
          { status: 500 }
        )
      }

      result = data
    }

    // Transform the data efficiently
    const transformedLogs = result?.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user_name || log.users?.name || 'Unknown User',
      action: log.action,
      details: log.details || '',
      timestamp: log.created_at,
      ipAddress: log.ip_address || 'Unknown',
      userAgent: log.user_agent || 'Unknown'
    })) || []

    return NextResponse.json({
      logs: transformedLogs,
      total: transformedLogs.length,
      hasMore: transformedLogs.length === limit
    })

  } catch (error) {
    console.error('Error in optimized activity logs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
