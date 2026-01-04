import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReportCardData } from '@/components/admin/reports/report-card-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const { searchParams } = new URL(request.url)
    const term = searchParams.get('term') || 'annual'

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing studentId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get student's class - handle both UUID and class name
    const studentClassValue = student.class
    if (!studentClassValue) {
      return NextResponse.json(
        { success: false, error: 'Student is not assigned to a class' },
        { status: 400 }
      )
    }

    // Check if student.class is a UUID or a class name
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentClassValue)
    let classId: string
    
    if (isUUID) {
      // It's already a UUID, use it directly
      classId = studentClassValue
    } else {
      // It's a class name, look up the class ID
      // Try multiple approaches to find the class: exact match on name, class_name, or case-insensitive match
      let classByName = null
      let classLookupError = null
      
      // First try: exact match on class_name (preferred field)
      const { data: classByName1, error: error1 } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .eq('class_name', studentClassValue)
        .maybeSingle()
      
      if (classByName1) {
        classByName = classByName1
      } else {
        // Second try: exact match on name field (legacy)
        const { data: classByName2, error: error2 } = await supabase
          .from('classes')
          .select('id, name, class_name')
          .eq('name', studentClassValue)
          .maybeSingle()
        
        if (classByName2) {
          classByName = classByName2
        } else {
          // Third try: case-insensitive match on class_name
          const { data: allClasses } = await supabase
            .from('classes')
            .select('id, name, class_name')
          
          if (allClasses) {
            const normalizedInput = studentClassValue.trim().toLowerCase()
            classByName = allClasses.find(cls => {
              const className = (cls.class_name || cls.name || '').trim().toLowerCase()
              return className === normalizedInput
            }) || null
          }
          
          if (!classByName) {
            classLookupError = error2 || error1
          }
        }
      }
      
      if (classLookupError || !classByName) {
        return NextResponse.json(
          { success: false, error: `Class "${studentClassValue}" not found` },
          { status: 404 }
        )
      }
      
      classId = classByName.id
    }

    // Fetch class details
    const { data: _classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()

    if (classError) {
      // eslint-disable-next-line no-console
      console.warn('Class not found', classError)
    }

    // Use the existing student-report endpoint logic by calling it
    // Convert term to academicTermId format
    let academicTermId = term
    if (term === '1') academicTermId = 'first'
    else if (term === '2') academicTermId = 'second'
    else if (term === '3') academicTermId = 'third'
    else if (term === 'annual') academicTermId = 'annual'
    // else: keep original term value or return 400 for invalid term
    // Call the existing endpoint internally
    const baseUrl = request.nextUrl.origin
    const reportUrl = `${baseUrl}/api/admin/reports/student-report?studentId=${studentId}&classId=${classId}&academicTermId=${academicTermId}`
    
    try {
      const controller = new AbortController()
      // Increase timeout to 120 seconds for large classes with complex ranking calculations
      const timeoutId = setTimeout(() => controller.abort(), 120000)
      
      const reportResponse = await fetch(reportUrl, {
        headers: {
          // Forward cookies/auth from original request if needed
          cookie: request.headers.get('cookie') || '',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const reportResult = await reportResponse.json()

      if (!reportResponse.ok || reportResult.message) {
        return NextResponse.json(
          { 
            success: false, 
            error: reportResult.message || 'Failed to generate report card data' 
          },
          { status: reportResponse.status || 500 }
        )
      }

      // Transform PisonReportCardData to ReportCardData format
      if (!reportResult.student || !reportResult.subjects || !reportResult.totals) {
        return NextResponse.json(
          { success: false, error: 'Invalid report data structure' },
          { status: 500 }
        )
      }

      // Flatten all subject sections into a single array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allSubjects: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.values(reportResult.subjects).forEach((section: any) => {
        if (section.items && Array.isArray(section.items)) {
          allSubjects.push(...section.items);
        }
      });

      const transformedData: ReportCardData = {
        student: {
          id: reportResult.student.id,
          studentId: reportResult.student.studentId,
          name: reportResult.student.name,
          firstName: reportResult.student.firstName,
          lastName: reportResult.student.lastName,
          sex: reportResult.student.sex,
          dob: reportResult.student.dob,
          pob: reportResult.student.pob || '',
          class: reportResult.student.class,
          className: reportResult.student.className,
          classMaster: reportResult.student.classMaster,
          enrollment: reportResult.student.enrollment,
          photoUrl: reportResult.student.photoUrl,
          speciality: reportResult.student.speciality
        },
        academic: {
          year: reportResult.academic.year,
          term: reportResult.academic.term,
          orderNo: reportResult.academic.orderNo
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subjects: allSubjects.map((item: any) => {
          // Ensure category is valid
          const validCategories = ['languages', 'related_trade_subjects', 'trade_subjects', 'others'];
          const itemCategory = item.category || 'others';
          const category = validCategories.includes(itemCategory) ? itemCategory : 'others';
          
          return {
            subjectName: item.name,
            subjectId: item.subjectId, // Include subjectId for editing functionality
            coefficient: item.coef,
            // Include individual sequence marks
            seq1: typeof item.seq1 === 'number' ? item.seq1 : undefined,
            seq2: typeof item.seq2 === 'number' ? item.seq2 : undefined,
            seq3: typeof item.seq3 === 'number' ? item.seq3 : undefined,
            seq4: typeof item.seq4 === 'number' ? item.seq4 : undefined,
            seq5: typeof item.seq5 === 'number' ? item.seq5 : undefined,
            seq6: typeof item.seq6 === 'number' ? item.seq6 : undefined,
            // Include sequences object for compatibility
            sequences: {
              seq1: typeof item.seq1 === 'number' ? item.seq1 : undefined,
              seq2: typeof item.seq2 === 'number' ? item.seq2 : undefined,
              seq3: typeof item.seq3 === 'number' ? item.seq3 : undefined,
              seq4: typeof item.seq4 === 'number' ? item.seq4 : undefined,
              seq5: typeof item.seq5 === 'number' ? item.seq5 : undefined,
              seq6: typeof item.seq6 === 'number' ? item.seq6 : undefined,
            },
            termAverage: typeof item.eval === 'number' ? item.eval : undefined,
            annualAverage: typeof item.eval === 'number' ? item.eval : undefined,
            grade: item.grade,
            rank: typeof item.rank === 'number' ? item.rank : undefined,
            remarks: item.remark,
            category: category
          };
        }),
        totals: {
          coefficient: reportResult.totals.coef,
          totalScore: reportResult.totals.score,
          average: reportResult.totals.average || 0
        },
        history: reportResult.history,
        stats: reportResult.stats,
        discipline: {
          absences: 0,
          suspensions: 0,
          warnings: 0
        },
        watermarkUrl: reportResult.watermarkUrl
      }

      return NextResponse.json({
        success: true,
        data: transformedData
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (fetchError: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: fetchError?.message || 'Failed to generate report card data' 
        },
        { status: 500 }
      )
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Report card generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to generate report card data' 
      },
      { status: 500 }
    )
  }
}
