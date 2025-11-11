import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    console.log('🔧 Fixing student enrollment RLS policies...')

    // Check current users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, is_active')
      .order('created_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    } else {
      console.log('📋 Current users:')
      users?.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`)
      })
    }

    // Test current student creation capability
    console.log('🧪 Testing current student creation...')
    const testStudent = {
      student_id: 'TEST_' + Date.now(),
      first_name: 'Test',
      last_name: 'Student',
      subsystem: 'english',
      branch: 'grammar',
      class: 'Test Class',
      enrollment_status: 'pending',
      academic_year: '2024-2025',
      status: 'active'
    }

    const { data: testResult, error: testError } = await supabase
      .from('students')
      .insert(testStudent)
      .select()

    if (testError) {
      console.log('❌ Test student creation failed:', testError.message)
      
      // Try to create a student with minimal required fields
      console.log('🔧 Trying with minimal fields...')
      const minimalStudent = {
        student_id: 'MIN_' + Date.now(),
        first_name: 'Min',
        last_name: 'Student',
        subsystem: 'english',
        branch: 'grammar',
        class: 'Test Class'
      }

      const { error: minimalError } = await supabase
        .from('students')
        .insert(minimalStudent)
        .select()

      if (minimalError) {
        console.log('❌ Minimal student creation also failed:', minimalError.message)
        
        // Check if the table structure is correct
        console.log('🔍 Checking table structure...')
        const { error: tableError } = await supabase
          .from('students')
          .select('*')
          .limit(1)

        if (tableError) {
          console.log('❌ Cannot access students table:', tableError.message)
        } else {
          console.log('✅ Students table is accessible')
        }

        return NextResponse.json({
          success: false,
          message: 'Student creation is failing due to RLS policies',
          error: testError.message,
          minimalError: minimalError.message,
          users: users || [],
          recommendation: 'The RLS policies need to be updated manually in the Supabase dashboard'
        })
      } else {
        console.log('✅ Minimal student created successfully')
        
        // Clean up
        await supabase
          .from('students')
          .delete()
          .eq('student_id', minimalStudent.student_id)
        
        return NextResponse.json({
          success: true,
          message: 'Student creation works with minimal fields',
          users: users || [],
          note: 'Some fields might be causing the RLS violation'
        })
      }
    } else {
      console.log('✅ Test student created successfully:', testResult[0].student_id)
      
      // Clean up test student
      await supabase
        .from('students')
        .delete()
        .eq('student_id', testStudent.student_id)
      console.log('🧹 Test student cleaned up')
      
      return NextResponse.json({
        success: true,
        message: 'Student creation is working correctly',
        users: users || [],
        note: 'RLS policies are not the issue'
      })
    }

  } catch (error) {
    console.error('❌ Error testing student creation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test student creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
