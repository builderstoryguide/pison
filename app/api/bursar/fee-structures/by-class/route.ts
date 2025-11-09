import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters - all are required
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')

    // Validate all required parameters are present
    if (!classId || !academicYear || !term) {
      return NextResponse.json(
        { error: 'Missing required parameters: classId, academicYear, and term are all required' },
        { status: 400 }
      )
    }

    // Query fee structures with exact match on all three criteria
    const { data, error } = await supabase
      .from('fee_structures')
      .select(`
        *,
        fee_structure_items (
          *,
          fee_categories (name, code, description)
        )
      `)
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (error) {
      // If no rows found, return 404
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No fee structure found for the specified class, academic year, and term' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching fee structure:', error)
      return NextResponse.json(
        { error: 'Failed to fetch fee structure' },
        { status: 500 }
      )
    }

    // Calculate total amount from fee structure items
    const totalAmount = data.fee_structure_items?.reduce(
      (sum: number, item: any) => sum + parseFloat(item.amount || 0),
      0
    ) || 0

    // Transform and return data
    const transformedData = {
      id: data.id,
      name: data.name,
      totalAmount,
      academicYear: data.academic_year,
      term: data.term,
      isActive: data.is_active,
      dueDate: data.due_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in fee structure by-class GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

