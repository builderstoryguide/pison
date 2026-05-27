/**
 * Audit BC (Form 1–5 BC) report card Term 1/2/3 columns via student-report API.
 * Run: npx tsx scripts/audit_bc_report_card_terms.ts
 * Requires .env.local and REPORT_API_BASE (default http://localhost:3000)
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { classGroups, subjectMap } from '../lib/class-curriculum'
import { isSubjectExcludedForClass } from '../lib/report-card-subject-matching'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const BASE = process.env.REPORT_API_BASE || 'http://localhost:3000'
const BC_GROUPS = classGroups.filter((g) => g.dbSearchName.startsWith('Form') && g.dbSearchName.includes('BC'))

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
  seq6?: number
  coefEligible?: boolean
  hasMark?: boolean
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
  extraSubjects: string[]
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
      console.warn(`  HTTP ${res.status} for ${academicTermId}`)
      return null
    }
    return (await res.json()) as Record<string, unknown>
  } catch (e) {
    console.warn(`  Fetch failed (${academicTermId}):`, (e as Error).message)
    return null
  }
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

  console.log('=== BC class resolution & class_subjects check ===\n')

  for (const group of BC_GROUPS) {
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
      (exp) => !actualNames.some((a) => a.toLowerCase() === exp.toLowerCase())
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

  console.log('\n=== API audit (annual + third) ===\n')

  for (const meta of classMeta) {
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, first_name, last_name, class, class_id, status')
      .limit(500)

    const inClass = (allStudents ?? []).filter(
      (s) => s.class_id === meta.id || (s.class && String(s.class).includes(meta.id))
    )

    let resolved = inClass
    if (resolved.length === 0) {
      const { data: byClass } = await supabase
        .from('students')
        .select('id, first_name, last_name, class, class_id')
        .or(`class.ilike.%${meta.name}%,class_name.ilike.%${meta.name}%`)
        .limit(5)
      resolved = byClass ?? []
    }

    const sample = resolved.slice(0, 2)
    if (sample.length === 0) {
      console.log(`${meta.name}: no students found`)
      continue
    }

    for (const student of sample) {
      for (const term of ['annual', 'third'] as const) {
        const data = await fetchReport(student.id, meta.id, term)
        if (!data) continue

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
          seq6: item.seq6 as number | undefined,
          coefEligible: item.coefEligible as boolean | undefined,
          hasMark: item.hasMark as boolean | undefined,
        }))

        const actualNames = subjects.map((s) => s.name)
        const missingFromCurriculum = meta.expectedSubjects.filter(
          (exp) =>
            !actualNames.some((a) => a.toLowerCase().includes(exp.toLowerCase().slice(0, 12)))
        )

        results.push({
          className: meta.name,
          classId: meta.id,
          studentId: student.id,
          studentName: `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim(),
          term,
          subjects,
          reportWarnings: (data.reportWarnings as unknown[]) ?? [],
          missingFromCurriculum,
          extraSubjects: [],
        })

        const byBucket = { A: 0, B: 0, C: 0, D: 0, OK: 0 }
        for (const s of subjects) byBucket[s.bucket]++
        console.log(
          `${meta.name} | ${student.first_name} ${student.last_name} | ${term}: A=${byBucket.A} B=${byBucket.B} C=${byBucket.C} OK=${byBucket.OK}`
        )
      }
    }
  }

  const outDir = path.join(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'bc-report-card-terms-audit.json')
  fs.writeFileSync(outPath, JSON.stringify({ classMeta, results }, null, 2))
  console.log(`\nSaved: ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
