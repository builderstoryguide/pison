import { createClient } from '@/lib/supabase/server'
import type { ReportCardData } from '@/components/admin/reports/report-card-types'

export type LoadReportCardResult =
  | { ok: true; data: ReportCardData }
  | { ok: false; status: number; error: string }

/**
 * Shared loader for GET /api/report-cards/[studentId] and server-rendered /pdf/report-card.
 * Avoids duplicating the transform; keep in sync with route error handling.
 */
export async function loadReportCardData(options: {
  studentId: string
  term: string
  /** Origin for internal student-report fetch (e.g. http://127.0.0.1:3000) */
  requestOrigin: string
  cookieHeader: string
}): Promise<LoadReportCardResult> {
  const { studentId, term, requestOrigin, cookieHeader } = options

  const supabase = await createClient()

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .maybeSingle()

  if (studentError || !student) {
    return { ok: false, status: 404, error: 'Student not found' }
  }

  const studentClassValue = student.class
  if (!studentClassValue) {
    return { ok: false, status: 400, error: 'Student is not assigned to a class' }
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentClassValue)
  let classId: string

  if (isUUID) {
    classId = studentClassValue
  } else {
    let classByName = null

    const { data: classByName1 } = await supabase
      .from('classes')
      .select('id, name, class_name')
      .eq('class_name', studentClassValue)
      .maybeSingle()

    if (classByName1) {
      classByName = classByName1
    } else {
      const { data: classByName2 } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .eq('name', studentClassValue)
        .maybeSingle()

      if (classByName2) {
        classByName = classByName2
      } else {
        const { data: allClasses } = await supabase.from('classes').select('id, name, class_name')

        if (allClasses) {
          const normalizedInput = studentClassValue.trim().toLowerCase()
          classByName =
            allClasses.find((cls) => {
              const className = (cls.class_name || cls.name || '').trim().toLowerCase()
              return className === normalizedInput
            }) || null
        }
      }
    }

    if (!classByName) {
      return {
        ok: false,
        status: 404,
        error: `Class "${studentClassValue}" not found`,
      }
    }

    classId = classByName.id
  }

  const { error: classError } = await supabase.from('classes').select('*').eq('id', classId).single()

  if (classError) {
    // eslint-disable-next-line no-console
    console.warn('[loadReportCardData] Class not found', classError)
  }

  let academicTermId = term
  if (term === '1') academicTermId = 'first'
  else if (term === '2') academicTermId = 'second'
  else if (term === '3') academicTermId = 'third'
  else if (term === 'annual') academicTermId = 'annual'

  const reportUrl = `${requestOrigin}/api/admin/reports/student-report?studentId=${studentId}&classId=${classId}&academicTermId=${academicTermId}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120_000)

    const reportResponse = await fetch(reportUrl, {
      headers: {
        cookie: cookieHeader,
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const reportResult = await reportResponse.json()

    if (!reportResponse.ok || reportResult.message) {
      return {
        ok: false,
        status: reportResponse.status || 500,
        error: reportResult.message || 'Failed to generate report card data',
      }
    }

    if (!reportResult.student || !reportResult.subjects || !reportResult.totals) {
      return { ok: false, status: 500, error: 'Invalid report data structure' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allSubjects: any[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(reportResult.subjects).forEach((section: any) => {
      if (section.items && Array.isArray(section.items)) {
        allSubjects.push(...section.items)
      }
    })

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
        speciality: reportResult.student.speciality,
      },
      academic: {
        year: reportResult.academic.year,
        term: reportResult.academic.term,
        orderNo: reportResult.academic.orderNo,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subjects: allSubjects.map((item: any) => {
        const validCategories = ['languages', 'related_trade_subjects', 'trade_subjects', 'others']
        const itemCategory = item.category || 'others'
        const category = validCategories.includes(itemCategory) ? itemCategory : 'others'

        const rawCode = item.code
        const code =
          typeof rawCode === 'string' && rawCode.trim().length > 0 ? rawCode.trim() : undefined

        return {
          subjectName: item.name,
          subjectId: item.subjectId,
          code,
          coefficient: item.coef,
          plannedCoefficient: typeof item.plannedCoef === 'number' ? item.plannedCoef : undefined,
          seq1: typeof item.seq1 === 'number' ? item.seq1 : undefined,
          seq2: typeof item.seq2 === 'number' ? item.seq2 : undefined,
          seq3: typeof item.seq3 === 'number' ? item.seq3 : undefined,
          seq4: typeof item.seq4 === 'number' ? item.seq4 : undefined,
          seq5: typeof item.seq5 === 'number' ? item.seq5 : undefined,
          seq6: typeof item.seq6 === 'number' ? item.seq6 : undefined,
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
          term1: typeof item.term1 === 'number' ? item.term1 : undefined,
          term2: typeof item.term2 === 'number' ? item.term2 : undefined,
          term3: typeof item.term3 === 'number' ? item.term3 : undefined,
          termAverages: {
            term1: typeof item.term1 === 'number' ? item.term1 : undefined,
            term2: typeof item.term2 === 'number' ? item.term2 : undefined,
            term3: typeof item.term3 === 'number' ? item.term3 : undefined,
          },
          grade: item.grade,
          rank: typeof item.rank === 'number' ? item.rank : undefined,
          remarks: item.remark,
          category,
        }
      }),
      totals: {
        coefficient: reportResult.totals.coef,
        totalScore: reportResult.totals.score,
        average: reportResult.totals.average || 0,
      },
      history: reportResult.history,
      stats: reportResult.stats,
      discipline: {
        absences: 0,
        suspensions: 0,
        warnings: 0,
      },
      watermarkUrl: reportResult.watermarkUrl,
    }

    return { ok: true, data: transformedData }
  } catch (fetchError: unknown) {
    const message =
      fetchError instanceof Error ? fetchError.message : 'Failed to generate report card data'
    return { ok: false, status: 500, error: message }
  }
}
