import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  SubjectBranchesResponse,
  SubjectBranchWithDetails 
} from '@/lib/subject-branches-types'

// GET /api/subject-branches/ultra-fast - Ultra-fast endpoint using pagination function
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
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)

    // Use the simple pagination function
    const { data: results, error } = await supabase.rpc('get_subject_branches_paginated', {
      page_number: page,
      page_size: pageSize
    })

    if (error) {
      console.error('Error calling pagination function:', error)
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

    // Transform the results
    const branches: SubjectBranchWithDetails[] = (results || []).map((row: any) => ({
      id: row.branch_id,
      branch_id: row.branch_id,
      subject_id: row.subject_id,
      branch_name: row.branch_name,
      branch_code: row.branch_code,
      description: row.description,
      weight_percentage: row.weight_percentage,
      is_optional: row.is_optional,
      academic_year: row.academic_year,
      term: row.term,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      subject: {
        id: row.subject_id,
        subject_name: row.subject_name,
        subject_code: row.subject_code,
        subsystem: row.subsystem,
      },
      teachers: [], // We'll get this separately if needed
      enrolled_students_count: row.student_count || 0,
    }))

    const totalCount = results && results.length > 0 ? results[0].total_count : 0
    const hasMore = page * pageSize < totalCount

    return NextResponse.json({
      success: true,
      branches,
      total: totalCount,
      page,
      pageSize,
      hasMore
    } as SubjectBranchesResponse)

  } catch (error) {
    console.error('Error in ultra-fast subject branches API:', error)
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
