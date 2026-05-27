/**
 * Audit EPS 1–5 report card Term 1/2/3 columns via student-report API (full cohort).
 * Run: npx tsx scripts/audit_eps_report_card_terms.ts
 * Requires .env.local and REPORT_API_BASE (default http://localhost:3000)
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { classGroups, subjectMap } from '../lib/class-curriculum'
import { isSubjectExcludedForClass, subjectNamesMatch } from '../lib/report-card-subject-matching'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const BASE = process.env.REPORT_API_BASE || 'http://localhost:3000'
const EPS_GROUPS = classGroups.filter((g) => g.userClassName.startsWith('EPS'))
const CONCURRENCY = 4

type Bucket = 'A' | 'B' | 'C' | 'D' | 'OK'

interface SubjectAudit {
  name: string
  bucket: Bucket
  eval: number | string
  term1?: number
  term2?: number
  term3?: number
  seq1?: number
  seq2?: number
  seq3?: number
  seq4?: number
  seq5?: number
  total?: number | string
  coefEligible?: boolean
  hasMark?: boolean
  partialAnnualEligible?: boolean
}

interface ClassAudit {
  className: string
  classId: string
  studentId: string
  studentName: string
  term: 'annual' | 'third'
  subjects: SubjectAudit[]
  reportWarnings: unknown[]
  missingFromCurriculum: string[]
}

function flattenItems(subjects: Record<string, { items?: unknown[] }> | undefined): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = []
  for (const section of Object.values(subjects || {})) {
    if (section?.items) items.push(...(section.items as Record<string, unknown>[]))
  }
  return items
}

function classifyBucket(item: Record<string, unknown>): Bucket {
  const evalVal = item.eval
  const hasEval =
    typeof evalVal === 'number' || (typeof evalVal === 'string' && evalVal !== '-' && evalVal !== '')
  const t1 = typeof item.term1 === 'number'
  const t2 = typeof item.term2 === 'number'
  const t3 = typeof item.term3 === 'number'
  const anyTerm = t1 || t2 || t3
  const allTerms = t1 && t2 && t3

  if (hasEval && !anyTerm) return 'A'
  if (!hasEval && !anyTerm) return 'B'
  if (anyTerm && !allTerms) return 'C'
  if (allTerms || (hasEval && anyTerm)) return 'OK'
  return 'B'
}

async function fetchReport(
  studentId: string,
  classId: string,
  academicTermId: 'annual' | 'third'
): Promise<Record<string, unknown> | null> {
  const url = `${BASE}/api/admin/reports/student-report?studentId=${encodeURIComponent(studentId)}&classId=${encodeURIComponent(classId)}&academicTermId=${academicTermId}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} for ${studentId} ${academicTermId}`)
      return null
    }
    return (await res.json()) as Record<string, unknown>
  } catch (e) {
    console.warn(`  Fetch failed (${studentId}):`, (e as Error).message)
    return null
  }
}

async function resolveStudentsInClass(
  supabase: ReturnType<typeof createClient>,
  meta: { name: string; id: string }
) {
  const { data: rows } = await supabase
    .from('students')
    .select('id, first_name, last_name, class, class_id, status')
    .or(`class_id.eq.${meta.id},class.eq.${meta.id}`)

  let resolved = (rows ?? []).filter(
    (s) => !s.status || String(s.status).toLowerCase() === 'active'
  )

  if (resolved.length === 0) {
    const { data: byName } = await supabase
      .from('students')
      .select('id, first_name, last_name, class, class_id, status')
      .or(`class.ilike.%${meta.name}%,class_name.ilike.%${meta.name}%`)

    resolved = (byName ?? []).filter(
      (s) => !s.status || String(s.status).toLowerCase() === 'active'
    )
  }

  return resolved
}

async function runPool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0

  async function runWorker() {
    while (true) {
      const i = index++
      if (i >= items.length) break
      results[i] = await worker(items[i])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => runWorker())
  )
  return results
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase env vars')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const results: ClassAudit[] = []
  const classMeta: { name: string; id: string; expectedSubjects: string[] }[] = []

  console.log('=== EPS class resolution & class_subjects check ===\n')

  for (const group of EPS_GROUPS) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, class_name')
      .or(`name.ilike.%${group.dbSearchName}%,class_name.ilike.%${group.dbSearchName}%`)

    const cls = classes?.[0]
    if (!cls) {
      console.log(`❌ ${group.dbSearchName}: class not found`)
      continue
    }

    const expectedDbNames = group.subjects
      .filter((s) => !isSubjectExcludedForClass(group.dbSearchName, subjectMap[s] || s))
      .map((s) => subjectMap[s] || s)

    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('subjects(name)')
      .eq('class_id', cls.id)

    const actualNames = (classSubjects ?? [])
      .map((cs) => {
        const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects
        return (subj as { name?: string })?.name?.trim()
      })
      .filter((n): n is string => Boolean(n))

    const missing = expectedDbNames.filter(
      (exp) => !actualNames.some((a) => subjectNamesMatch(a, exp))
    )

    console.log(`${group.dbSearchName} (${cls.id})`)
    console.log(`  class_subjects: ${actualNames.length}, expected: ${expectedDbNames.length}`)
    if (missing.length) console.log(`  missing: ${missing.join('; ')}`)

    classMeta.push({
      name: group.dbSearchName,
      id: cls.id,
      expectedSubjects: expectedDbNames,
    })
  }

  console.log('\n=== API audit (annual, all active students) ===\n')

  for (const meta of classMeta) {
    const students = await resolveStudentsInClass(supabase, meta)
    if (students.length === 0) {
      console.log(`${meta.name}: no students found`)
      continue
    }

    console.log(`${meta.name}: auditing ${students.length} students...`)

    const jobs = students.flatMap((student) =>
      (['annual'] as const).map((term) => ({ student, term }))
    )

    const audits = await runPool(jobs, async ({ student, term }) => {
      const data = await fetchReport(student.id, meta.id, term)
      if (!data) return null

      const items = flattenItems(data.subjects as Record<string, { items?: unknown[] }>)
      const subjects: SubjectAudit[] = items.map((item) => ({
        name: String(item.name ?? ''),
        bucket: classifyBucket(item),
        eval: item.eval as number | string,
        term1: item.term1 as number | undefined,
        term2: item.term2 as number | undefined,
        term3: item.term3 as number | undefined,
        seq1: item.seq1 as number | undefined,
        seq2: item.seq2 as number | undefined,
        seq3: item.seq3 as number | undefined,
        seq4: item.seq4 as number | undefined,
        seq5: item.seq5 as number | undefined,
        total: item.total as number | string | undefined,
        coefEligible: item.coefEligible as boolean | undefined,
        hasMark: item.hasMark as boolean | undefined,
        partialAnnualEligible: item.partialAnnualEligible as boolean | undefined,
      }))

      const actualNames = subjects.map((s) => s.name)
      const missingFromCurriculum = meta.expectedSubjects.filter(
        (exp) => !actualNames.some((a) => subjectNamesMatch(a, exp))
      )

      return {
        className: meta.name,
        classId: meta.id,
        studentId: student.id,
        studentName: `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim(),
        term,
        subjects,
        reportWarnings: (data.reportWarnings as unknown[]) ?? [],
        missingFromCurriculum,
      } satisfies ClassAudit
    })

    for (const audit of audits) {
      if (!audit) continue
      results.push(audit)
    }

    const annual = audits.filter((a) => a?.term === 'annual') as ClassAudit[]
    const byBucket = { A: 0, B: 0, C: 0, D: 0, OK: 0 }
    for (const a of annual) {
      for (const s of a.subjects) byBucket[s.bucket]++
    }
    console.log(
      `  ${meta.name} annual totals: A=${byBucket.A} B=${byBucket.B} C=${byBucket.C} OK=${byBucket.OK} (${annual.length} students)`
    )
  }

  const outDir = path.join(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'eps-report-card-terms-audit.json')
  fs.writeFileSync(outPath, JSON.stringify({ classMeta, results }, null, 2))
  console.log(`\nSaved: ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
