import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const statusFilter = searchParams.get('status')
    const format = searchParams.get('format') || 'json'

    const { data, error } = await supabase.rpc('generate_outstanding_report', {
      class_id: classId,
      academic_year: academicYear,
      term: term,
      status_filter: statusFilter
    })

    if (error) {
      console.error('Error generating outstanding report:', error)
      return NextResponse.json(
        { error: 'Failed to generate outstanding report' },
        { status: 500 }
      )
    }

    // Transform data for better frontend consumption
    const transformedData = data?.map((row: any) => ({
      studentName: row.student_name,
      studentNumber: row.student_number,
      className: row.class_name,
      feeStructureName: row.fee_structure_name,
      academicYear: row.academic_year,
      term: row.term,
      dueDate: row.due_date,
      totalAmount: parseFloat(row.total_amount || 0),
      paidAmount: parseFloat(row.paid_amount || 0),
      balanceAmount: parseFloat(row.balance_amount || 0),
      paymentStatus: row.payment_status,
      daysOverdue: parseInt(row.days_overdue || 0)
    }))

    // Calculate summary statistics
    const summary = {
      totalStudents: transformedData?.length || 0,
      totalOutstanding: transformedData?.reduce((sum: number, row: any) => sum + row.balanceAmount, 0) || 0,
      overdueStudents: transformedData?.filter((row: any) => row.paymentStatus === 'overdue').length || 0,
      overdueAmount: transformedData?.filter((row: any) => row.paymentStatus === 'overdue')
        .reduce((sum: number, row: any) => sum + row.balanceAmount, 0) || 0,
      averageOutstanding: transformedData?.length > 0 
        ? transformedData.reduce((sum: number, row: any) => sum + row.balanceAmount, 0) / transformedData.length 
        : 0
    }

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = 'Student Name,Student Number,Class,Fee Structure,Academic Year,Term,Due Date,Total Amount,Paid Amount,Balance Amount,Payment Status,Days Overdue\n'
      const csvRows = transformedData?.map((row: any) => 
        `"${row.studentName}","${row.studentNumber}","${row.className}","${row.feeStructureName}","${row.academicYear}","${row.term}","${row.dueDate}",${row.totalAmount},${row.paidAmount},${row.balanceAmount},"${row.paymentStatus}",${row.daysOverdue}`
      ).join('\n') || ''
      
      const csvContent = csvHeaders + csvRows
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="outstanding-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      data: transformedData,
      summary,
      filters: {
        classId,
        academicYear,
        term,
        statusFilter
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in outstanding report GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

