export interface TeacherAssignmentData {
  teacherId: string
  classId: string
  subjectId: string
  branchId: string
  academicYear: string
  term: string
  isPrimary?: boolean
}

export interface AssignmentResult {
  success: boolean
  assignment?: any
  error?: string
}

/**
 * Creates a teacher assignment using the API endpoint
 * This is a client-side function that calls the server API
 */
export async function createTeacherAssignment(
  assignmentData: TeacherAssignmentData
): Promise<AssignmentResult> {
  try {
    const { teacherId, classId, subjectId, branchId, academicYear, term, isPrimary = true } = assignmentData

    console.log('🔍 Creating teacher assignment via API:', {
      teacherId,
      classId,
      subjectId,
      branchId,
      academicYear,
      term,
      isPrimary
    })

    // Use the simple assignments API endpoint
    const response = await fetch('/api/teachers/simple-assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teacherId,
        classId,
        subjectId,
        branchId,
        academicYear,
        term,
        isPrimary
      }),
    })

    if (!response.ok) {
      let errorText = 'Unknown error'
      try {
        errorText = await response.text()
      } catch (textError) {
        console.warn('Failed to read response body:', textError)
        errorText = 'Failed to read error details'
      }
      console.error('❌ API call failed:', response.status, response.statusText, errorText)
      return { 
        success: false, 
        error: `API call failed: ${response.status} ${response.statusText} - ${errorText}` 
      }
    }

    const result = await response.json()

    if (!result.success) {
      console.error('❌ Assignment creation failed:', result.error)
      return { success: false, error: result.error }
    }

    console.log('✅ Assignment created successfully via API:', result)

    return {
      success: true,
      assignment: result.assignment
    }

  } catch (error) {
    console.error('❌ Unexpected error in createTeacherAssignment:', error)
    return { 
      success: false, 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Creates multiple teacher assignments in batch
 * Useful when assigning a teacher to multiple classes/subjects during enrollment
 */
export async function createTeacherAssignments(
  assignments: TeacherAssignmentData[]
): Promise<{ success: boolean; results: AssignmentResult[]; errors: string[] }> {
  const results: AssignmentResult[] = []
  const errors: string[] = []

  console.log(`🔄 Creating ${assignments.length} teacher assignments...`)

  for (const assignment of assignments) {
    try {
      const result = await createTeacherAssignment(assignment)
      results.push(result)
      
      if (!result.success) {
        errors.push(`Assignment failed for teacher ${assignment.teacherId}, class ${assignment.classId}: ${result.error}`)
      }
    } catch (error) {
      const errorMessage = `Unexpected error for assignment: ${error instanceof Error ? error.message : 'Unknown error'}`
      results.push({ success: false, error: errorMessage })
      errors.push(errorMessage)
    }
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.length - successCount

  console.log(`✅ Batch assignment creation completed: ${successCount} successful, ${failureCount} failed`)

  return {
    success: failureCount === 0,
    results,
    errors
  }
}

/**
 * Validates that a teacher has proper assignments using the API
 * Used to ensure teachers can see their classes when they log in
 */
export async function validateTeacherAssignments(teacherId: string): Promise<{
  success: boolean
  assignments: any[]
  error?: string
}> {
  try {
    console.log('🔍 Validating teacher assignments via API for teacher:', teacherId)

    const response = await fetch(`/api/teachers/assignments/ultra-fast?teacherId=${teacherId}`)

    if (!response.ok) {
      let errorText = 'Unknown error'
      try {
        errorText = await response.text()
      } catch (textError) {
        console.warn('Failed to read response body:', textError)
        errorText = 'Failed to read error details'
      }
      console.error('❌ Validation API call failed:', response.status, response.statusText, errorText)
      return { 
        success: false, 
        assignments: [], 
        error: `API call failed: ${response.status} ${response.statusText} - ${errorText}` 
      }
    }

    const result = await response.json()

    if (!result.success) {
      console.error('❌ Assignment validation failed:', result.error)
      return { success: false, assignments: [], error: result.error }
    }

    console.log('✅ Assignment validation successful:', result)

    return {
      success: true,
      assignments: result.assignments || []
    }

  } catch (error) {
    console.error('❌ Unexpected error in validateTeacherAssignments:', error)
    return { 
      success: false, 
      assignments: [], 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}
