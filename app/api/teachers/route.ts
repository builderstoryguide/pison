import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateDefaultPassword } from '@/lib/password-utils'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

// Type definitions for better type safety
interface TeacherRequestBody {
  title?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  idNumber?: string
  address?: string
  city?: string
  region?: string
  subsystem: 'english' | 'french'
  subjects?: string[]
  classes?: string[]
  qualifications?: string[]
  experience?: string
  employmentType: 'full-time' | 'part-time' | 'contract'
  salary?: number
  startDate?: string
  emergencyContact?: {
    name?: string
    relationship?: string
    phone?: string
  }
  status?: 'active' | 'inactive'
  createdBy?: string
}

// User type from database (matches users table structure)
interface User {
  id: string
  email: string
  name: string
  role: string
  status?: string
  created_at?: string
  updated_at?: string
}

// API Response types
interface TeacherCreateSuccessResponse {
  success: true
  teacherId: string
  password: string
  teacher: {
    id: string
    teacherId: string
    name: string
    email: string
  }
  message: string
  userAccountCreated: boolean // Indicates if user account was successfully created
  userAccountError?: string // Error message if user account creation failed
}

interface TeacherCreateErrorResponse {
  error: string
  details?: string
}

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createServiceClient()

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

// Helper function to generate unique teacher ID
async function generateTeacherId(): Promise<string> {
  const currentYear = new Date().getFullYear()
  let teacherId: string
  let isUnique = false
  let counter = 1

  while (!isUnique) {
    teacherId = `TCH${currentYear}${counter.toString().padStart(3, "0")}`

    const { data } = await supabase
      .from("teachers")
      .select("teacher_id")
      .eq("teacher_id", teacherId)
      .single()
    
    isUnique = !data

    if (!isUnique) counter++
  }

  return teacherId!
}

