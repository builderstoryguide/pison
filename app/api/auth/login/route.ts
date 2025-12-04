import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs'

// Initialize Supabase client
const supabase = createServiceClient();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔐 [LOGIN] Request received at', new Date().toISOString());
  
  try {
    const body = await request.json();
    console.log('🔐 [LOGIN] Body parsed in', Date.now() - startTime, 'ms');
    const { identifier, password, role } = body;

    // Validate required fields
    if (!identifier || !password || !role) {
      console.log('🔐 [LOGIN] Validation failed - missing fields');
      return NextResponse.json(
        { error: 'Identifier, password, and role are required' },
        { status: 400 }
      );
    }

    console.log('🔐 [LOGIN] Validation passed, querying database for role:', role);

    // Helper function to check if error is a "not found" error
    // Helper function to check if error is a "not found" error
    const isNotFoundError = (error: unknown) => {
      const err = error as any;
      return err?.code === 'PGRST116' || 
             err?.message?.includes('The result contains 0 rows') ||
             err?.message?.includes('Cannot coerce the result to a single JSON object');
    };

    // Helper function to query user by email
    const queryUserByEmail = async (email: string, userRole: string) => {
      const { data, error } = await supabase
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
        .eq('email', email)
        .eq('role', userRole)
        .eq('status', 'active')
        .maybeSingle();

      // Treat PGRST116 as "not found" rather than an error
      if (error && !isNotFoundError(error)) {
        return { data: null, error };
      }
      return { data, error: null };
    };

    // Helper function to query user by role-specific ID
    const queryUserByRoleSpecificId = async (roleSpecificId: string, userRole: string) => {
      // First get the user_id from user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('role_specific_id', roleSpecificId)
        .maybeSingle();

      // Treat PGRST116 as "not found" rather than an error
      if (profileError && !isNotFoundError(profileError)) {
        return { data: null, error: profileError };
      }

      if (!profileData?.user_id) {
        return { data: null, error: null };
      }

      // Then get the user by user_id
      const { data, error } = await supabase
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
        .eq('role', userRole)
        .eq('status', 'active')
        .maybeSingle();

      // Treat PGRST116 as "not found" rather than an error
      if (error && !isNotFoundError(error)) {
        return { data: null, error };
      }
      return { data, error: null };
    };

    let user = null;
    let userError = null;

    // Query based on role and identifier type
    switch (role) {
      case 'admin':
      case 'bursar': {
        // For admin/bursar, identifier should be email
        const adminResult = await queryUserByEmail(identifier, role);
        user = adminResult.data;
        userError = adminResult.error;
        break;
      }

      case 'teacher':
      case 'student':
      case 'parent': {
        // For teachers/students/parents, identifier can be email or role-specific ID
        // First try email
        const emailResult = await queryUserByEmail(identifier, role);
        user = emailResult.data;
        userError = emailResult.error;

        // If not found by email, try role-specific ID
        if (!user && !userError) {
          const roleIdResult = await queryUserByRoleSpecificId(identifier, role);
          user = roleIdResult.data;
          userError = roleIdResult.error;
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid role specified' },
          { status: 400 }
        );
    }

    // If there's a real error (not a "not found" error), return it
    if (userError) {
      console.error('🔐 [LOGIN] Database error at', Date.now() - startTime, 'ms:', userError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // If user not found, return authentication error
    if (!user) {
      console.log('🔐 [LOGIN] User not found at', Date.now() - startTime, 'ms');
      return NextResponse.json(
        { error: 'Invalid credentials or user not found' },
        { status: 401 }
      );
    }

    console.log('🔐 [LOGIN] User found at', Date.now() - startTime, 'ms, verifying password');

    // Check if user is active
    if (user.status !== 'active') {
      console.log('🔐 [LOGIN] User inactive at', Date.now() - startTime, 'ms');
      return NextResponse.json(
        { error: 'Account is not active. Please contact administrator.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('🔐 [LOGIN] Password verified at', Date.now() - startTime, 'ms');
    
    if (!isPasswordValid) {
      console.log('🔐 [LOGIN] Invalid password at', Date.now() - startTime, 'ms');
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
        console.log('🔐 [LOGIN] Password expired at', Date.now() - startTime, 'ms');
        return NextResponse.json(
          { error: 'Password has expired. Please reset your password.' },
          { status: 401 }
        );
      }
    }

    console.log('🔐 [LOGIN] Fetching profile data at', Date.now() - startTime, 'ms');

    // Get additional profile information (optional - user may not have a profile)
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role_specific_id, subsystem, branch, class_name')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('🔐 [LOGIN] Profile data fetched at', Date.now() - startTime, 'ms');

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

    // Log successful login (fire-and-forget to avoid blocking response)
    // Don't await this - let it run in the background
    Promise.resolve(
      supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_action: 'LOGIN',
        p_details: `User logged in successfully`,
        p_ip_address: request.headers.get('x-forwarded-for') || '',
        p_user_agent: request.headers.get('user-agent')
      })
    ).then(() => {
      console.log('🔐 [LOGIN] Activity logged successfully');
    }).catch((logError: unknown) => {
      console.error('🔐 [LOGIN] Failed to log activity (non-blocking):', logError);
    });

    console.log('✅ [LOGIN] Login successful, total time:', Date.now() - startTime, 'ms');

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('💥 [LOGIN] Error at', Date.now() - startTime, 'ms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
