import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password, role } = body;

    // Validate required fields
    if (!identifier || !password || !role) {
      return NextResponse.json(
        { error: 'Identifier, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let userQuery;
    let userData;

    // Query based on role and identifier type
    switch (role) {
      case 'admin':
      case 'bursar':
        // For admin/bursar, identifier should be email
        userQuery = supabase
          .from('users')
          .select(`
            id,
            email,
            password_hash,
            name,
            role,
            status,
            avatar_url,
            permissions,
            has_default_password,
            password_expiry_date
          `)
          .eq('email', identifier)
          .eq('role', role)
          .eq('status', 'active')
          .single();
        break;

      case 'teacher':
        // For teachers, identifier can be email or teacher registration number
        // First try email
        userQuery = supabase
          .from('users')
          .select(`
            id,
            email,
            password_hash,
            name,
            role,
            status,
            avatar_url,
            permissions,
            has_default_password,
            password_expiry_date
          `)
          .eq('email', identifier)
          .eq('role', 'teacher')
          .eq('status', 'active')
          .single();

        // Execute the query to check if user exists by email
        const { data: teacherByEmail } = await userQuery;
        
        // If not found by email, try teacher registration number
        if (!teacherByEmail) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('role_specific_id', identifier)
            .single();

          if (profileData?.user_id) {
            userQuery = supabase
              .from('users')
              .select(`
                id,
                email,
                password_hash,
                name,
                role,
                status,
                avatar_url,
                permissions,
                has_default_password,
                password_expiry_date
              `)
              .eq('id', profileData.user_id)
              .eq('role', 'teacher')
              .eq('status', 'active')
              .single();
          }
        }
        break;

      case 'student':
        // For students, identifier can be email or student ID
        // First try email
        userQuery = supabase
          .from('users')
          .select(`
            id,
            email,
            password_hash,
            name,
            role,
            status,
            avatar_url,
            permissions,
            has_default_password,
            password_expiry_date
          `)
          .eq('email', identifier)
          .eq('role', 'student')
          .eq('status', 'active')
          .single();

        // Execute the query to check if user exists by email
        const { data: studentByEmail } = await userQuery;
        
        // If not found by email, try student ID
        if (!studentByEmail) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('role_specific_id', identifier)
            .single();

          if (profileData?.user_id) {
            userQuery = supabase
              .from('users')
              .select(`
                id,
                email,
                password_hash,
                name,
                role,
                status,
                avatar_url,
                permissions,
                has_default_password,
                password_expiry_date
              `)
              .eq('id', profileData.user_id)
              .eq('role', 'student')
              .eq('status', 'active')
              .single();
          }
        }
        break;

      case 'parent':
        // For parents, identifier can be email or parent code
        // First try email
        userQuery = supabase
          .from('users')
          .select(`
            id,
            email,
            password_hash,
            name,
            role,
            status,
            avatar_url,
            permissions,
            has_default_password,
            password_expiry_date
          `)
          .eq('email', identifier)
          .eq('role', 'parent')
          .eq('status', 'active')
          .single();

        // Execute the query to check if user exists by email
        const { data: parentByEmail } = await userQuery;
        
        // If not found by email, try parent code
        if (!parentByEmail) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('role_specific_id', identifier)
            .single();

          if (profileData?.user_id) {
            userQuery = supabase
              .from('users')
              .select(`
                id,
                email,
                password_hash,
                name,
                role,
                status,
                avatar_url,
                permissions,
                has_default_password,
                password_expiry_date
              `)
              .eq('id', profileData.user_id)
              .eq('role', 'parent')
              .eq('status', 'active')
              .single();
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid role specified' },
          { status: 400 }
        );
    }

    // Execute the query
    const { data: user, error: userError } = await userQuery;

    if (userError || !user) {
      console.error('User not found or error:', userError);
      return NextResponse.json(
        { error: 'Invalid credentials or user not found' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact administrator.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.error('Invalid password for user:', user.email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password expiry
    if (user.password_expiry_date) {
      const expiryDate = new Date(user.password_expiry_date);
      const now = new Date();
      if (now > expiryDate) {
        return NextResponse.json(
          { error: 'Password has expired. Please reset your password.' },
          { status: 401 }
        );
      }
    }

    // Get additional profile information
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role_specific_id, subsystem, branch, class_name')
      .eq('user_id', user.id)
      .single();

    // Prepare user data for response (remove sensitive information)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar_url,
      permissions: user.permissions,
      hasDefaultPassword: user.has_default_password,
      roleSpecificId: profileData?.role_specific_id,
      subsystem: profileData?.subsystem,
      branch: profileData?.branch,
      class: profileData?.class_name
    };

    // Log successful login
    try {
      await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_action: 'LOGIN',
        p_details: `User logged in successfully`,
        p_ip_address: request.headers.get('x-forwarded-for') || '',
        p_user_agent: request.headers.get('user-agent')
      });
    } catch (logError) {
      console.error('Failed to log login activity:', logError);
      // Don't fail the login if logging fails
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
