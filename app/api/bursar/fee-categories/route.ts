import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const isMandatory = searchParams.get('isMandatory')

    let query = supabase
      .from('fee_categories')
      .select('*')
      .order('name', { ascending: true })

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    if (isMandatory !== null) {
      query = query.eq('is_mandatory', isMandatory === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching fee categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch fee categories' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in fee categories GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

