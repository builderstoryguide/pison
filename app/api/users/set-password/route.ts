import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Set a custom password for a user (admin action)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, newPassword, setBy } = body

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, name, role, email')
      .eq('id', userId)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Set password expiry (30 days from now for custom passwords)
    const passwordExpiryDate = new Date()
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 30)

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        has_default_password: false, // Mark as custom password
        password_last_changed: new Date().toISOString(),
        password_expiry_date: passwordExpiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to set password' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_user_activity', {
      p_user_id: setBy || 'system',
      p_action: 'PASSWORD_SET',
      p_details: `Custom password set for ${existingUser.name} (${existingUser.email})`,
      p_ip_address: request.headers.get('x-forwarded-for') || '',
      p_user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
      password: newPassword // Return the password so admin can see it
    })

  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 }
    )
  }
}
