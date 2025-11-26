import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET - Fetch expenditures
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const supabase = createServiceClient()

    let query = supabase
      .from('expenditures')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,vendor.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching expenditures:', error)
      return NextResponse.json({ error: 'Failed to fetch expenditures' }, { status: 500 })
    }

    return NextResponse.json({
      expenditures: data,
      total: count,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in GET /api/finances/expenditures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create expenditure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      amount,
      currency,
      payment_method,
      payment_date,
      vendor,
      vendor_contact,
      receipt_number,
      invoice_number,
      academic_year,
      term,
      department,
      budget_category,
      notes
    } = body

    if (!title || !amount || !category || !payment_date || !vendor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: expenditure, error } = await supabase
      .from('expenditures')
      .insert({
        id: crypto.randomUUID(),
        title,
        description,
        category,
        amount,
        currency,
        payment_method,
        payment_date,
        vendor,
        vendor_contact,
        receipt_number,
        invoice_number,
        status: 'pending', // Default status
        academic_year,
        term,
        department,
        budget_category,
        notes,
        created_by: 'admin', // Placeholder, ideally from auth context if passed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating expenditure:', error)
      return NextResponse.json({ error: 'Failed to create expenditure' }, { status: 500 })
    }

    return NextResponse.json({ success: true, expenditure })

  } catch (error) {
    console.error('Error in POST /api/finances/expenditures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper to check if user is admin
async function isAdmin(request: NextRequest, supabase: any) {
  const userId = request.headers.get('X-User-Id')
  if (!userId) return false

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'admin'
}

// PUT - Update expenditure
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Check permissions
    if (!await isAdmin(request, supabase)) {
      return NextResponse.json({ error: 'Unauthorized: Only admins can update expenditures' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Expenditure ID is required' }, { status: 400 })
    }

    const { data: expenditure, error } = await supabase
      .from('expenditures')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating expenditure:', error)
      return NextResponse.json({ error: 'Failed to update expenditure' }, { status: 500 })
    }

    return NextResponse.json({ success: true, expenditure })

  } catch (error) {
    console.error('Error in PUT /api/finances/expenditures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete expenditure
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Check permissions
    if (!await isAdmin(request, supabase)) {
      return NextResponse.json({ error: 'Unauthorized: Only admins can delete expenditures' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Expenditure ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('expenditures')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting expenditure:', error)
      return NextResponse.json({ error: 'Failed to delete expenditure' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/finances/expenditures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
