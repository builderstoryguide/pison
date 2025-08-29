import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate role-specific ID
function generateRoleSpecificId(role: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  switch (role) {
    case 'student':
      return `STU${year}${random}`;
    case 'teacher':
      return `TCH${year}${random}`;
    case 'parent':
      return `PAR${year}${random}`;
    case 'bursar':
      return `BUR${year}${random}`;
    default:
      return `USR${year}${random}`;
  }
}

// Helper function to generate default password
function generateDefaultPassword(role: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  return `${capitalizedRole}@${year}${random}`;
}

// GET - Retrieve users with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          message: 'Database connection not configured'
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // First, check if the user_details view exists
    const { data: viewCheck, error: viewError } = await supabase
      .from('user_details')
      .select('id')
      .limit(1);

    if (viewError) {
      console.error('Database view error:', viewError);
      return NextResponse.json(
        { 
          error: 'Database not set up',
          message: 'Please run the database setup script first',
          details: viewError.message
        },
        { status: 500 }
      );
    }

    let query = supabase
      .from('user_details')
      .select('*', { count: 'exact' });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,role_specific_id.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch users',
          message: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      role,
      phone,
      address,
      dateOfBirth,
      gender,
      subsystem,
      branch,
      class: className,
      occupation,
      relationship,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      bloodGroup,
      allergies,
      medicalConditions,
      createdBy
    } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate default password
    const defaultPassword = generateDefaultPassword(role);
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Set default permissions based on role
    const rolePermissions = {
      admin: ['all'],
      teacher: ['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents'],
      student: ['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers'],
      parent: ['view_child_progress', 'communicate_teachers', 'view_financial_records'],
      bursar: ['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']
    };

    // Generate role-specific ID
    const roleSpecificId = generateRoleSpecificId(role);

    // Set password expiry (30 days from now)
    const passwordExpiryDate = new Date();
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 30);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        name,
        role,
        status: 'active',
        phone,
        address,
        date_of_birth: dateOfBirth,
        gender,
        permissions: rolePermissions[role as keyof typeof rolePermissions] || [],
        has_default_password: true,
        password_last_changed: new Date().toISOString(),
        password_expiry_date: passwordExpiryDate.toISOString(),
        ...(createdBy && { created_by: createdBy })
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile
    const profileData = {
      user_id: user.id,
      role_specific_id: roleSpecificId,
      subsystem,
      branch,
      class_name: className,
      occupation,
      relationship,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      emergency_contact_relationship: emergencyContactRelationship,
      blood_group: bloodGroup,
      allergies,
      medical_conditions: medicalConditions
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Note: We don't fail here as the user was created successfully
    }

    // Log activity (only if createdBy is provided)
    if (createdBy) {
      await supabase.rpc('log_user_activity', {
        p_user_id: createdBy,
        p_action: 'CREATE_USER',
        p_details: `Created new ${role} account for ${name}`,
        p_ip_address: request.headers.get('x-forwarded-for') || request.ip,
        p_user_agent: request.headers.get('user-agent')
      });
    }

    // Return user data with generated password
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        role_specific_id: roleSpecificId
      },
      password: defaultPassword,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({
        name: updateData.name,
        phone: updateData.phone,
        address: updateData.address,
        date_of_birth: updateData.dateOfBirth,
        gender: updateData.gender,
        status: updateData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      console.error('Error updating user:', userError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Update user profile
    const profileUpdateData = {
      subsystem: updateData.subsystem,
      branch: updateData.branch,
      class_name: updateData.class,
      occupation: updateData.occupation,
      relationship: updateData.relationship,
      emergency_contact_name: updateData.emergencyContactName,
      emergency_contact_phone: updateData.emergencyContactPhone,
      emergency_contact_relationship: updateData.emergencyContactRelationship,
      blood_group: updateData.bloodGroup,
      allergies: updateData.allergies,
      medical_conditions: updateData.medicalConditions,
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(profileUpdateData)
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
    }

    // Log activity (only if updatedBy is provided)
    if (updateData.updatedBy) {
      await supabase.rpc('log_user_activity', {
        p_user_id: updateData.updatedBy,
        p_action: 'UPDATE_USER',
        p_details: `Updated profile for ${user.name}`,
        p_ip_address: request.headers.get('x-forwarded-for') || request.ip,
        p_user_agent: request.headers.get('user-agent')
      });
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const deletedBy = searchParams.get('deletedBy');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (this will cascade to user_profiles due to foreign key constraint)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Log activity
    if (deletedBy) {
      await supabase.rpc('log_user_activity', {
        p_user_id: deletedBy,
        p_action: 'DELETE_USER',
        p_details: `Deleted user account for ${existingUser.name}`,
        p_ip_address: request.headers.get('x-forwarded-for') || request.ip,
        p_user_agent: request.headers.get('user-agent')
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
