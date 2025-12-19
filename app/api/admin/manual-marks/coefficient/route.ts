/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser, isAdmin } from '@/lib/auth/server'

/**
 * POST /api/admin/manual-marks/coefficient
 * Allows admins to update subject coefficient
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser(request)
    if (authError || !user) {
      return authError || NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { subjectId, coefficient } = body

    // Validate required fields
    if (!subjectId || coefficient === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: subjectId, coefficient' },
        { status: 400 }
      )
    }

    // Validate coefficient
    const coefficientValue = parseFloat(coefficient)
    if (isNaN(coefficientValue) || coefficientValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Coefficient must be a positive number' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Check if subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', subjectId)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Update coefficient
    const { error: updateError } = await supabase
      .from('subjects')
      .update({ 
        coefficient: coefficientValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', subjectId)

    if (updateError) {
      console.error('Error updating coefficient:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update coefficient' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Coefficient updated successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/manual-marks/coefficient:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
