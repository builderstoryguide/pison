import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        students (first_name, last_name, student_id),
        student_fees (fee_structures (name)),
        payment_methods (name, code),
        users!payments_collected_by_fkey (first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching payment:', error)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Transform data
    const transformedData = {
      id: data.id,
      studentId: data.student_id,
      studentName: `${data.students?.first_name || ''} ${data.students?.last_name || ''}`.trim(),
      studentNumber: data.students?.student_id,
      studentFeeId: data.student_fee_id,
      feeStructureName: data.student_fees?.fee_structures?.name,
      receiptNumber: data.receipt_number,
      amount: parseFloat(data.amount || 0),
      paymentMethodId: data.payment_method_id,
      paymentMethodName: data.payment_methods?.name,
      paymentMethodCode: data.payment_methods?.code,
      paymentDate: data.payment_date,
      academicYear: data.academic_year,
      term: data.term,
      description: data.description,
      referenceNumber: data.reference_number,
      collectedBy: data.collected_by,
      collectorName: `${data.users?.first_name || ''} ${data.users?.last_name || ''}`.trim(),
      status: data.status,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in payment GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      amount,
      paymentMethodId,
      paymentDate,
      description,
      referenceNumber,
      notes,
      status
    } = body

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than zero' },
        { status: 400 }
      )
    }

    // Get current payment to check if amount is being changed
    const { data: currentPayment, error: fetchError } = await supabase
      .from('payments')
      .select('amount, student_fee_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching current payment:', fetchError)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (amount !== undefined) updateData.amount = amount
    if (paymentMethodId !== undefined) updateData.payment_method_id = paymentMethodId
    if (paymentDate !== undefined) updateData.payment_date = paymentDate
    if (description !== undefined) updateData.description = description
    if (referenceNumber !== undefined) updateData.reference_number = referenceNumber
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      )
    }

    // If amount was changed, update student fee record
    if (amount !== undefined && amount !== currentPayment.amount) {
      const amountDifference = amount - currentPayment.amount

      // Get current student fee
      const { data: studentFee, error: feeError } = await supabase
        .from('student_fees')
        .select('paid_amount, total_amount, balance_amount')
        .eq('id', currentPayment.student_fee_id)
        .single()

      if (feeError) {
        console.error('Error fetching student fee:', feeError)
        return NextResponse.json(
          { error: 'Failed to fetch student fee record' },
          { status: 500 }
        )
      }

      const newPaidAmount = parseFloat(studentFee.paid_amount || 0) + amountDifference
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
        .eq('id', currentPayment.student_fee_id)

      if (updateFeeError) {
        console.error('Error updating student fee:', updateFeeError)
        return NextResponse.json(
          { error: 'Failed to update student fee record' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Payment updated successfully' 
      }
    )
  } catch (error) {
    console.error('Error in payment PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    // Get payment details before deletion
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('amount, student_fee_id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching payment:', fetchError)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if payment can be cancelled (only completed payments can be cancelled)
    if (payment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed payments can be cancelled' },
        { status: 400 }
      )
    }

    // Update payment status to cancelled instead of deleting
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error cancelling payment:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel payment' },
        { status: 500 }
      )
    }

    // Update student fee record to reflect the cancelled payment
    const { data: studentFee, error: feeError } = await supabase
      .from('student_fees')
      .select('paid_amount, total_amount, balance_amount')
      .eq('id', payment.student_fee_id)
      .single()

    if (feeError) {
      console.error('Error fetching student fee:', feeError)
      return NextResponse.json(
        { error: 'Failed to fetch student fee record' },
        { status: 500 }
      )
    }

    const newPaidAmount = parseFloat(studentFee.paid_amount || 0) - payment.amount
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
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.student_fee_id)

    if (updateFeeError) {
      console.error('Error updating student fee:', updateFeeError)
      return NextResponse.json(
        { error: 'Failed to update student fee record' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Payment cancelled successfully' 
      }
    )
  } catch (error) {
    console.error('Error in payment DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

