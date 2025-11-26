import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAnyRole } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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
        fee_structures (name),
        payment_methods (name, code),
        users!payments_received_by_fkey (first_name, last_name)
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
      // eslint-disable-next-line no-console
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
      feeStructureName: payment.fee_structures?.name,
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
      collectedBy: payment.received_by,
      collectorName: `${payment.users?.first_name || ''} ${payment.users?.last_name || ''}`.trim(),
      status: payment.status,
      notes: payment.notes,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in payments GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      studentId,
      feeStructureId, // Changed from studentFeeId
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
    if (!studentId || !amount || !paymentMethodId || !paymentDate || !academicYear || !term) {
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

    // Check authentication and require bursar or admin role
    const user = await requireAnyRole(request, ['bursar', 'admin'])

    // Generate receipt number
    const receiptNumber = `RCP${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        fee_structure_id: feeStructureId,
        receipt_number: receiptNumber,
        amount: amount,
        payment_method_id: paymentMethodId,
        payment_date: paymentDate,
        academic_year: academicYear,
        term: term,
        description: description,
        reference_number: referenceNumber,
        received_by: user.id, // Changed from collected_by
        status: 'completed',
        notes: notes
      })
      .select()
      .single()

    if (paymentError) {
      // eslint-disable-next-line no-console
      console.error('Error creating payment:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      )
    }

    // Attempt to update student fee assignment if it exists
    // We search for a matching assignment based on student, year, and term
    // If feeStructureId is provided, we can be more specific
    let feeQuery = supabase
      .from('student_fee_assignments')
      .select('id, paid_amount, total_amount, balance_amount')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('term', term)
    
    if (feeStructureId) {
      feeQuery = feeQuery.eq('fee_structure_id', feeStructureId)
    }

    const { data: studentFees, error: feeError } = await feeQuery

    if (feeError) {
      // eslint-disable-next-line no-console
      console.warn('Error fetching student fee assignment:', feeError)
      // We don't fail the payment if fee assignment update fails, just log it
    } else if (studentFees && studentFees.length > 0) {
      const studentFee = studentFees[0]
      const newPaidAmount = parseFloat(studentFee.paid_amount || 0) + amount
      const newBalanceAmount = parseFloat(studentFee.total_amount || 0) - newPaidAmount

      // Determine new status
      let newStatus = 'pending'
      if (newPaidAmount >= parseFloat(studentFee.total_amount || 0)) {
        newStatus = 'paid'
      } else if (newPaidAmount > 0) {
        newStatus = 'partial'
      }

      // Update student fee assignment
      await supabase
        .from('student_fee_assignments')
        .update({
          paid_amount: newPaidAmount,
          balance_amount: newBalanceAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentFee.id)
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
    // eslint-disable-next-line no-console
    console.error('Error in payments POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

