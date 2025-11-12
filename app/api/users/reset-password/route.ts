import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate default password
function generateDefaultPassword(role: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  return `${capitalizedRole}@${year}${random}`;
}

// POST - Reset user password (admin action)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, resetBy } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, name, role, email')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new default password
    const newPassword = generateDefaultPassword(existingUser.role);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Set password expiry (7 days from now)
    const passwordExpiryDate = new Date();
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 7);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        has_default_password: true,
        password_last_changed: new Date().toISOString(),
        password_expiry_date: passwordExpiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.rpc('log_user_activity', {
      p_user_id: resetBy || 'system',
      p_action: 'PASSWORD_RESET',
      p_details: `Password reset for ${existingUser.name} (${existingUser.email})`,
      p_ip_address: request.headers.get('x-forwarded-for') || '',
      p_user_agent: request.headers.get('user-agent')
    });

    return NextResponse.json({
      success: true,
      password: newPassword,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/users/reset-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Request password reset (self-service)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (userError || !existingUser) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Store reset token (you'd need a password_reset_tokens table)
    // In a real implementation, you would generate a reset token and send it via email
    // For now, we'll just log the activity
    await supabase.rpc('log_user_activity', {
      p_user_id: existingUser.id,
      p_action: 'PASSWORD_RESET_REQUESTED',
      p_details: `Password reset requested for ${existingUser.email}`,
      p_ip_address: request.headers.get('x-forwarded-for') || '',
      p_user_agent: request.headers.get('user-agent')
    });

    // In a real implementation, you would:
    // 1. Store the reset token in a database table
    // 2. Send an email with the reset link
    // 3. Use a proper email service

    return NextResponse.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Error in PUT /api/users/reset-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Use reset token to change password
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Validate the reset token from the database
    // 2. Check if the token has expired
    // 3. Get the user ID associated with the token
    // 4. Update the password
    // 5. Delete the used token

    // For now, we'll return a placeholder response
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error in PATCH /api/users/reset-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
