import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  SubjectBranchesResponse,
  SubjectBranchWithDetails 
} from '@/lib/subject-branches-types'

// GET /api/subject-branches/optimized - Optimized endpoint using materialized view
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          branches: [],
          total: 0
        } as SubjectBranchesResponse,
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          branches: [],
          total: 0
        } as SubjectBranchesResponse,
        { status: 500 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100) // Max 100 items per page
    const offset = (page - 1) * pageSize

    // Build the query using the materialized view with pagination
    let query = supabase
      .from('subject_branch_summary')
      .select('*', { count: 'exact' })
      .order('branch_name')
      .range(offset, offset + pageSize - 1)

    // Apply filters
    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    if (term) {
      query = query.eq('term', term)
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: branches, error, count } = await query

    if (error) {
      console.error('Error fetching subject branches from materialized view:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch subject branches',
          branches: [],
          total: 0
        } as SubjectBranchesResponse,
        { status: 500 }
      )
    }

    // Transform the data to match the expected interface
    const branchesWithDetails: SubjectBranchWithDetails[] = (branches || []).map(branch => ({
      id: branch.id,
      branch_id: branch.branch_id,
      subject_id: branch.subject_id,
      branch_name: branch.branch_name,
      branch_code: branch.branch_code,
      description: branch.description,
      weight_percentage: branch.weight_percentage,
      is_optional: branch.is_optional,
      academic_year: branch.academic_year,
      term: branch.term,
      is_active: branch.is_active,
      created_at: branch.created_at,
      updated_at: branch.updated_at,
      subject: {
        id: branch.subject_id,
        subject_name: branch.subject_name,
        subject_code: branch.subject_code,
        subsystem: branch.subsystem
      },
      teachers: [], // We'll get this separately if needed
      enrolled_students_count: branch.enrolled_students_count || 0
    }))

    const totalCount = count || 0
    const hasMore = offset + pageSize < totalCount

    return NextResponse.json({
      success: true,
      branches: branchesWithDetails,
      total: totalCount,
      page,
      pageSize,
      hasMore
    } as SubjectBranchesResponse)

  } catch (error) {
    console.error('Error in optimized subject branches API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        branches: [],
        total: 0
      } as SubjectBranchesResponse,
      { status: 500 }
    )
  }
}
