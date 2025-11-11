import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('🧪 Testing assignments API...')
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('teacher_branch_assignments')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 })
    }
    
    // Test if table exists and is accessible
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'teacher_branch_assignments' })
      .single()
    
    if (tableError) {
      console.error('❌ Table info RPC call failed:', tableError)
      return NextResponse.json({
        success: false,
        error: 'Table info retrieval failed',
        details: tableError.message || tableError
      }, { status: 500 })
    }
    
    console.log('✅ Database connection test passed')
    
    return NextResponse.json({
      success: true,
      message: 'API endpoint is working',
      databaseConnected: true,
      testData: testData || [],
      tableInfo: tableInfo || 'Table info not available'
    })
    
  } catch (error) {
    console.error('❌ Test API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
