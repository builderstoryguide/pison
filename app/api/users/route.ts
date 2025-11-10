import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import bcrypt from 'bcryptjs';
import { validateDatabaseSetup, createDatabaseSetupErrorResponse } from '@/lib/database-validation';

export const runtime = 'nodejs'

// Initialize Supabase client
const supabase = createServiceClient();

// Helper function to generate initials from name
function generateInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'U'
  }
  
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) // Limit to 2 characters
}

// Helper function to generate role-specific ID using database-consistent logic
async function generateRoleSpecificId(role: string): Promise<string> {
  const year = new Date().getFullYear();
  
  switch (role) {
    case 'student': {
      let nextNumber = 1;
      try {
        const { data } = await supabase
          .from("students")
          .select("student_id")
          .like("student_id", `STU${year}%`)
          .order("student_id", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const lastId = data[0].student_id;
          const lastNumber = Number.parseInt(lastId.substring(7));
          nextNumber = lastNumber + 1;
        }
      } catch (error) {
        console.error("Error generating student ID:", error);
      }
      return `STU${year}${nextNumber.toString().padStart(3, "0")}`;
    }
    
    case 'teacher': {
      let counter = 1;
      let teacherId: string;
      let isUnique = false;

      while (!isUnique) {
        teacherId = `TCH${year}${counter.toString().padStart(3, "0")}`;
        const { data } = await supabase.from("teachers").select("teacher_id").eq("teacher_id", teacherId).single();
        isUnique = !data;
        if (!isUnique) counter++;
      }
      return teacherId!;
    }
    
    case 'parent': {
      let nextNumber = 1;
      try {
        const { data } = await supabase
          .from("parents")
          .select("parent_code")
          .like("parent_code", `PAR${year}%`)
          .order("parent_code", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const lastCode = data[0].parent_code;
          const lastNumber = Number.parseInt(lastCode.substring(7));
          nextNumber = lastNumber + 1;
        }
      } catch (error) {
        console.error("Error generating parent code:", error);
      }
      return `PAR${year}${nextNumber.toString().padStart(3, "0")}`;
    }
    
    case 'bursar': {
      let nextNumber = 1;
      try {
        const { data } = await supabase
          .from("users")
          .select("bursar_id")
          .like("bursar_id", `BUR${year}%`)
          .order("bursar_id", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const lastId = data[0].bursar_id;
          const lastNumber = Number.parseInt(lastId.substring(7));
          nextNumber = lastNumber + 1;
        }
      } catch (error) {
        console.error("Error generating bursar ID:", error);
      }
      return `BUR${year}${nextNumber.toString().padStart(3, "0")}`;
    }
    
    default: {
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `USR${year}${random}`;
    }
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
    // Check if environment variables are set (createServiceClient will throw if missing)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
    const limit = parseInt(searchParams.get('limit') || '50'); // Increased default limit
    const offset = (page - 1) * limit;

    // Validate database setup - check if user_details view exists
    try {
      const validationResult = await validateDatabaseSetup(supabase, [], ['user_details']);
      
      if (!validationResult.isValid) {
        console.error('Database setup validation failed:', validationResult.errors);
        const errorResponse = createDatabaseSetupErrorResponse(validationResult, 'user_details view');
        return NextResponse.json(errorResponse, { status: 500 });
      }
    } catch (networkError) {
      console.error('Network error when validating database setup:', networkError);
      return NextResponse.json(
        { 
          error: 'Database connection error',
          message: 'Unable to connect to the database. Please check your network connection.',
          details: networkError instanceof Error ? networkError.message : 'Network connection failed'
        },
        { status: 500 }
      );
    }

    let baseQuery = supabase
      .from('user_details')
      .select('*', { count: 'exact' });

    // Apply filters
    if (role) {
      baseQuery = baseQuery.eq('role', role);
    }
    if (status) {
      baseQuery = baseQuery.eq('status', status);
    }
    if (search) {
      baseQuery = baseQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,role_specific_id.ilike.%${search}%`);
    }

    // Try ordering by created_at; if it fails because the column doesn't exist in the view,
    // fall back to ordering by id.
    let users, error, count;
    let firstAttempt = await baseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    users = firstAttempt.data as any;
    error = firstAttempt.error as any;
    count = firstAttempt.count as any;

    if (error && /created_at/i.test(error.message || '') && /column|does not exist/i.test(error.message || '')) {
      const secondAttempt = await baseQuery
        .order('id', { ascending: false })
        .range(offset, offset + limit - 1);
      users = secondAttempt.data as any;
      error = secondAttempt.error as any;
      count = secondAttempt.count as any;
    }

    if (error) {
      console.error('Error fetching users:', error);
      
      // Check if it's a schema-related error
      if (
        error.code === 'PGRST116' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('no such table') ||
        error.message?.includes('schema cache')
      ) {
        // This suggests the view might not exist despite validation
        const validationResult = await validateDatabaseSetup(supabase, [], ['user_details']);
        if (!validationResult.isValid) {
          const errorResponse = createDatabaseSetupErrorResponse(validationResult, 'user_details view');
          return NextResponse.json(errorResponse, { status: 500 });
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch users',
          message: error.message || 'An error occurred while fetching users',
          code: error.code,
          details: error.details || null,
          hint: error.message?.includes('schema cache') 
            ? 'The database schema may need to be refreshed. Try running the migration scripts again.'
            : undefined
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
      teacher: ['manage_classes', 'grade_students', 'communicate_parents'],
      student: ['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers'],
      parent: ['view_child_progress', 'communicate_teachers', 'view_financial_records'],
      bursar: ['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']
    };

    // Generate role-specific ID
    const roleSpecificId = await generateRoleSpecificId(role);

    // Generate initials for avatar
    const initials = generateInitials(name);

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
        avatar_url: `initials:${initials}`, // Store initials as avatar URL
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

    // If creating a student, also create a record in the students table
    if (role === 'student') {
      try {
        // Check if student record already exists (from enrollment form)
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('student_id', roleSpecificId)
          .single();

        if (!existingStudent) {
          // Normalize class assignment: ensure we store class ID (UUID) instead of class name
          let classValue = className || null
          
          // Check if className is a UUID (class ID) or a class name
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(className || '')
          
          if (className && !isUUID) {
            // className is a class name, look up the class ID
            const { data: classData } = await supabase
              .from('classes')
              .select('id')
              .eq('class_name', className)
              .eq('status', 'active')
              .maybeSingle()
            
            if (classData) {
              classValue = classData.id
              console.log(`Resolved class name "${className}" to class ID: ${classData.id}`)
            } else {
              console.warn(`Could not find class with name "${className}", storing as-is for backward compatibility`)
              // Keep the original value for backward compatibility
            }
          }
          
          // Only create if it doesn't exist
          const studentData = {
            student_id: roleSpecificId,
            first_name: name.split(' ')[0] || name,
            last_name: name.split(' ').slice(1).join(' ') || '',
            email,
            phone,
            date_of_birth: dateOfBirth,
            gender,
            address,
            city: null, // Set to null instead of empty string
            region: null, // Set to null instead of empty string
            subsystem: subsystem || 'english', // Default to english if not provided
            branch: branch || 'grammar', // Default to grammar if not provided
            class: classValue, // Store class ID (UUID) if found, otherwise original value
            status: 'active',
            enrollment_status: 'enrolled',
            academic_year: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
            enrollment_date: new Date().toISOString().split('T')[0],
            nationality: 'Cameroonian', // Default value
            religion: null, // Set to null instead of empty string
            place_of_birth: null, // Set to null instead of empty string
            previous_school: null, // Set to null instead of empty string
            previous_class: null, // Set to null instead of empty string
            blood_group: bloodGroup || null,
            allergies: allergies || null,
            medical_conditions: medicalConditions || null
          };

          const { error: studentError } = await supabase
            .from('students')
            .insert(studentData);

          if (studentError) {
            console.error('Error creating student record:', studentError);
            // Note: We don't fail here as the user was created successfully
          } else {
            console.log('Student record created successfully:', roleSpecificId);
          }
        } else {
          console.log('Student record already exists, skipping creation:', roleSpecificId);
        }
      } catch (studentErr) {
        console.error('Error in student creation:', studentErr);
        // Note: We don't fail here as the user was created successfully
      }
    }

    // If creating a teacher, also create a record in the teachers table
    if (role === 'teacher') {
      try {
        // Check if teacher record already exists (from enrollment form)
        const { data: existingTeacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('teacher_id', roleSpecificId)
          .single();

        if (!existingTeacher) {
          // Only create if it doesn't exist
          const teacherData = {
            teacher_id: roleSpecificId,
            title: gender === 'female' ? 'Ms.' : 'Mr.', // Set valid title based on gender
            first_name: name.split(' ')[0] || name,
            last_name: name.split(' ').slice(1).join(' ') || '',
            email,
            phone,
            date_of_birth: dateOfBirth,
            gender,
            nationality: 'Cameroonian', // Default value
            id_number: null, // Set to null instead of empty string
            address,
            city: null, // Set to null instead of empty string
            region: null, // Set to null instead of empty string
            subsystem: subsystem || 'english', // Default to english if not provided
            subjects: [], // Empty array, can be updated later
            classes: [], // Empty array, can be updated later
            qualifications: [], // Empty array, can be updated later
            experience: null, // Set to null instead of empty string
            employment_type: 'full-time', // Default value
            salary: 0, // Default value, can be updated later
            start_date: new Date().toISOString().split('T')[0],
            emergency_contact_name: emergencyContactName || null,
            emergency_contact_relationship: emergencyContactRelationship || null,
            emergency_contact_phone: emergencyContactPhone || null,
            status: 'active'
          };

          const { data: insertedTeacher, error: teacherError } = await supabase
            .from('teachers')
            .insert(teacherData)
            .select('id')
            .single();

          if (teacherError) {
            console.error('Error creating teacher record:', teacherError);
            // Note: We don't fail here as the user was created successfully
          } else {
            console.log('Teacher record created successfully:', roleSpecificId);
            // Link teacher to user account by setting user_id
            if (insertedTeacher && user) {
              const { error: linkError } = await supabase
                .from('teachers')
                .update({ user_id: user.id })
                .eq('id', insertedTeacher.id);
              
              if (linkError) {
                console.warn('⚠️ Failed to link teacher to user account:', linkError.message);
              } else {
                console.log(`✅ Successfully linked teacher ${roleSpecificId} to user account`);
              }
            }
          }
        } else {
          console.log('Teacher record already exists, skipping creation:', roleSpecificId);
          // Link existing teacher to user account if not already linked
          if (existingTeacher && user) {
            const { data: currentTeacher } = await supabase
              .from('teachers')
              .select('user_id')
              .eq('id', existingTeacher.id)
              .single();
            
            if (currentTeacher && !currentTeacher.user_id) {
              const { error: linkError } = await supabase
                .from('teachers')
                .update({ user_id: user.id })
                .eq('id', existingTeacher.id);
              
              if (linkError) {
                console.warn('⚠️ Failed to link existing teacher to user account:', linkError.message);
              } else {
                console.log(`✅ Successfully linked existing teacher ${roleSpecificId} to user account`);
              }
            }
          }
        }
      } catch (teacherErr) {
        console.error('Error in teacher creation:', teacherErr);
        // Note: We don't fail here as the user was created successfully
      }
    }

    // Log activity (only if createdBy is provided)
    if (createdBy) {
      await supabase.rpc('log_user_activity', {
        p_user_id: createdBy,
        p_action: 'CREATE_USER',
        p_details: `Created new ${role} account for ${name}`,
        p_ip_address: request.headers.get('x-forwarded-for') || '',
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
      .select('id, email, role, name')
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

    // If updating a student, also update the students table
    if (updateData.role === 'student' || existingUser.role === 'student') {
      try {
        // Get the user profile to get the role_specific_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role_specific_id')
          .eq('user_id', userId)
          .single();

        if (profile?.role_specific_id) {
          const studentUpdateData = {
            first_name: updateData.name?.split(' ')[0] || existingUser.name?.split(' ')[0] || '',
            last_name: updateData.name?.split(' ').slice(1).join(' ') || existingUser.name?.split(' ').slice(1).join(' ') || '',
            email: updateData.email || existingUser.email,
            phone: updateData.phone,
            date_of_birth: updateData.dateOfBirth,
            gender: updateData.gender,
            address: updateData.address,
            subsystem: updateData.subsystem,
            branch: updateData.branch,
            class: updateData.class,
            status: updateData.status || 'active',
            updated_at: new Date().toISOString()
          };

          // Try to update existing student record
          const { error: studentUpdateError } = await supabase
            .from('students')
            .update(studentUpdateData)
            .eq('student_id', profile.role_specific_id);

          if (studentUpdateError) {
            console.error('Error updating student record:', studentUpdateError);
            // Note: We don't fail here as the user was updated successfully
          } else {
            console.log('Student record updated successfully:', profile.role_specific_id);
          }
        }
      } catch (studentErr) {
        console.error('Error in student update:', studentErr);
        // Note: We don't fail here as the user was updated successfully
      }
    }

    // If updating a teacher, also update the teachers table
    if (updateData.role === 'teacher' || existingUser.role === 'teacher') {
      try {
        // Get the user profile to get the role_specific_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role_specific_id')
          .eq('user_id', userId)
          .single();

        if (profile?.role_specific_id) {
          const teacherUpdateData = {
            first_name: updateData.name?.split(' ')[0] || existingUser.name?.split(' ')[0] || '',
            last_name: updateData.name?.split(' ').slice(1).join(' ') || existingUser.name?.split(' ').slice(1).join(' ') || '',
            email: updateData.email || existingUser.email,
            phone: updateData.phone,
            date_of_birth: updateData.dateOfBirth,
            gender: updateData.gender,
            address: updateData.address,
            subsystem: updateData.subsystem,
            branch: updateData.branch,
            status: updateData.status || 'active',
            updated_at: new Date().toISOString()
          };

          // Try to update existing teacher record
          const { error: teacherUpdateError } = await supabase
            .from('teachers')
            .update(teacherUpdateData)
            .eq('teacher_id', profile.role_specific_id);

          if (teacherUpdateError) {
            console.error('Error updating teacher record:', teacherUpdateError);
            // Note: We don't fail here as the user was updated successfully
          } else {
            console.log('Teacher record updated successfully:', profile.role_specific_id);
            // Ensure teacher is linked to user account
            const { data: teacherRecord } = await supabase
              .from('teachers')
              .select('user_id')
              .eq('teacher_id', profile.role_specific_id)
              .single();
            
            if (teacherRecord && !teacherRecord.user_id) {
              const { error: linkError } = await supabase
                .from('teachers')
                .update({ user_id: userId })
                .eq('teacher_id', profile.role_specific_id);
              
              if (linkError) {
                console.warn('⚠️ Failed to link teacher to user during update:', linkError.message);
              } else {
                console.log(`✅ Successfully linked teacher ${profile.role_specific_id} to user during update`);
              }
            }
          }
        }
      } catch (teacherErr) {
        console.error('Error in teacher update:', teacherErr);
        // Note: We don't fail here as the user was updated successfully
      }
    }

    // Log activity (only if updatedBy is provided)
    if (updateData.updatedBy) {
      await supabase.rpc('log_user_activity', {
        p_user_id: updateData.updatedBy,
        p_action: 'UPDATE_USER',
        p_details: `Updated profile for ${user.name}`,
        p_ip_address: request.headers.get('x-forwarded-for') || '',
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
      .select('id, name, role')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If deleting a student, also delete the corresponding student record
    if (existingUser.role === 'student') {
      try {
        // Get the user profile to get the role_specific_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role_specific_id')
          .eq('user_id', userId)
          .single();

        if (profile?.role_specific_id) {
          // Delete the student record
          const { error: studentDeleteError } = await supabase
            .from('students')
            .delete()
            .eq('student_id', profile.role_specific_id);

          if (studentDeleteError) {
            console.error('Error deleting student record:', studentDeleteError);
            // Note: We don't fail here as the user was deleted successfully
          } else {
            console.log('Student record deleted successfully:', profile.role_specific_id);
          }
        }
      } catch (studentErr) {
        console.error('Error in student deletion:', studentErr);
        // Note: We don't fail here as the user was deleted successfully
      }
    }

    // If deleting a teacher, also delete the corresponding teacher record
    if (existingUser.role === 'teacher') {
      try {
        // Get the user profile to get the role_specific_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role_specific_id')
          .eq('user_id', userId)
          .single();

        if (profile?.role_specific_id) {
          // Delete the teacher record
          const { error: teacherDeleteError } = await supabase
            .from('teachers')
            .delete()
            .eq('teacher_id', profile.role_specific_id);

          if (teacherDeleteError) {
            console.error('Error deleting teacher record:', teacherDeleteError);
            // Note: We don't fail here as the user was deleted successfully
          } else {
            console.log('Teacher record deleted successfully:', profile.role_specific_id);
          }
        }
      } catch (teacherErr) {
        console.error('Error in teacher deletion:', teacherErr);
        // Note: We don't fail here as the user was deleted successfully
      }
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
        p_ip_address: request.headers.get('x-forwarded-for') || '',
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