// POST - Create a new teacher
export async function POST(
  request: NextRequest
): Promise<NextResponse<TeacherCreateSuccessResponse | TeacherCreateErrorResponse>> {
  try {
    let body: TeacherRequestBody
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }
    
    // Validate request body exists and is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Request body must be a valid JSON object' },
        { status: 400 }
      )
    }
    
    // Destructure with type safety
    const {
      title,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      nationality,
      idNumber,
      address,
      city,
      region,
      subsystem,
      subjects,
      classes,
      qualifications,
      experience,
      employmentType,
      salary,
      startDate,
      emergencyContact,
      status,
      createdBy
    } = body

    // Validate required fields with clear error messages
    const missingFields: string[] = []
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      missingFields.push('firstName')
    }
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      missingFields.push('lastName')
    }
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      missingFields.push('email')
    }
    if (!subsystem || typeof subsystem !== 'string') {
      missingFields.push('subsystem')
    }
    if (!employmentType || typeof employmentType !== 'string') {
      missingFields.push('employmentType')
    }
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: `The following fields are required: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', details: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate subsystem value
    if (!['english', 'french'].includes(subsystem)) {
      return NextResponse.json(
        { error: 'Invalid subsystem', details: 'Subsystem must be either "english" or "french"' },
        { status: 400 }
      )
    }

    // Validate employment type
    if (!['full-time', 'part-time', 'contract'].includes(employmentType)) {
      return NextResponse.json(
        { error: 'Invalid employment type', details: 'Employment type must be "full-time", "part-time", or "contract"' },
        { status: 400 }
      )
    }

    // Check if teacher with this email already exists
    const { data: existingTeacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('email', email)
      .single()

    if (existingTeacher) {
      return NextResponse.json(
        { error: 'A teacher with this email already exists' },
        { status: 409 }
      )
    }

    // Generate unique teacher ID
    const teacherId = await generateTeacherId()

    // Generate password for teacher
    const teacherPassword = generateDefaultPassword('teacher')

    // Prepare teacher data for insertion
    const teacherData = {
      teacher_id: teacherId,
      title: title || null,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      nationality: nationality || null,
      id_number: idNumber || null,
      address: address || null,
      city: city || null,
      region: region || null,
      subsystem: subsystem,
      subjects: subjects || [],
      classes: classes || [],
      qualifications: qualifications || [],
      experience: experience || null,
      employment_type: employmentType,
      salary: salary || 0,
      start_date: startDate || null,
      emergency_contact_name: emergencyContact?.name || null,
      emergency_contact_relationship: emergencyContact?.relationship || null,
      emergency_contact_phone: emergencyContact?.phone || null,
      status: status || 'active'
    }

    // Insert teacher record
    const { data: insertedTeacher, error: teacherError } = await supabase
      .from('teachers')
      .insert(teacherData)
      .select()
      .single()

    if (teacherError) {
      console.error('❌ Database error creating teacher:', teacherError)
      console.error('❌ Error code:', teacherError.code)
      console.error('❌ Error details:', teacherError.details)
      console.error('❌ Error hint:', teacherError.hint)
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to create teacher'
      let statusCode = 500
      
      if (teacherError.message) {
        if (teacherError.message.includes('valid_phone') || teacherError.code === '23514') {
          errorMessage = 'Invalid phone number format. Please ensure the phone number follows the Cameroon format (+237 6XXXXXXXX).'
          statusCode = 400
        } else if (teacherError.message.includes('duplicate key') || teacherError.code === '23505') {
          errorMessage = 'A teacher with this email or ID number already exists. Please use a different email or ID number.'
          statusCode = 409
        } else if (teacherError.message.includes('not null') || teacherError.code === '23502') {
          errorMessage = 'Missing required information. Please fill in all required fields.'
          statusCode = 400
        } else if (teacherError.message.includes('row-level security') || teacherError.code === '42501') {
          errorMessage = 'Permission denied: Row-level security policy violation. This should not happen when using the API route. Please contact administrator.'
          statusCode = 403
        } else if (teacherError.message.includes('foreign key') || teacherError.code === '23503') {
          errorMessage = 'Invalid reference: One or more referenced records do not exist.'
          statusCode = 400
        } else if (teacherError.message.includes('check constraint') || teacherError.code === '23514') {
          errorMessage = 'Data validation failed. Please check that all field values are valid.'
          statusCode = 400
        } else {
          errorMessage = teacherError.message || 'Unknown database error occurred'
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: teacherError.details || undefined,
          code: teacherError.code || undefined
        },
        { status: statusCode }
      )
    }

    if (!insertedTeacher) {
      return NextResponse.json(
        { error: 'Failed to create teacher record' },
        { status: 500 }
      )
    }

    // Define teacherName at function scope to ensure it's available for return statement
    // This prevents "teacherName is not defined" errors
    // Validate firstName and lastName are defined before concatenation
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Invalid teacher name', details: 'First name and last name are required' },
        { status: 400 }
      )
    }
    
    const teacherName = `${firstName.trim()} ${lastName.trim()}`
    const teacherInitials = generateInitials(teacherName)
    
    // Validate that teacherName was created successfully
    if (!teacherName || teacherName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate teacher name', details: 'Could not create teacher name from provided data' },
        { status: 500 }
      )
    }

    // Declare teacherUser outside try-catch block to ensure proper scope
    // This prevents "teacherUser is not defined" errors when referenced later
    let teacherUser: User | null = null
    let userAccountCreated = false
    let userAccountError: string | undefined = undefined

    // Check if user already exists before attempting to create
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      console.warn(`⚠️ User account already exists for email: ${email}`)
      userAccountError = 'User account already exists for this email'
      // Link teacher to existing user account
      teacherUser = existingUser
      // Update teacher record with user_id
      if (insertedTeacher && existingUser) {
        const { error: updateError } = await supabase
          .from('teachers')
          .update({ user_id: existingUser.id })
          .eq('id', insertedTeacher.id)

        if (updateError) {
          console.warn('⚠️ Failed to link teacher to existing user account:', updateError.message)
        } else {
          console.log(`✅ Successfully linked teacher ${teacherId} to existing user account`)
        }
      }
      // We still proceed since the teacher record was created successfully
      // The frontend can handle linking the existing user to the teacher
    } else {
      // Create user account for teacher
      try {
        const { data: createdUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: email,
            password_hash: await bcrypt.hash(teacherPassword, 12),
            name: teacherName,
            role: 'teacher',
            status: 'active',
            avatar_url: `initials:${teacherInitials}`,
            phone: phone || null,
            has_default_password: true,
            password_last_changed: new Date().toISOString(),
            password_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            permissions: ['manage_classes', 'grade_students', 'communicate_parents'],
            created_by: createdBy || null
          })
          .select()
          .single()

        if (userError) {
          console.error('❌ Failed to create teacher user account:', userError)
          console.error('❌ User error code:', userError.code)
          console.error('❌ User error message:', userError.message)
          console.error('❌ User error details:', userError.details)
          
          userAccountError = userError.message || 'Failed to create user account'
          
          // CRITICAL: Rollback teacher creation if user account creation fails
          // This ensures data consistency - we don't want orphaned teacher records
          console.log(`🔄 Rolling back teacher creation for ${teacherId} due to user account creation failure...`)
          
          const { error: deleteError } = await supabase
            .from('teachers')
            .delete()
            .eq('id', insertedTeacher.id)
          
          if (deleteError) {
            console.error('❌ CRITICAL: Failed to rollback teacher creation:', deleteError)
            console.error('⚠️ Orphaned teacher record exists with ID:', insertedTeacher.id)
            // Even if rollback fails, we still return an error
          } else {
            console.log(`✅ Successfully rolled back teacher creation for ${teacherId}`)
          }
          
          // Return error response - teacher creation was rolled back
          return NextResponse.json(
            {
              error: 'Failed to create user account',
              details: userAccountError,
              message: 'Teacher enrollment failed: Could not create login credentials. Please try again or contact support.'
            },
            { status: 500 }
          )
        } else if (createdUser) {
          // Assign to teacherUser for use outside this block
          teacherUser = createdUser
          userAccountCreated = true
          console.log(`✅ Successfully created user account for teacher ${teacherId}`)
          
          // Create user profile for teacher
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: teacherUser.id,
              role_specific_id: teacherId,
              subsystem: subsystem,
              occupation: employmentType,
              emergency_contact_name: emergencyContact?.name || null,
              emergency_contact_phone: emergencyContact?.phone || null,
              emergency_contact_relationship: emergencyContact?.relationship || null
            })
          
          if (profileError) {
            console.warn('⚠️ Failed to create teacher user profile:', profileError.message)
            // Profile creation failure is not critical, but we log it
            // The user account still exists, so this is recoverable
          } else {
            console.log(`✅ Successfully created user profile for teacher ${teacherId}`)
          }

          // Link teacher record to user account
          if (insertedTeacher && teacherUser) {
            const { error: updateError } = await supabase
              .from('teachers')
              .update({ user_id: teacherUser.id })
              .eq('id', insertedTeacher.id)

            if (updateError) {
              console.warn('⚠️ Failed to link teacher to user account:', updateError.message)
              // This is not critical, but we log it
            } else {
              console.log(`✅ Successfully linked teacher ${teacherId} to user account`)
            }
          }
        }
      } catch (userErr) {
        console.error('❌ Exception creating teacher user account:', userErr)
        userAccountError = userErr instanceof Error ? userErr.message : 'Unknown error occurred'
        
        // CRITICAL: Rollback teacher creation if user account creation fails
        console.log(`🔄 Rolling back teacher creation for ${teacherId} due to exception...`)
        
        const { error: deleteError } = await supabase
          .from('teachers')
          .delete()
          .eq('id', insertedTeacher.id)
        
        if (deleteError) {
          console.error('❌ CRITICAL: Failed to rollback teacher creation:', deleteError)
          console.error('⚠️ Orphaned teacher record exists with ID:', insertedTeacher.id)
        } else {
          console.log(`✅ Successfully rolled back teacher creation for ${teacherId}`)
        }
        
        // Return error response - teacher creation was rolled back
        return NextResponse.json(
          {
            error: 'Failed to create user account',
            details: userAccountError,
            message: 'Teacher enrollment failed: Could not create login credentials. Please try again or contact support.'
          },
          { status: 500 }
        )
      }
    }

    // Create teacher_subjects records if subjects are provided
    // Add null check before using teacherUser
    if (subjects && Array.isArray(subjects) && subjects.length > 0 && teacherUser && teacherUser.id) {
      try {
        // Get subject IDs from subject names
        const { data: subjectRecords } = await supabase
          .from('subjects')
          .select('id, name')
          .in('name', subjects)
          .eq('is_active', true)

        if (subjectRecords && subjectRecords.length > 0 && teacherUser) {
          // Create teacher_subjects records
          // Additional null check for teacherUser (TypeScript guard)
          const teacherSubjectsData = subjectRecords.map((subject) => ({
            teacher_id: teacherUser!.id, // Non-null assertion safe due to check above
            subject_id: subject.id,
            subject_name: subject.name,
            assignment_type: 'main_subject',
            is_active: true,
          }))

          const { error: teacherSubjectsError } = await supabase
            .from('teacher_subjects')
            .insert(teacherSubjectsData)

          if (teacherSubjectsError) {
            console.warn('Failed to create teacher_subjects records:', teacherSubjectsError.message)
            // Continue even if teacher_subjects creation fails
          } else {
            console.log(`Created ${teacherSubjectsData.length} teacher_subjects records for teacher ${teacherId}`)
          }
        } else {
          console.warn('No matching subjects found in database for provided subject names:', subjects)
        }
      } catch (subjectsError) {
        console.warn('Error creating teacher_subjects records:', subjectsError)
        // Continue even if teacher_subjects creation fails
      }
    }

    // Create class_teachers junction table records if classes are provided
    // This links the teacher to classes they teach (not just class teacher assignments)
    if (classes && Array.isArray(classes) && classes.length > 0 && insertedTeacher && insertedTeacher.id) {
      try {
        // Get class IDs from class names
        // Classes can be stored in either class_name (new) or name (old) column for backward compatibility
        const { data: classRecords, error: classQueryError } = await supabase
          .from('classes')
          .select('id, class_name, name')
          .in('class_name', classes)
          .eq('status', 'active')

        // If no classes found by class_name, try the old 'name' column
        let classesToAssign = classRecords || []
        if (!classRecords || classRecords.length === 0) {
          const { data: classRecordsByName } = await supabase
            .from('classes')
            .select('id, class_name, name')
            .in('name', classes)
            .eq('status', 'active')
          
          if (classRecordsByName) {
            classesToAssign = classRecordsByName
          }
        }

        if (classesToAssign && classesToAssign.length > 0) {
          // Create class_teachers junction table records
          // teacher_row_id references teachers.id (not users.id)
          const classTeachersData = classesToAssign.map((cls) => ({
            class_id: cls.id,
            teacher_row_id: insertedTeacher.id, // Use teachers.id, not users.id
          }))

          const { error: classTeachersError } = await supabase
            .from('class_teachers')
            .insert(classTeachersData)

          if (classTeachersError) {
            console.warn('Failed to create class_teachers records:', classTeachersError.message)
            // Continue even if class_teachers creation fails
          } else {
            console.log(`Created ${classTeachersData.length} class_teachers records for teacher ${teacherId}`)
          }
        } else {
          console.warn('No matching classes found in database for provided class names:', classes)
        }
      } catch (classesError) {
        console.warn('Error creating class_teachers records:', classesError)
        // Continue even if class_teachers creation fails
      }
    }

    // Log activity if createdBy is provided
    if (createdBy) {
      try {
        await supabase.rpc('log_user_activity', {
          p_user_id: createdBy,
          p_action: 'CREATE_TEACHER',
          p_details: `Created new teacher account for ${firstName} ${lastName} (${teacherId})`,
          p_ip_address: request.headers.get('x-forwarded-for') || '',
          p_user_agent: request.headers.get('user-agent') || ''
        })
      } catch (logError) {
        console.warn('Failed to log activity:', logError)
      }
    }

    // Return success response
    // Validate that insertedTeacher exists before accessing its properties
    if (!insertedTeacher || !insertedTeacher.id) {
      console.error('❌ Teacher insertion succeeded but no teacher data returned')
      return NextResponse.json(
        {
          error: 'Teacher creation completed but verification failed',
          details: 'Please verify the teacher was created successfully'
        },
        { status: 500 }
      )
    }

    const successResponse: TeacherCreateSuccessResponse = {
      success: true,
      teacherId: teacherId,
      password: teacherPassword,
      teacher: {
        id: insertedTeacher.id,
        teacherId: teacherId,
        name: teacherName,
        email: email
      },
      message: userAccountCreated 
        ? 'Teacher created successfully with login credentials'
        : 'Teacher created but user account already exists',
      userAccountCreated: userAccountCreated,
      userAccountError: userAccountError
    }

    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('❌ Error in POST /api/teachers:', error)
    
    // Provide detailed error information for debugging
    let errorMessage = 'Internal server error'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message || 'Internal server error'
      
      // Handle specific error types
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        errorMessage = 'Invalid JSON in request body'
        statusCode = 400
      } else if (error.message.includes('Unexpected token')) {
        errorMessage = 'Invalid request format'
        statusCode = 400
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    const errorResponse: TeacherCreateErrorResponse = {
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }

    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

