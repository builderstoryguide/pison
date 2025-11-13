import { SupabaseClient } from '@supabase/supabase-js'

export interface DatabaseValidationResult {
  isValid: boolean
  errors: ValidationError[]
  missingTables: string[]
  missingViews: string[]
  missingColumns: string[]
  missingFunctions: string[]
}

export interface ValidationError {
  type: 'table' | 'view' | 'function'
  name: string
  message: string
  setupScript?: string
}

const MIGRATION_SCRIPTS = {
  'users': '2025-11-04_001_core_users.sql',
  'user_profiles': '2025-11-04_001_core_users.sql',
  'user_activity_logs': '2025-11-04_001_core_users.sql',
  'user_details': '2025-11-04_001_core_users.sql',
  'students': '2025-11-04_002_academics_people.sql',
  'teachers': '2025-11-04_002_academics_people.sql',
  'parents': '2025-11-04_002_academics_people.sql',
  'classes': '2025-11-04_003_classes_subjects.sql',
  'subjects': '2025-11-04_003_classes_subjects.sql',
  'teacher_subjects': '2025-11-04_003_classes_subjects.sql',
  'assessments': '2025-11-04_004_assessments_grades.sql',
  'grades': '2025-11-04_004_assessments_grades.sql',
  'timetable_classes': '2025-11-04_005_timetable.sql',
  'app_configuration': '2025-11-04_006_app_configuration.sql',
  'examinations': '2025-11-04_010_examinations.sql',
  'exam_results': '2025-11-04_010_examinations.sql',
  'sales': '2025-11-04_028_create_sales_table.sql',
}

const SETUP_INSTRUCTIONS = `Run the database migration scripts in order in your Supabase SQL Editor:
1. 2025-11-04_001_core_users.sql
2. 2025-11-04_002_academics_people.sql
3. 2025-11-04_003_classes_subjects.sql
4. 2025-11-04_004_assessments_grades.sql
5. 2025-11-04_005_timetable.sql
6. 2025-11-04_006_app_configuration.sql
7. 2025-11-04_007_shared_helpers.sql
8. 2025-11-04_008_seed_admin_user.sql
9. 2025-11-04_009_fk_classes_teacher.sql
10. 2025-11-04_010_examinations.sql
11. 2025-11-04_019_fix_activity_logs_schema.sql

See scripts/README.md for detailed instructions.`

/**
 * Check if a table exists in the database
 */
export async function checkTableExists(
  supabase: SupabaseClient,
  tableName: string
): Promise<{ exists: boolean; error?: ValidationError }> {
  try {
    // Try to select from the table with a limit of 0 to check existence
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)

    if (error) {
      // Check if it's a "relation does not exist" error
      // PGRST205: Could not find the table in the schema cache
      // PGRST116: relation does not exist
      if (
        error.code === 'PGRST116' ||
        error.code === 'PGRST205' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('no such table') ||
        error.message?.includes('Could not find the table')
      ) {
        const setupScript = MIGRATION_SCRIPTS[tableName as keyof typeof MIGRATION_SCRIPTS]
        return {
          exists: false,
          error: {
            type: 'table',
            name: tableName,
            message: `Table "${tableName}" does not exist. Run migration script: ${setupScript || 'See scripts/README.md'}`,
            setupScript: setupScript,
          },
        }
      }
      // Other errors might indicate table exists but there's a permission issue
      // For now, we'll assume it exists if it's not a "does not exist" error
      return { exists: true }
    }

    return { exists: true }
  } catch (err) {
    // Network or other errors - assume table might exist but we can't verify
    return {
      exists: false,
      error: {
        type: 'table',
        name: tableName,
        message: `Unable to verify if table "${tableName}" exists: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
    }
  }
}

/**
 * Check if a view exists in the database
 */
export async function checkViewExists(
  supabase: SupabaseClient,
  viewName: string
): Promise<{ exists: boolean; error?: ValidationError }> {
  try {
    // Try to select from the view with a limit of 0 to check existence
    const { error } = await supabase
      .from(viewName)
      .select('*')
      .limit(0)

    if (error) {
      // Check if it's a "relation does not exist" error
      // PGRST205: Could not find the table in the schema cache
      // PGRST116: relation does not exist
      if (
        error.code === 'PGRST116' ||
        error.code === 'PGRST205' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('no such table') ||
        error.message?.includes('Could not find the table')
      ) {
        const setupScript = MIGRATION_SCRIPTS[viewName as keyof typeof MIGRATION_SCRIPTS]
        return {
          exists: false,
          error: {
            type: 'view',
            name: viewName,
            message: `View "${viewName}" does not exist. Run migration script: ${setupScript || 'See scripts/README.md'}`,
            setupScript: setupScript,
          },
        }
      }
      // Other errors might indicate view exists but there's a permission issue
      return { exists: true }
    }

    return { exists: true }
  } catch (err) {
    return {
      exists: false,
      error: {
        type: 'view',
        name: viewName,
        message: `Unable to verify if view "${viewName}" exists: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
    }
  }
}

