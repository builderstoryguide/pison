import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateDatabaseSetup, createDatabaseSetupErrorResponse } from '@/lib/database-validation'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Validate database setup - check if user_activity_logs table exists and has required columns
    try {
      const validationResult = await validateDatabaseSetup(
        supabase, 
        ['user_activity_logs'], 
        [],
        [{ table: 'user_activity_logs', columns: ['details', 'action', 'created_at', 'user_id'] }],
        []
      );
      
      if (!validationResult.isValid) {
        console.error('Database setup validation failed:', validationResult.errors);
        const errorResponse = createDatabaseSetupErrorResponse(validationResult, 'user_activity_logs table');
        return NextResponse.json(errorResponse, { status: 500 });
      }
    } catch (networkError) {
      console.error('Network error when validating database setup:', networkError);
      return NextResponse.json(
        { 
          error: 'Database connection error',
          message: 'Unable to connect to the database. Please check your network connection.',
          details: networkError instanceof Error ? networkError.message : 'Network connection failed'
        },
        { status: 500 }
      );
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    // Simple query without the database function
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

    // Apply filters
    if (action) {
      query = query.eq('action', action)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (search) {
      query = query.or(`action.ilike.%${search}%,details.ilike.%${search}%`)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Error fetching activity logs:', error)
      
      // Provide actionable error messages for schema mismatches
      let errorMessage = error.message || 'Failed to fetch activity logs'
      let suggestion = 'Please check your database schema and ensure all required columns exist.'
      
      if (error.code === '42703' || error.message?.includes('does not exist')) {
        errorMessage = `Schema mismatch detected: ${error.message}`
        suggestion = 'Run the migration script 2025-11-04_019_fix_activity_logs_schema.sql to fix the schema. The "details" column may be missing or named incorrectly.'
      }
      
      return NextResponse.json({
        error: 'Failed to fetch activity logs',
        message: errorMessage,
        details: error.message,
        code: error.code,
        hint: error.hint,
        suggestion,
        setupRequired: error.code === '42703',
        setupScript: error.code === '42703' ? '2025-11-04_019_fix_activity_logs_schema.sql' : undefined
      }, { status: 500 })
    }

    // Transform the data
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
    console.error('Error in simple activity logs API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
