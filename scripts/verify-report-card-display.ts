/**
 * Verify DB grades appear on term report cards via the student-report API.
 *
 * Run: npx tsx scripts/verify-report-card-display.ts
 * Requires: .env.local, dev server at http://127.0.0.1:3000 (or REPORT_CARD_VERIFY_URL)
 * Output: scripts/output/verify-report-card-display.json + .csv
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { loadSequenceYearConfig } from '../lib/load-sequence-config-server'
import { getTermFromAssessment, parseAcademicTermMode } from '../lib/report-card-assessment-resolution'
import {
  subjectNamesMatch,
  isSubjectExcludedForClass,
} from '../lib/report-card-subject-matching'
import { flattenPisonSubjects, type PisonSubjectSectionInput } from '../lib/report-card-transform'
import type { TermSequenceCounts } from '../lib/sequence-term-mapping'
import type { HistoryInfo, SubjectGrade } from '../components/admin/reports/report-card-types'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const TERMS = ['first', 'second', 'third'] as const
const BASE_URL = process.env.REPORT_CARD_VERIFY_URL || 'http://127.0.0.1:3000'
const CONCURRENCY = 5

type Severity = 'CRITICAL' | 'WARNING' | 'INFO'

interface VerifyIssue {
  severity: Severity
  classId: string
  className: string
  studentId: string
  studentName: string
  term: string
  subject: string
  issueType: string
  details: string
}

interface StudentJob {
  studentId: string
  studentName: string
  classId: string
  className: string
  subjectNames: string[]
}

type GradeRow = {
  marks_obtained: number
  assessment?: { subject?: string; title?: string; term?: string; class_id?: string }
}

async function resolveClassId(
  supabase: ReturnType<typeof createClient>,
  studentClass: string,
  classCache: Map<string, string | null>
): Promise<string | null> {
  const key = studentClass.trim().toLowerCase()
  if (classCache.has(key)) return classCache.get(key) ?? null

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentClass)
  if (isUUID) {
    classCache.set(key, studentClass)
    return studentClass
  }

  const { data: byClassName } = await supabase
    .from('classes')
    .select('id')
    .eq('class_name', studentClass)
    .maybeSingle()
  if (byClassName) {
    classCache.set(key, byClassName.id)
    return byClassName.id
  }

  const { data: byName } = await supabase
    .from('classes')
    .select('id')
    .eq('name', studentClass)
    .maybeSingle()
  if (byName) {
    classCache.set(key, byName.id)
    return byName.id
  }

  const { data: allClasses } = await supabase.from('classes').select('id, name, class_name')
  const normalized = studentClass.trim().toLowerCase()
  const match = allClasses?.find((c) => {
    const label = (c.class_name || c.name || '').trim().toLowerCase()
    return label === normalized
  })
  const resolved = match?.id ?? null
  classCache.set(key, resolved)
  return resolved
}

function hasDbGradesForTerm(
  grades: GradeRow[],
  subjectName: string,
  termNum: 1 | 2 | 3,
  sequenceIdToNumberMap: Map<string, number>,
  termSequenceCounts: TermSequenceCounts
): boolean {
  return grades.some((g) => {
    const a = g.assessment
    if (!a?.subject || !subjectNamesMatch(a.subject, subjectName)) return false
    const resolvedTerm = getTermFromAssessment(
      a.title ?? null,
      a.term ?? null,
      sequenceIdToNumberMap,
      termSequenceCounts
    )
    return resolvedTerm === termNum
  })
}

function findReportSubject(subjects: SubjectGrade[], classSubjectName: string): SubjectGrade | undefined {
  return subjects.find((s) => subjectNamesMatch(s.subjectName, classSubjectName))
}

type ReportFetchPayload = { subjects: SubjectGrade[]; history?: HistoryInfo }

async function fetchReportSubjects(
  studentId: string,
  classId: string,
  term: string,
  cache: Map<string, ReportFetchPayload | 'error'>
): Promise<{ ok: true; subjects: SubjectGrade[]; history?: HistoryInfo } | { ok: false; error: string }> {
  const cacheKey = `${studentId}:${classId}:${term}`
  const cached = cache.get(cacheKey)
  if (cached === 'error') return { ok: false, error: 'Cached fetch failure' }
  if (cached) return { ok: true, subjects: cached.subjects, history: cached.history }

  const url = `${BASE_URL}/api/admin/reports/student-report?studentId=${encodeURIComponent(studentId)}&classId=${encodeURIComponent(classId)}&academicTermId=${encodeURIComponent(term)}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      cache.set(cacheKey, 'error')
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` }
    }
    const json = (await res.json()) as {
      subjects?: Record<string, PisonSubjectSectionInput>
      history?: HistoryInfo
    }
    const subjects = flattenPisonSubjects(json.subjects ?? {})
    const payload: ReportFetchPayload = { subjects, history: json.history }
    cache.set(cacheKey, payload)
    return { ok: true, subjects, history: json.history }
  } catch (e) {
    cache.set(cacheKey, 'error')
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function runPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let index = 0
  async function worker() {
    while (index < items.length) {
      const current = items[index++]
      await fn(current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
}

function summarize(issues: VerifyIssue[]) {
  const byClass: Record<string, number> = {}
  for (const i of issues) {
    byClass[i.className] = (byClass[i.className] || 0) + 1
  }
  return {
    total: issues.length,
    critical: issues.filter((i) => i.severity === 'CRITICAL').length,
    warning: issues.filter((i) => i.severity === 'WARNING').length,
    info: issues.filter((i) => i.severity === 'INFO').length,
    byType: issues.reduce(
      (acc, i) => {
        acc[i.issueType] = (acc[i.issueType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
    byClass,
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const issues: VerifyIssue[] = []
  const reportCache = new Map<string, ReportFetchPayload | 'error'>()

  const { data: cfg } = await supabase
    .from('app_configuration')
    .select('academic_year')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const academicYear =
    cfg?.academic_year || process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025'

  const seqConfig = await loadSequenceYearConfig(supabase, academicYear)

  const { data: academicSequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number, sequence_name')
    .eq('academic_year', academicYear)

  const sequenceIdToNumberMap = new Map<string, number>()
  for (const seq of academicSequences || []) {
    sequenceIdToNumberMap.set(seq.id, seq.sequence_number)
    if (seq.sequence_name) {
      sequenceIdToNumberMap.set(seq.sequence_name.toLowerCase(), seq.sequence_number)
    }
  }

  const { data: classes } = await supabase.from('classes').select('id, name, class_name')
  const classSubjectsByClassId = new Map<string, string[]>()

  for (const cls of classes || []) {
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('subject_id, subjects(id, name)')
      .eq('class_id', cls.id)
      .neq('is_active', false)

    const subjectNames = (classSubjects ?? [])
      .map((cs) => {
        const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects
        return (subj as { name?: string })?.name
      })
      .filter((name): name is string => Boolean(name))

    classSubjectsByClassId.set(cls.id, subjectNames)
  }

  const classCache = new Map<string, string | null>()
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, class')

  const jobs: StudentJob[] = []
  for (const student of allStudents || []) {
    const resolvedClassId = await resolveClassId(supabase, student.class || '', classCache)
    if (!resolvedClassId) continue

    const cls = classes?.find((c) => c.id === resolvedClassId)
    const className = cls?.class_name || cls?.name || resolvedClassId
    const subjectNames = classSubjectsByClassId.get(resolvedClassId) ?? []

    jobs.push({
      studentId: student.id,
      studentName: `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim(),
      classId: resolvedClassId,
      className,
      subjectNames,
    })
  }

  if (jobs.length === 0) {
    console.error('No students with resolvable classes found.')
    process.exit(1)
  }

  const preflight = jobs[0]
  console.log(`Preflight: fetching report for ${preflight.studentName} (${preflight.className})...`)
  const preflightResult = await fetchReportSubjects(
    preflight.studentId,
    preflight.classId,
    'first',
    reportCache
  )
  if (!preflightResult.ok) {
    console.error(
      `Cannot reach report API at ${BASE_URL}. Start dev server (npm run dev) or set REPORT_CARD_VERIFY_URL.\nError: ${preflightResult.error}`
    )
    process.exit(1)
  }
  console.log(`API OK — ${preflightResult.subjects.length} subjects on sample report`)

  console.log(
    `Verifying ${jobs.length} students across ${classes?.length ?? 0} classes for year ${academicYear}`
  )
  console.log(`Sequence config: ${seqConfig.totalSequences} sequences`, seqConfig.termSequenceCounts)
  console.log(`Terms: ${TERMS.join(', ')} | Concurrency: ${CONCURRENCY}`)

  let processed = 0

  await runPool(jobs, CONCURRENCY, async (job) => {
    const { data: grades } = await supabase
      .from('grades')
      .select(`marks_obtained, assessment:assessments!inner(subject, title, class_id)`)
      .eq('student_id', job.studentId)
      .eq('assessment.class_id', job.classId)

    const gradeRows = (grades || []) as GradeRow[]

    for (const term of TERMS) {
      const termMode = parseAcademicTermMode(term)
      if (termMode.mode !== 'per_term') continue
      const termNum = termMode.term

      const reportResult = await fetchReportSubjects(
        job.studentId,
        job.classId,
        term,
        reportCache
      )

      if (!reportResult.ok) {
        issues.push({
          severity: 'CRITICAL',
          classId: job.classId,
          className: job.className,
          studentId: job.studentId,
          studentName: job.studentName,
          term,
          subject: '',
          issueType: 'REPORT_FETCH_FAILED',
          details: reportResult.error,
        })
        continue
      }

      for (const subj of reportResult.subjects) {
        if (isSubjectExcludedForClass(job.className, subj.subjectName)) {
          issues.push({
            severity: 'CRITICAL',
            classId: job.classId,
            className: job.className,
            studentId: job.studentId,
            studentName: job.studentName,
            term,
            subject: subj.subjectName,
            issueType: 'EXCLUDED_SUBJECT_ON_REPORT',
            details: `Excluded subject appears on ${term} report card`,
          })
        }
      }

      if (termNum === 3) {
        const h = reportResult.history
        const hasAnyTermAvg =
          (h?.term1 ?? 0) > 0 || (h?.term2 ?? 0) > 0 || (h?.term3 ?? 0) > 0
        const hasTerm1Grades = job.subjectNames.some((name) =>
          hasDbGradesForTerm(
            gradeRows,
            name,
            1,
            sequenceIdToNumberMap,
            seqConfig.termSequenceCounts
          )
        )
        if (hasTerm1Grades && !hasAnyTermAvg) {
          issues.push({
            severity: 'WARNING',
            classId: job.classId,
            className: job.className,
            studentId: job.studentId,
            studentName: job.studentName,
            term,
            subject: '',
            issueType: 'YEAR_SUMMARY_HISTORY_MISSING',
            details: 'Term 3 report has term-1 DB grades but history.term1/2/3 averages are all empty',
          })
        }
      }

      for (const csName of job.subjectNames) {
        if (isSubjectExcludedForClass(job.className, csName)) continue

        const expectedGrades = hasDbGradesForTerm(
          gradeRows,
          csName,
          termNum,
          sequenceIdToNumberMap,
          seqConfig.termSequenceCounts
        )
        if (!expectedGrades) continue

        const reportSubject = findReportSubject(reportResult.subjects, csName)
        if (!reportSubject) {
          issues.push({
            severity: 'WARNING',
            classId: job.classId,
            className: job.className,
            studentId: job.studentId,
            studentName: job.studentName,
            term,
            subject: csName,
            issueType: 'SUBJECT_MISSING_FROM_REPORT',
            details: `DB has ${term} grades but subject not found on report card`,
          })
          continue
        }

        if (!reportSubject.hasMark) {
          issues.push({
            severity: 'WARNING',
            classId: job.classId,
            className: job.className,
            studentId: job.studentId,
            studentName: job.studentName,
            term,
            subject: csName,
            issueType: 'GRADES_NOT_ON_REPORT',
            details: `DB has ${term} grades but report shows eval="${reportSubject.termAverage ?? '-'}" hasMark=false`,
          })
        }
      }
    }

    processed++
    if (processed % 20 === 0) {
      console.log(`  Progress: ${processed}/${jobs.length} students`)
    }
  })

  const outDir = path.resolve(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const summary = summarize(issues)
  const jsonPath = path.join(outDir, 'verify-report-card-display.json')
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ academicYear, baseUrl: BASE_URL, studentsChecked: jobs.length, issues, summary }, null, 2)
  )

  const csvPath = path.join(outDir, 'verify-report-card-display.csv')
  const header = 'severity,classId,className,studentId,studentName,term,subject,issueType,details'
  const rows = issues.map(
    (i) =>
      `${i.severity},${i.classId},"${i.className}",${i.studentId},"${i.studentName}",${i.term},"${i.subject.replace(/"/g, '""')}",${i.issueType},"${i.details.replace(/"/g, '""')}"`
  )
  fs.writeFileSync(csvPath, [header, ...rows].join('\n'))

  console.log('\n--- Verification complete ---')
  console.log(`Students checked: ${jobs.length}`)
  console.log(JSON.stringify(summary, null, 2))
  console.log(`Wrote ${jsonPath}`)
  console.log(`Wrote ${csvPath}`)

  if (issues.length > 0) {
    console.log('\nSample issues (first 5):')
    for (const i of issues.slice(0, 5)) {
      console.log(`  [${i.issueType}] ${i.className} | ${i.studentName} | ${i.term} | ${i.subject}: ${i.details}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
