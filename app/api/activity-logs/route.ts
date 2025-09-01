import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50') // Reduced default limit
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    // Build optimized query with better joins
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

    // Optimize search query
    if (search) {
      // Use more specific search to avoid full table scan
      query = query.or(`action.ilike.%${search}%,details.ilike.%${search}%`)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Error fetching activity logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      )
    }

    // Transform the data efficiently
    const transformedLogs = logs?.map(log => ({
      id: log.id,
      userId: log.user_id,
      userName: log.users?.[0]?.name || 'Unknown User',
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
    console.error('Error in activity logs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
