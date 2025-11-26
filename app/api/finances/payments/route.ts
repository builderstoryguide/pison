import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET - Fetch payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const supabase = createServiceClient()

    let query = supabase
      .from('payments')
      .select(`
        *,
        students (
          first_name,
          last_name,
          student_id
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      // Search by receipt number or student name
      // Note: searching related tables is tricky in simple query, so we might filter client side or use complex query
      // For now, let's search payment fields
      query = query.or(`receipt_number.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Transform data for frontend
    const payments = data?.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paymentMethod: getPaymentMethodFromId(payment.payment_method_id), // Helper needed
      payerName: `${payment.students?.first_name || ''} ${payment.students?.last_name || ''}`.trim() || 'Unknown',
      payerType: 'student', // Defaulting to student for now as most are
      description: payment.description,
      date: payment.payment_date,
      status: payment.status,
      reference: payment.reference_number,
      receiptNumber: payment.receipt_number,
      installment: extractInstallment(payment.description) // Helper to extract from description
    }))

    return NextResponse.json({
      payments,
      total: count,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in GET /api/finances/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      amount,
      paymentMethod,
      installment, // "1st", "2nd", "3rd"
      date,
      reference,
      description
    } = body

    if (!studentId || !amount || !installment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Get Payment Method ID
    // Map frontend values to likely DB codes
    const methodMap: Record<string, string> = {
      'cash': 'CASH',
      'bank_transfer': 'BANK_TRANSFER',
      'mobile_money': 'MOBILE_MONEY',
      'cheque': 'CHEQUE'
    }
    
    const dbMethodCode = methodMap[paymentMethod] || 'CASH'

    const { data: methodData } = await supabase
      .from('payment_methods')
      .select('id')
      .or(`code.eq.${dbMethodCode},code.eq.${paymentMethod}`)
      .single()

    const paymentMethodId = methodData?.id

    if (!paymentMethodId) {
       // If we can't find the method, we should probably fail or default. 
       // Let's try to find ANY method to default to, or fail.
       const { data: defaultMethod } = await supabase
         .from('payment_methods')
         .select('id')
         .limit(1)
         .single()
         
       if (!defaultMethod) {
         return NextResponse.json({ error: 'System configuration error: No payment methods defined' }, { status: 500 })
       }
       // Use default if specific one not found (fallback)
       // paymentMethodId = defaultMethod.id 
       // Actually, safer to fail if explicit choice is invalid
       return NextResponse.json({ error: 'Invalid payment method selected' }, { status: 400 })
    }

    // 3. Create Payment
    const fullDescription = `${description} - ${installment} Installment`
    // Generate receipt number: RCP + YYYYMMDD + Random
    const dateObj = new Date()
    const dateStr = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}`
    const receiptNumber = `RCP${dateStr}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        amount: amount,
        payment_method_id: paymentMethodId,
        payment_date: date,
        description: fullDescription,
        reference_number: reference,
        receipt_number: receiptNumber,
        status: 'completed',
        notes: `Installment: ${installment}` 
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment })

  } catch (error) {
    console.error('Error in POST /api/finances/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // For now, we only allow updating basic fields that don't affect accounting
    // Updating amount or student would require complex logic to reverse previous transaction and apply new one
    // So we'll limit updates to metadata for this iteration
    
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        payment_method_id: updates.paymentMethodId, // Need to map this if changed
        description: updates.description,
        reference_number: updates.reference,
        status: updates.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment:', error)
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment })

  } catch (error) {
    console.error('Error in PUT /api/finances/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete payment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Get payment details before deleting to reverse the transaction
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('amount')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching payment for deletion:', fetchError)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // 2. Delete the payment
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting payment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/finances/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helpers
function getPaymentMethodFromId(id: string) {
  // Placeholder - would need real mapping
  return 'cash' 
}

function extractInstallment(description: string) {
  if (description?.includes('1st Installment')) return 'First Installment'
  if (description?.includes('2nd Installment')) return 'Second Installment'
  if (description?.includes('3rd Installment')) return 'Third Installment'
  return ''
}
