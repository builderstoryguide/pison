import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReportCardData } from '@/components/admin/reports/report-card-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:7',message:'API GET /api/report-cards entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  
  try {
    const { studentId } = await params
    const { searchParams } = new URL(request.url)
    const term = searchParams.get('term') || 'annual'
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:14',message:'Request parameters',data:{studentId,term},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (!studentId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:19',message:'Missing studentId',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { success: false, error: 'Missing studentId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch student details
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:30',message:'Fetching student',data:{studentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:38',message:'Student fetched from DB',data:{studentId,found:!!student,studentDbId:student?.id,studentDbIdField:student?.student_id,studentFirstName:student?.first_name,studentLastName:student?.last_name,studentClass:student?.class,error:studentError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    if (studentError || !student) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:44',message:'Student not found',data:{error:studentError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get student's class
    const classId = student.class
    if (!classId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:49',message:'Student has no class',data:{studentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { success: false, error: 'Student is not assigned to a class' },
        { status: 400 }
      )
    }

    // Fetch class details
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:58',message:'Fetching class',data:{classId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()

    if (classError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:67',message:'Class fetch error',data:{error:classError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:80',message:'Calling student-report endpoint',data:{reportUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const reportResponse = await fetch(reportUrl, {
        headers: {
          // Forward cookies/auth from original request if needed
          cookie: request.headers.get('cookie') || '',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const reportResult = await reportResponse.json()      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:87',message:'Report response received',data:{ok:reportResponse.ok,hasData:!!reportResult,hasMessage:!!reportResult.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion

      if (!reportResponse.ok || reportResult.message) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:92',message:'Report generation failed',data:{status:reportResponse.status,message:reportResult.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        return NextResponse.json(
          { 
            success: false, 
            error: reportResult.message || 'Failed to generate report card data' 
          },
          { status: reportResponse.status || 500 }
        )
      }

      // Transform PisonReportCardData to ReportCardData format
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:119',message:'Before transformation',data:{requestedStudentId:studentId,reportResultStudentId:reportResult?.student?.id,reportResultStudentIdField:reportResult?.student?.studentId,reportResultName:reportResult?.student?.name,reportResultClassName:reportResult?.student?.className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      if (!reportResult.student || !reportResult.subjects?.general?.items || !reportResult.totals) {
        return NextResponse.json(
          { success: false, error: 'Invalid report data structure' },
          { status: 500 }
        )
      }

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
        subjects: reportResult.subjects.general?.items?.map((item: any) => {          // Ensure category is valid
          const validCategories = ['languages', 'related_trade_subjects', 'trade_subjects', 'others'];
          const itemCategory = item.category || 'others';
          const category = validCategories.includes(itemCategory) ? itemCategory : 'others';
          
          return {
            subjectName: item.name,
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
        }) || [],
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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:175',message:'Returning transformed data',data:{requestedStudentId:studentId,transformedStudentId:transformedData.student.id,transformedStudentIdField:transformedData.student.studentId,transformedName:transformedData.student.name,transformedClassName:transformedData.student.className,subjectsCount:transformedData.subjects.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion

      return NextResponse.json({
        success: true,
        data: transformedData
      })
    } catch (fetchError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:147',message:'Fetch error',data:{error:fetchError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { 
          success: false, 
          error: fetchError?.message || 'Failed to generate report card data' 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/report-cards/[studentId]/route.ts:156',message:'Top level error',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
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


