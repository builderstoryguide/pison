import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const status = searchParams.get('status')

    let query = supabase
      .from('student_fees')
      .select(`
        *,
        students (first_name, last_name, student_id, classes (name, subsystem, branch)),
        fee_structures (name, academic_year, term, due_date)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    if (classId) {
      query = query.eq('students.classes.id', classId)
    }
    if (academicYear) {
      query = query.eq('fee_structures.academic_year', academicYear)
    }
    if (term) {
      query = query.eq('fee_structures.term', term)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching student fees:', error)
      return NextResponse.json(
        { error: 'Failed to fetch student fees' },
        { status: 500 }
      )
    }

    // Transform data
    const transformedData = data?.map(studentFee => ({
      id: studentFee.id,
      studentId: studentFee.student_id,
      studentName: `${studentFee.students?.first_name || ''} ${studentFee.students?.last_name || ''}`.trim(),
      studentNumber: studentFee.students?.student_id,
      className: studentFee.students?.classes?.name,
      subsystem: studentFee.students?.classes?.subsystem,
      branch: studentFee.students?.classes?.branch,
      feeStructureId: studentFee.fee_structure_id,
      feeStructureName: studentFee.fee_structures?.name,
      academicYear: studentFee.fee_structures?.academic_year,
      term: studentFee.fee_structures?.term,
      dueDate: studentFee.fee_structures?.due_date,
      totalAmount: parseFloat(studentFee.total_amount || 0),
      paidAmount: parseFloat(studentFee.paid_amount || 0),
      balanceAmount: parseFloat(studentFee.balance_amount || 0),
      status: studentFee.status,
      lastPaymentDate: studentFee.last_payment_date,
      notes: studentFee.notes,
      createdAt: studentFee.created_at,
      updatedAt: studentFee.updated_at
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in student fees GET:', error)
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
      feeStructureId,
      notes
    } = body

    // Validate required fields
    if (!studentId || !feeStructureId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if student fee assignment already exists
    const { data: existingAssignment } = await supabase
      .from('student_fees')
      .select('id')
      .eq('student_id', studentId)
      .eq('fee_structure_id', feeStructureId)
      .single()

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Student fee assignment already exists' },
        { status: 409 }
      )
    }

    // Get fee structure details
    const { data: feeStructure, error: feeError } = await supabase
      .from('fee_structures')
      .select(`
        *,
        fee_structure_items (amount)
      `)
      .eq('id', feeStructureId)
      .single()

    if (feeError) {
      console.error('Error fetching fee structure:', feeError)
      return NextResponse.json(
        { error: 'Fee structure not found' },
        { status: 404 }
      )
    }

    // Calculate total amount
    const totalAmount = feeStructure.fee_structure_items?.reduce(
      (sum: number, item: any) => sum + parseFloat(item.amount || 0),
      0
    ) || 0

    // Create student fee assignment
    const { data: studentFee, error: createError } = await supabase
      .from('student_fees')
      .insert({
        student_id: studentId,
        fee_structure_id: feeStructureId,
        total_amount: totalAmount,
        paid_amount: 0,
        balance_amount: totalAmount,
        status: 'pending',
        due_date: feeStructure.due_date,
        notes: notes
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating student fee assignment:', createError)
      return NextResponse.json(
        { error: 'Failed to create student fee assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        studentFeeId: studentFee.id,
        message: 'Student fee assignment created successfully' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in student fees POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

