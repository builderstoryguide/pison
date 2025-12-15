import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, logApiError, handleSupabaseError } from '@/lib/api/error-handler'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Helper function to get a student's class ID from multiple sources
 * Checks in order: class_students junction table, students.class_id, students.class
 * @param supabase - Supabase client instance
 * @param studentId - The student's UUID
 * @returns The class ID (UUID) if found, null otherwise
 */
async function getStudentClassId(supabase: SupabaseClient, studentId: string): Promise<string | null> {
  // Check class_students junction table first (most reliable)
  const { data: classStudent, error: junctionError } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .maybeSingle()

  if (!junctionError && classStudent?.class_id) {
    return classStudent.class_id
  }

  // Fall back to students.class_id if it's a valid UUID
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('class_id, class')
    .eq('id', studentId)
    .maybeSingle()

  if (studentError) {
    logApiError('Error fetching student class information', studentError, { studentId })
    return null
  }

  if (!student) {
    return null
  }

  // Check class_id column if it's a valid UUID
  if (student.class_id) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.class_id)
    if (isUUID) {
      return student.class_id
    }
  }

  // Fall back to class column if it's a valid UUID
  if (student.class) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.class)
    if (isUUID) {
      return student.class
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const requestUrl = request.url
  const requestPath = new URL(requestUrl).pathname
  
  try {
    const supabase = await createClient()
    
    // Validate Supabase client
    if (!supabase) {
      logApiError('GET /api/bursar/student-fees', new Error('Supabase client not initialized'), { requestPath })
      return createErrorResponse(
        new Error('Database connection failed'),
        500,
        { path: requestPath, includeDetails: false }
      )
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(requestUrl)
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const status = searchParams.get('status')

    const queryFilters = {
      studentId,
      classId,
      academicYear,
      term,
      status
    }

    console.log('GET /api/bursar/student-fees - Starting query', {
      requestPath,
      filters: queryFilters
    })

    // Try query with nested relationships first, fallback to simpler query if it fails
    let query = supabase
      .from('student_fee_assignments')
      .select(`
        *,
        students (first_name, last_name, student_id, classes (name, subsystem)),
        fee_structures (name, academic_year, term, due_date)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    if (classId) {
      query = query.eq('students.classes.id', classId)
    }
    if (academicYear) {
      query = query.eq('fee_structures.academic_year', academicYear)
    }
    if (term) {
      query = query.eq('fee_structures.term', term)
    }
    if (status) {
      query = query.eq('status', status)
    }

    let { data, error } = await query

    // If query fails due to relationship issues, try simpler query
    if (error && (error.code === 'PGRST201' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('foreign key'))) {
      const relationshipError = handleSupabaseError(error, 'Nested relationship query failed', {
        table: 'student_fee_assignments',
        operation: 'SELECT with relationships',
        filters: queryFilters
      })
      
      console.warn('Nested relationship query failed, trying simpler query:', relationshipError)
      
      // Fallback to simpler query without nested relationships
      let simpleQuery = supabase
        .from('student_fee_assignments')
        .select('*')
        .order('created_at', { ascending: false })

      if (studentId) {
        simpleQuery = simpleQuery.eq('student_id', studentId)
      }
      if (status) {
        simpleQuery = simpleQuery.eq('status', status)
      }

      const simpleResult = await simpleQuery
      data = simpleResult.data
      error = simpleResult.error

      if (error) {
        return createErrorResponse(
          error,
          500,
          { path: requestPath, includeDetails: true }
        )
      }

      // If we have data, we'll need to fetch related data separately
      if (data && !error && data.length > 0) {
        try {
          // Fetch students separately
          const studentIds = [...new Set(data.map((sf: any) => sf.student_id).filter(Boolean))]
          let studentsData: any[] = []
          if (studentIds.length > 0) {
            const { data: students, error: studentsError } = await supabase
              .from('students')
              .select('id, first_name, last_name, student_id, class')
              .in('id', studentIds)
            
            if (studentsError) {
              logApiError('Failed to fetch students for fee assignments', studentsError, {
                studentIds: studentIds.length
              })
            } else {
              studentsData = students || []
            }
          }

          // Fetch fee structures separately
          const feeStructureIds = [...new Set(data.map((sf: any) => sf.fee_structure_id).filter(Boolean))]
          let feeStructuresData: any[] = []
          if (feeStructureIds.length > 0) {
            const { data: feeStructures, error: feeStructuresError } = await supabase
              .from('fee_structures')
              .select('id, name, academic_year, term, due_date')
              .in('id', feeStructureIds)
            
            if (feeStructuresError) {
              logApiError('Failed to fetch fee structures for fee assignments', feeStructuresError, {
                feeStructureIds: feeStructureIds.length
              })
            } else {
              feeStructuresData = feeStructures || []
            }
          }

          // Merge the data
          data = data.map((sf: any) => {
            const student = studentsData.find((s: any) => s.id === sf.student_id)
            const feeStructure = feeStructuresData.find((fs: any) => fs.id === sf.fee_structure_id)
            return {
              ...sf,
              students: student ? {
                first_name: student.first_name,
                last_name: student.last_name,
                student_id: student.student_id,
                classes: null // Would need separate query to get class info
              } : null,
              fee_structures: feeStructure ? {
                name: feeStructure.name,
                academic_year: feeStructure.academic_year,
                term: feeStructure.term,
                due_date: feeStructure.due_date
              } : null
            }
          })
        } catch (mergeError) {
          logApiError('Error merging related data', mergeError, {
            dataCount: data.length
          })
          // Continue with data even if merge fails
        }
      }
    }

    if (error) {
      return createErrorResponse(
        error,
        500,
        { path: requestPath, includeDetails: true }
      )
    }

    // Transform data
    let transformedData: any[] = []
    try {
      transformedData = (data || []).map(studentFee => ({
        id: studentFee.id,
        studentId: studentFee.student_id,
      studentName: `${studentFee.students?.first_name || ''} ${studentFee.students?.last_name || ''}`.trim(),
      studentNumber: studentFee.students?.student_id,
      className: studentFee.students?.classes?.name,
      subsystem: studentFee.students?.classes?.subsystem,
      branch: null, // Branch column doesn't exist in classes table
        feeStructureId: studentFee.fee_structure_id,
        feeStructureName: studentFee.fee_structures?.name,
        academicYear: studentFee.academic_year || studentFee.fee_structures?.academic_year,
        term: studentFee.term || studentFee.fee_structures?.term,
        dueDate: studentFee.due_date || studentFee.fee_structures?.due_date,
        totalAmount: parseFloat(studentFee.total_amount || 0),
        paidAmount: parseFloat(studentFee.amount_paid || 0),
        balanceAmount: parseFloat(studentFee.balance_amount || 0),
        status: studentFee.status,
        lastPaymentDate: null, // This column doesn't exist in student_fee_assignments
        notes: null, // This column doesn't exist in student_fee_assignments
        createdAt: studentFee.created_at,
        updatedAt: studentFee.updated_at
      }))
    } catch (transformError) {
      logApiError('Error transforming student fee data', transformError, {
        dataCount: data?.length || 0
      })
      return createErrorResponse(
        transformError,
        500,
        { path: requestPath, includeDetails: true }
      )
    }

    return createSuccessResponse(transformedData, 200)
  } catch (error) {
    logApiError('Unexpected error in student fees GET', error, {
      requestPath,
      url: requestUrl
    })
    return createErrorResponse(
      error,
      500,
      { path: requestPath, includeDetails: true }
    )
  }
}

export async function POST(request: NextRequest) {
  const requestUrl = request.url
  const requestPath = new URL(requestUrl).pathname
  
  try {
    const supabase = await createClient()
    
    // Validate Supabase client
    if (!supabase) {
      logApiError('POST /api/bursar/student-fees', new Error('Supabase client not initialized'), { requestPath })
      return createErrorResponse(
        new Error('Database connection failed'),
        500,
        { path: requestPath, includeDetails: false }
      )
    }
    
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      logApiError('Failed to parse request body', parseError, { requestPath })
      return createErrorResponse(
        new Error('Invalid request body'),
        400,
        { path: requestPath, includeDetails: false }
      )
    }

    const {
      studentId,
      feeStructureId
    } = body

    // Validate required fields
    if (!studentId || !feeStructureId) {
      return createErrorResponse(
        new Error('Missing required fields: studentId and feeStructureId are required'),
        400,
        { path: requestPath, includeDetails: false }
      )
    }

    // Check if student fee assignment already exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('student_fee_assignments')
      .select('id')
      .eq('student_id', studentId)
      .eq('fee_structure_id', feeStructureId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected
      return createErrorResponse(
        checkError,
        500,
        { path: requestPath, includeDetails: true }
      )
    }

    if (existingAssignment) {
      return createErrorResponse(
        new Error('Student fee assignment already exists'),
        409,
        { path: requestPath, includeDetails: false }
      )
    }

    // Get fee structure details
    const { data: feeStructure, error: feeError } = await supabase
      .from('fee_structures')
      .select(`
        *,
        fee_structure_items (amount)
      `)
      .eq('id', feeStructureId)
      .single()

    if (feeError) {
      return createErrorResponse(
        feeError,
        feeError.code === 'PGRST116' ? 404 : 500,
        { path: requestPath, includeDetails: true }
      )
    }

    if (!feeStructure) {
      return createErrorResponse(
        new Error('Fee structure not found'),
        404,
        { path: requestPath, includeDetails: false }
      )
    }

    // Calculate total amount
    const totalAmount = feeStructure.fee_structure_items?.reduce(
      (sum: number, item: any) => sum + parseFloat(item.amount || 0),
      0
    ) || 0

    // Validate required fields from fee structure
    if (!feeStructure.academic_year || !feeStructure.term || !feeStructure.due_date) {
      logApiError('Fee structure missing required fields', null, {
        feeStructureId,
        hasAcademicYear: !!feeStructure.academic_year,
        hasTerm: !!feeStructure.term,
        hasDueDate: !!feeStructure.due_date
      })
      return createErrorResponse(
        new Error('Fee structure is missing required fields (academic_year, term, or due_date)'),
        400,
        { path: requestPath, includeDetails: false }
      )
    }

    // Validate that fee structure has a class_id assigned
    if (!feeStructure.class_id) {
      logApiError('Fee structure missing class_id', null, {
        feeStructureId,
        feeStructureName: feeStructure.name
      })
      return createErrorResponse(
        new Error('Fee structure is not assigned to any class. Please assign the fee structure to a class before assigning it to students.'),
        400,
        { path: requestPath, includeDetails: false }
      )
    }

    // Get student's class ID
    const studentClassId = await getStudentClassId(supabase, studentId)

    if (!studentClassId) {
      logApiError('Student has no class assigned', null, {
        studentId,
        feeStructureId
      })
      return createErrorResponse(
        new Error('Student is not assigned to any class. Please assign the student to a class before assigning fees.'),
        400,
        { path: requestPath, includeDetails: false }
      )
    }

    // Validate that fee structure's class_id matches student's class
    if (feeStructure.class_id !== studentClassId) {
      // Get class names for better error message
      let studentClassName = 'unknown class'
      let feeStructureClassName = 'unknown class'

      try {
        const { data: studentClass } = await supabase
          .from('classes')
          .select('name')
          .eq('id', studentClassId)
          .maybeSingle()
        if (studentClass?.name) {
          studentClassName = studentClass.name
        }

        const { data: feeStructureClass } = await supabase
          .from('classes')
          .select('name')
          .eq('id', feeStructure.class_id)
          .maybeSingle()
        if (feeStructureClass?.name) {
          feeStructureClassName = feeStructureClass.name
        }
      } catch (_e) {
        // Ignore errors getting class names, use default values
      }

      logApiError('Fee structure class mismatch', null, {
        studentId,
        studentClassId,
        feeStructureId,
        feeStructureClassId: feeStructure.class_id,
        studentClassName,
        feeStructureClassName
      })
      return createErrorResponse(
        new Error(`Fee structure is assigned to "${feeStructureClassName}" but student is in "${studentClassName}". Fees can only be assigned from fee structures that match the student's class.`),
        400,
        { path: requestPath, includeDetails: false }
      )
    }

    // Create student fee assignment
    const { data: studentFee, error: createError } = await supabase
      .from('student_fee_assignments')
      .insert({
        student_id: studentId,
        fee_structure_id: feeStructureId,
        total_amount: totalAmount,
        amount_paid: 0,
        balance_amount: totalAmount,
        status: 'pending',
        due_date: feeStructure.due_date,
        academic_year: feeStructure.academic_year,
        term: feeStructure.term
      })
      .select()
      .single()

    if (createError) {
      return createErrorResponse(
        createError,
        500,
        { path: requestPath, includeDetails: true }
      )
    }

    if (!studentFee) {
      return createErrorResponse(
        new Error('Failed to create student fee assignment - no data returned'),
        500,
        { path: requestPath, includeDetails: false }
      )
    }

    return createSuccessResponse(
      { 
        studentFeeId: studentFee.id,
        message: 'Student fee assignment created successfully' 
      },
      201
    )
  } catch (error) {
    logApiError('Unexpected error in student fees POST', error, {
      requestPath,
      url: requestUrl
    })
    return createErrorResponse(
      error,
      500,
      { path: requestPath, includeDetails: true }
    )
  }
}

