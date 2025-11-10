import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Get password information for a user (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user password information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        has_default_password,
        password_last_changed,
        password_expiry_date,
        created_at
      `)
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate password age
    const passwordAge = user.password_last_changed 
      ? Math.floor((Date.now() - new Date(user.password_last_changed).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Check if password is expired
    const isExpired = user.password_expiry_date 
      ? new Date(user.password_expiry_date) < new Date()
      : false

    // Check if password expires soon (within 3 days)
    const expiresSoon = user.password_expiry_date 
      ? new Date(user.password_expiry_date) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      : false

    return NextResponse.json({
      success: true,
      passwordInfo: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        hasDefaultPassword: user.has_default_password,
        passwordLastChanged: user.password_last_changed,
        passwordExpiryDate: user.password_expiry_date,
        passwordAge: passwordAge,
        isExpired: isExpired,
        expiresSoon: expiresSoon,
        accountCreated: user.created_at
      }
    })

  } catch (error) {
    console.error('Error fetching password info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch password information' },
      { status: 500 }
    )
  }
}
