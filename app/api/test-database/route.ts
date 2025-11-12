import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test 1: Check if we can connect to the database
    console.log('Testing database connection...')
    
    // Test 2: Check if user_activity_logs table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_activity_logs')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.error('Table check error:', tableError)
      return NextResponse.json({
        error: 'Database table error',
        details: tableError.message,
        code: tableError.code,
        hint: tableError.hint
      }, { status: 500 })
    }
    
    // Test 3: Check if users table exists
    const { data: usersCheck, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .limit(1)
    
    if (usersError) {
      console.error('Users table check error:', usersError)
      return NextResponse.json({
        error: 'Users table error',
        details: usersError.message,
        code: usersError.code
      }, { status: 500 })
    }
    
    // Test 4: Check if the function exists
    const { data: functionCheck, error: functionError } = await supabase.rpc('get_recent_activity_logs', {
      p_limit: 1,
      p_offset: 0
    })
    
    if (functionError) {
      console.error('Function check error:', functionError)
      return NextResponse.json({
        error: 'Database function error',
        details: functionError.message,
        code: functionError.code,
        hint: 'The get_recent_activity_logs function may not exist'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and tables are working',
      tableExists: !!tableCheck,
      usersExist: !!usersCheck,
      functionExists: !!functionCheck,
      sampleData: {
        activityLogs: tableCheck?.length || 0,
        users: usersCheck?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
