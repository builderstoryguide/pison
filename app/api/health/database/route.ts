import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateDatabaseSetup, checkTableExists, checkViewExists } from '@/lib/database-validation'

/**
 * GET /api/health/database
 * 
 * Validates database setup status by checking if required tables and views exist.
 * Returns detailed information about what's missing and what's configured.
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          healthy: false,
          error: 'Server configuration error',
          message: 'Database connection not configured',
          details: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
        },
        { status: 500 }
      )
    }

    const supabase = createServiceClient()

    // Define all required tables and views
    const requiredTables = [
      'users',
      'user_profiles',
      'user_activity_logs',
      'students',
      'teachers',
      'parents',
      'classes',
      'subjects',
      'teacher_subjects',
      'assessments',
      'grades',
      'examinations',
      'exam_results',
      'sales',
    ]

    const requiredViews = [
      'user_details',
    ]

    // Check each table and view individually for detailed reporting
    const tableStatuses: Array<{ name: string; exists: boolean; error?: string }> = []
    const viewStatuses: Array<{ name: string; exists: boolean; error?: string }> = []

    for (const tableName of requiredTables) {
      const { exists, error } = await checkTableExists(supabase, tableName)
      tableStatuses.push({
        name: tableName,
        exists,
        error: error?.message,
      })
    }

    for (const viewName of requiredViews) {
      const { exists, error } = await checkViewExists(supabase, viewName)
      viewStatuses.push({
        name: viewName,
        exists,
        error: error?.message,
      })
    }

    // Overall validation
    const validationResult = await validateDatabaseSetup(supabase, requiredTables, requiredViews)

    // Count what's missing
    const missingTables = tableStatuses.filter(t => !t.exists)
    const missingViews = viewStatuses.filter(v => !v.exists)
    const totalMissing = missingTables.length + missingViews.length

    return NextResponse.json({
      healthy: validationResult.isValid,
      timestamp: new Date().toISOString(),
      summary: {
        totalRequired: requiredTables.length + requiredViews.length,
        totalMissing,
        tablesFound: requiredTables.length - missingTables.length,
        tablesMissing: missingTables.length,
        viewsFound: requiredViews.length - missingViews.length,
        viewsMissing: missingViews.length,
      },
      tables: tableStatuses,
      views: viewStatuses,
      missing: {
        tables: missingTables.map(t => t.name),
        views: missingViews.map(v => v.name),
      },
      setupRequired: !validationResult.isValid,
      setupInstructions: validationResult.isValid
        ? null
        : `Run the database migration scripts in order in your Supabase SQL Editor:
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
11. 2025-11-04_028_create_sales_table.sql

See scripts/README.md for detailed instructions.`,
      missingScripts: validationResult.isValid
        ? []
        : Array.from(new Set(
            validationResult.errors
              .map(e => e.setupScript)
              .filter((script): script is string => !!script)
          )),
    })
  } catch (error) {
    console.error('Error in database health check:', error)
    return NextResponse.json(
      {
        healthy: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred during health check',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

