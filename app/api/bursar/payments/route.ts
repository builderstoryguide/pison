import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('payments')
      .select(`
        *,
        students (first_name, last_name, student_id),
        student_fees (fee_structures (name)),
        payment_methods (name, code),
        users!payments_collected_by_fkey (first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    if (term) {
      query = query.eq('term', term)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (startDate) {
      query = query.gte('payment_date', startDate)
    }
    if (endDate) {
      query = query.lte('payment_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    // Transform data
    const transformedData = data?.map(payment => ({
      id: payment.id,
      studentId: payment.student_id,
      studentName: `${payment.students?.first_name || ''} ${payment.students?.last_name || ''}`.trim(),
      studentNumber: payment.students?.student_id,
      studentFeeId: payment.student_fee_id,
      feeStructureName: payment.student_fees?.fee_structures?.name,
      receiptNumber: payment.receipt_number,
      amount: parseFloat(payment.amount || 0),
      paymentMethodId: payment.payment_method_id,
      paymentMethodName: payment.payment_methods?.name,
      paymentMethodCode: payment.payment_methods?.code,
      paymentDate: payment.payment_date,
      academicYear: payment.academic_year,
      term: payment.term,
      description: payment.description,
      referenceNumber: payment.reference_number,
      collectedBy: payment.collected_by,
      collectorName: `${payment.users?.first_name || ''} ${payment.users?.last_name || ''}`.trim(),
      status: payment.status,
      notes: payment.notes,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in payments GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      studentId,
      studentFeeId,
      amount,
      paymentMethodId,
      paymentDate,
      academicYear,
      term,
      description,
      referenceNumber,
      notes
    } = body

    // Validate required fields
    if (!studentId || !studentFeeId || !amount || !paymentMethodId || !paymentDate || !academicYear || !term) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than zero' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Generate receipt number
    const receiptNumber = `RCP${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        student_fee_id: studentFeeId,
        receipt_number: receiptNumber,
        amount: amount,
        payment_method_id: paymentMethodId,
        payment_date: paymentDate,
        academic_year: academicYear,
        term: term,
        description: description,
        reference_number: referenceNumber,
        collected_by: user.id,
        status: 'completed',
        notes: notes
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      )
    }

    // Update student fee record
    const { data: studentFee, error: feeError } = await supabase
      .from('student_fees')
      .select('paid_amount, total_amount, balance_amount')
      .eq('id', studentFeeId)
      .single()

    if (feeError) {
      console.error('Error fetching student fee:', feeError)
      return NextResponse.json(
        { error: 'Failed to fetch student fee record' },
        { status: 500 }
      )
    }

    const newPaidAmount = parseFloat(studentFee.paid_amount || 0) + amount
    const newBalanceAmount = parseFloat(studentFee.total_amount || 0) - newPaidAmount

    // Determine new status
    let newStatus = 'pending'
    if (newPaidAmount >= parseFloat(studentFee.total_amount || 0)) {
      newStatus = 'paid'
    } else if (newPaidAmount > 0) {
      newStatus = 'partial'
    }

    // Update student fee
    const { error: updateFeeError } = await supabase
      .from('student_fees')
      .update({
        paid_amount: newPaidAmount,
        balance_amount: newBalanceAmount,
        status: newStatus,
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', studentFeeId)

    if (updateFeeError) {
      console.error('Error updating student fee:', updateFeeError)
      // Rollback payment creation
      await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id)
      
      return NextResponse.json(
        { error: 'Failed to update student fee record' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        paymentId: payment.id,
        receiptNumber: payment.receipt_number,
        message: 'Payment recorded successfully' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in payments POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