/**
 * Check if a column exists in a table
 */
export async function checkColumnExists(
  supabase: SupabaseClient,
  tableName: string,
  columnName: string
): Promise<{ exists: boolean; error?: ValidationError }> {
  try {
    // Try to select the specific column with a limit of 0
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(0)

    if (error) {
      // Check if it's a "column does not exist" error
      if (
        error.code === '42703' ||
        error.message?.includes('column') && error.message?.includes('does not exist') ||
        error.message?.includes('no such column')
      ) {
        return {
          exists: false,
          error: {
            type: 'table',
            name: `${tableName}.${columnName}`,
            message: `Column "${columnName}" does not exist in table "${tableName}". Run migration script: 2025-11-04_019_fix_activity_logs_schema.sql`,
            setupScript: '2025-11-04_019_fix_activity_logs_schema.sql',
          },
        }
      }
      // Other errors might indicate column exists but there's a permission issue
      return { exists: true }
    }

    return { exists: true }
  } catch (err) {
    return {
      exists: false,
      error: {
        type: 'table',
        name: `${tableName}.${columnName}`,
        message: `Unable to verify if column "${columnName}" exists in table "${tableName}": ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
    }
  }
}

/**
 * Check if a database function exists
 */
export async function checkFunctionExists(
  supabase: SupabaseClient,
  functionName: string,
  expectedParams?: string[]
): Promise<{ exists: boolean; error?: ValidationError }> {
  try {
    // Try to call the function with minimal parameters
    // For get_recent_activity_logs, try with default params
    if (functionName === 'get_recent_activity_logs') {
      const { error } = await supabase.rpc(functionName, {
        p_limit: 1,
        p_offset: 0
      })
      
      if (error) {
        // Check if it's a "function does not exist" error
        if (
          error.code === 'PGRST202' ||
          error.message?.includes('function') && error.message?.includes('does not exist') ||
          error.message?.includes('Could not find the function')
        ) {
          return {
            exists: false,
            error: {
              type: 'function',
              name: functionName,
              message: `Function "${functionName}" does not exist. Run migration script: 2025-11-04_019_fix_activity_logs_schema.sql`,
              setupScript: '2025-11-04_019_fix_activity_logs_schema.sql',
            },
          }
        }
        // Other errors might indicate function exists but there's a parameter/permission issue
        return { exists: true }
      }
      return { exists: true }
    }
    
    // For log_user_activity, we can't easily test without inserting data
    // So we'll check via a different method - try to call with minimal params
    if (functionName === 'log_user_activity') {
      // We can't easily test this without side effects, so we'll assume it exists
      // if the table exists. A better check would query pg_proc, but that's not
      // accessible via Supabase client. For now, we'll rely on runtime errors.
      return { exists: true }
    }

    return { exists: true }
  } catch (err) {
    return {
      exists: false,
      error: {
        type: 'function',
        name: functionName,
        message: `Unable to verify if function "${functionName}" exists: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
    }
  }
}

/**
 * Validate table columns exist
 */
export async function validateTableColumns(
  supabase: SupabaseClient,
  tableName: string,
  requiredColumns: string[]
): Promise<{ isValid: boolean; errors: ValidationError[]; missingColumns: string[] }> {
  const errors: ValidationError[] = []
  const missingColumns: string[] = []

  for (const columnName of requiredColumns) {
    const { exists, error } = await checkColumnExists(supabase, tableName, columnName)
    if (!exists) {
      missingColumns.push(columnName)
      if (error) {
        errors.push(error)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingColumns,
  }
}

/**
 * Validate database functions exist
 */
export async function validateDatabaseFunctions(
  supabase: SupabaseClient,
  requiredFunctions: string[]
): Promise<{ isValid: boolean; errors: ValidationError[]; missingFunctions: string[] }> {
  const errors: ValidationError[] = []
  const missingFunctions: string[] = []

  for (const functionName of requiredFunctions) {
    const { exists, error } = await checkFunctionExists(supabase, functionName)
    if (!exists) {
      missingFunctions.push(functionName)
      if (error) {
        errors.push(error)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingFunctions,
  }
}

/**
 * Validate database setup by checking if required tables and views exist
 */
export async function validateDatabaseSetup(
  supabase: SupabaseClient,
  requiredTables: string[] = [],
  requiredViews: string[] = [],
  requiredColumns: { table: string; columns: string[] }[] = [],
  requiredFunctions: string[] = []
): Promise<DatabaseValidationResult> {
  const errors: ValidationError[] = []
  const missingTables: string[] = []
  const missingViews: string[] = []
  const missingColumns: string[] = []
  const missingFunctions: string[] = []

  // Check required tables
  for (const tableName of requiredTables) {
    const { exists, error } = await checkTableExists(supabase, tableName)
    if (!exists) {
      missingTables.push(tableName)
      if (error) {
        errors.push(error)
      }
    }
  }

  // Check required views
  for (const viewName of requiredViews) {
    const { exists, error } = await checkViewExists(supabase, viewName)
    if (!exists) {
      missingViews.push(viewName)
      if (error) {
        errors.push(error)
      }
    }
  }

  // Check required columns
  for (const { table, columns } of requiredColumns) {
    const columnValidation = await validateTableColumns(supabase, table, columns)
    if (!columnValidation.isValid) {
      missingColumns.push(...columnValidation.missingColumns)
      errors.push(...columnValidation.errors)
    }
  }

  // Check required functions
  if (requiredFunctions.length > 0) {
    const functionValidation = await validateDatabaseFunctions(supabase, requiredFunctions)
    if (!functionValidation.isValid) {
      missingFunctions.push(...functionValidation.missingFunctions)
      errors.push(...functionValidation.errors)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingTables,
    missingViews,
    missingColumns,
    missingFunctions,
  }
}

/**
 * Create a standardized error response for database setup issues
 */
export function createDatabaseSetupErrorResponse(
  validationResult: DatabaseValidationResult,
  specificResource?: string
): {
  error: string
  message: string
  setupRequired: boolean
  setupInstructions: string
  details: string
  missingResources: {
    tables: string[]
    views: string[]
    columns: string[]
    functions: string[]
  }
  missingScripts: string[]
} {
  const resourceName = specificResource || 'database resources'
  const errorMessages = validationResult.errors.map((e) => e.message).join('; ')
  
  // Collect unique migration scripts needed
  const missingScripts = Array.from(new Set(
    validationResult.errors
      .map(e => e.setupScript)
      .filter((script): script is string => !!script)
  ))

  return {
    error: 'Database not set up',
    message: validationResult.errors.length === 1
      ? validationResult.errors[0].message
      : `The following ${resourceName} are missing: ${errorMessages}`,
    setupRequired: true,
    setupInstructions: SETUP_INSTRUCTIONS,
    details: errorMessages,
    missingResources: {
      tables: validationResult.missingTables,
      views: validationResult.missingViews,
      columns: validationResult.missingColumns,
      functions: validationResult.missingFunctions,
    },
    missingScripts,
  }
}

