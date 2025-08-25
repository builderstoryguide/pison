import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate new password
function generateNewPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special character
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// POST - Reset user password
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new password
    const newPassword = generateNewPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Set password expiry (30 days from now)
    const passwordExpiryDate = new Date();
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 30);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        has_default_password: true,
        password_last_changed: new Date().toISOString(),
        password_expiry_date: passwordExpiryDate.toISOString()
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
      p_user_id: resetBy,
      p_action: 'RESET_PASSWORD',
      p_details: `Reset password for ${user.name} (${user.email})`,
      p_ip_address: request.headers.get('x-forwarded-for') || request.ip,
      p_user_agent: request.headers.get('user-agent')
    });

    return NextResponse.json({
      success: true,
      password: newPassword,
      message: 'Password reset successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error in POST /api/users/reset-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Request password reset (for self-service)
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Store reset token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Error creating reset token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to create reset token' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.rpc('log_user_activity', {
      p_user_id: user.id,
      p_action: 'REQUEST_PASSWORD_RESET',
      p_details: `Password reset requested for ${user.email}`,
      p_ip_address: request.headers.get('x-forwarded-for') || request.ip,
      p_user_agent: request.headers.get('user-agent')
    });

    // TODO: Send email with reset link
    // For now, we'll just return success
    // In production, you would send an email with the reset link

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Error in PUT /api/users/reset-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Verify and use reset token
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

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find valid reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Set password expiry (30 days from now)
    const passwordExpiryDate = new Date();
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 30);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        has_default_password: false,
        password_last_changed: new Date().toISOString(),
        password_expiry_date: passwordExpiryDate.toISOString()
      })
      .eq('id', resetToken.user_id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Mark token as used
    const { error: markError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

    if (markError) {
      console.error('Error marking token as used:', markError);
    }

    // Log activity
    await supabase.rpc('log_user_activity', {
      p_user_id: resetToken.user_id,
      p_action: 'PASSWORD_CHANGED',
      p_details: 'Password changed via reset token',
      p_ip_address: request.headers.get('x-forwarded-for') || request.ip,
      p_user_agent: request.headers.get('user-agent')
    });

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
