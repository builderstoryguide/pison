/**
 * Verify report-card grade cases: KEBEH/CAM, Apong/Engineering Drawing, Ekum/Manual Labour.
 * Run: npx tsx scripts/verify-report-card-grade-cases.ts
 */
import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { subjectNamesMatch } from '../lib/report-card-subject-matching'
import {
  getTermAveragesFromSequenceMarks,
  getAnnualAverageFromTermAverages,
  getPartialAnnualAverageFromTermAverages,
} from '../lib/sequence-term-mapping'
import { getAverageFromPopulatedSequenceMarks, resolveYearSummaryFinalMark } from '../lib/report-card-subject-marks'
import { calculateGrade } from '../lib/grading-utils'
import { loadSequenceYearConfig } from '../lib/load-sequence-config-server'

dotenv.config({ path: '.env.local' })

const BASE = process.env.REPORT_API_BASE || 'http://127.0.0.1:3000'

const CASES = [
  { studentSearch: 'KEBEH', classSearch: 'AC 1', subjectPattern: 'Computer Aided Management' },
  { studentSearch: 'Apong Emmanuel', classSearch: 'EPS 1', subjectPattern: 'Engineering Drawing' },
  { studentSearch: 'Ekum Gustaf', classSearch: 'EPS 1', subjectPattern: 'Manual Labour' },
] as const

async function resolveClassId(
  supabase: ReturnType<typeof createClient>,
  search: string
): Promise<{ id: string; name: string } | null> {
  const { data: classes } = await supabase.from('classes').select('id, name, class_name')
  const norm = search.trim().toLowerCase()
  const match = classes?.find((c) => {
    const label = (c.class_name || c.name || '').trim().toLowerCase()
    return label === norm || label.includes(norm) || norm.includes(label)
  })
  return match ? { id: match.id, name: match.class_name || match.name || search } : null
}

async function resolveStudentId(
  supabase: ReturnType<typeof createClient>,
  search: string,
  classId: string
): Promise<{ id: string; name: string } | null> {
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select('student:students!inner(id, first_name, last_name)')
    .eq('class_id', classId)
    .eq('status', 'active')

  const norm = search.trim().toLowerCase()
  for (const row of enrollments ?? []) {
    const s = row.student as { id: string; first_name?: string; last_name?: string }
    const full = `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim().toLowerCase()
    if (full.includes(norm) || norm.includes(full)) {
      return { id: s.id, name: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() }
    }
  }
  return null
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const { data: cfg } = await supabase.from('app_configuration').select('academic_year').maybeSingle()
  const year = cfg?.academic_year ?? '2025-2026'
  const seqConfig = await loadSequenceYearConfig(supabase, year)
  const totalSeq = seqConfig.totalSequences === 5 ? 5 : 6

  for (const testCase of CASES) {
    console.log('\n' + '='.repeat(60))
    console.log(`CASE: ${testCase.studentSearch} | ${testCase.classSearch} | ${testCase.subjectPattern}`)
    console.log('='.repeat(60))

    const cls = await resolveClassId(supabase, testCase.classSearch)
    if (!cls) {
      console.error('Class not found:', testCase.classSearch)
      continue
    }
    const student = await resolveStudentId(supabase, testCase.studentSearch, cls.id)
    if (!student) {
      console.error('Student not found:', testCase.studentSearch)
      continue
    }
    console.log('Class:', cls.name, cls.id)
    console.log('Student:', student.name, student.id)

    const { data: grades } = await supabase
      .from('grades')
      .select('marks_obtained, assessment:assessments!inner(title, subject, class_id)')
      .eq('student_id', student.id)
      .eq('assessment.class_id', cls.id)

    const sGrades = (grades ?? []).filter((g) =>
      subjectNamesMatch(g.assessment?.subject ?? '', testCase.subjectPattern)
    )
    console.log('DB grades count:', sGrades.length)
    for (const g of sGrades) {
      console.log(' ', g.marks_obtained, '|', g.assessment?.subject, '|', g.assessment?.title)
    }

    const sequenceMarks: Record<string, number | undefined> = {
      seq1: undefined,
      seq2: undefined,
      seq3: undefined,
      seq4: undefined,
      seq5: undefined,
      seq6: undefined,
    }
    const titleToSeq: Record<string, number> = {
      'First Sequence': 1,
      'Second Sequence': 2,
      'Third Sequence': 3,
      'Fourth Sequence': 4,
      'Fifth Sequence': 5,
      'Sixth Sequence': 6,
    }
    for (const g of sGrades) {
      const title = g.assessment?.title ?? ''
      const seq = titleToSeq[title]
      if (seq) sequenceMarks[`seq${seq}`] = g.marks_obtained
    }

    const termAvgs = getTermAveragesFromSequenceMarks(
      sequenceMarks,
      seqConfig.termSequenceCounts
    )
    const annualAvg = getAnnualAverageFromTermAverages(termAvgs)
    const partialAvg = getPartialAnnualAverageFromTermAverages(termAvgs)
    const populatedAvg = getAverageFromPopulatedSequenceMarks(sequenceMarks, totalSeq)
    const resolved = resolveYearSummaryFinalMark(
      sequenceMarks,
      seqConfig.termSequenceCounts,
      totalSeq
    )

    console.log('sequenceMarks:', sequenceMarks)
    console.log('termAvgs:', termAvgs)
    console.log('annualAvg (3 terms):', annualAvg)
    console.log('partialAvg:', partialAvg)
    console.log('populatedSeqAvg:', populatedAvg)
    console.log('resolveYearSummaryFinalMark:', resolved)
    if (resolved) {
      console.log('calculateGrade(finalMark):', calculateGrade(resolved.finalMark))
    }

    try {
      const apiUrl = `${BASE}/api/admin/reports/student-report?studentId=${student.id}&classId=${cls.id}&academicTermId=annual`
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(120_000) })
      if (!res.ok) {
        console.log('API:', res.status, '(start dev server to compare)')
        continue
      }
      const data = (await res.json()) as {
        subjects?: Record<string, { items?: Record<string, unknown>[] }>
      }
      const items: Record<string, unknown>[] = []
      for (const sec of Object.values(data.subjects ?? {})) {
        if (sec?.items) items.push(...sec.items)
      }
      const item = items.find((i) =>
        subjectNamesMatch(String(i.name ?? ''), testCase.subjectPattern)
      )
      console.log('API item:', {
        name: item?.name,
        term1: item?.term1,
        term2: item?.term2,
        term3: item?.term3,
        annualAverage: item?.annualAverage,
        eval: item?.eval,
        grade: item?.grade,
        remark: item?.remark,
      })
      const evalNum = typeof item?.eval === 'number' ? item.eval : undefined
      const grade = String(item?.grade ?? '')
      if (evalNum !== undefined && grade && grade !== calculateGrade(evalNum)) {
        console.warn('MISMATCH: grade', grade, '!= calculateGrade(eval)', calculateGrade(evalNum))
      }
    } catch (e) {
      console.log('API fetch skipped:', e instanceof Error ? e.message : e)
    }
  }
}

main()
