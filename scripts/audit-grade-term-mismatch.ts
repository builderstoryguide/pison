/**
 * Audit annual report items where displayed average and letter grade disagree.
 * Run: npx tsx scripts/audit-grade-term-mismatch.ts
 * Requires dev server at REPORT_API_BASE (default http://127.0.0.1:3000).
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { calculateGrade } from '../lib/grading-utils'

dotenv.config({ path: '.env.local' })

const BASE = process.env.REPORT_API_BASE || 'http://127.0.0.1:3000'

interface MismatchRow {
  className: string
  studentId: string
  studentName: string
  subject: string
  eval: number
  grade: string
  expectedGrade: string
  term1?: number
  term2?: number
  term3?: number
  issueType: string
}

async function resolveClassId(
  supabase: ReturnType<typeof createClient>,
  studentClass: string
): Promise<string | null> {
  if (/^[0-9a-f-]{36}$/i.test(studentClass)) return studentClass
  const { data: byClassName } = await supabase
    .from('classes')
    .select('id')
    .eq('class_name', studentClass)
    .maybeSingle()
  if (byClassName) return byClassName.id
  const { data: byName } = await supabase
    .from('classes')
    .select('id')
    .eq('name', studentClass)
    .maybeSingle()
  if (byName) return byName.id
  const { data: all } = await supabase.from('classes').select('id, name, class_name')
  const norm = studentClass.trim().toLowerCase()
  const match = all?.find(
    (c) => (c.class_name || c.name || '').trim().toLowerCase() === norm
  )
  return match?.id ?? null
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env vars')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const mismatches: MismatchRow[] = []

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, student_enrollments(class_id, status, classes:class_id(name, class_name))')
    .eq('student_enrollments.status', 'active')

  let checked = 0
  for (const student of students ?? []) {
    const enrollments = (student.student_enrollments ?? []) as {
      class_id: string
      classes?: { name?: string; class_name?: string }
    }[]
    const studentName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()

    for (const enr of enrollments) {
      const classId = enr.class_id
      const className =
        enr.classes?.class_name || enr.classes?.name || classId

      try {
        const apiUrl = `${BASE}/api/admin/reports/student-report?studentId=${student.id}&classId=${classId}&academicTermId=annual`
        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(60_000) })
        if (!res.ok) continue
        checked++

        const data = (await res.json()) as {
          subjects?: Record<string, { items?: Record<string, unknown>[] }>
        }
        const items: Record<string, unknown>[] = []
        for (const sec of Object.values(data.subjects ?? {})) {
          if (sec?.items) items.push(...sec.items)
        }

        for (const item of items) {
          if (item.hasMark !== true) continue
          const evalNum = typeof item.eval === 'number' ? item.eval : undefined
          const grade = typeof item.grade === 'string' ? item.grade : ''
          if (evalNum === undefined || !grade || grade === '-') continue

          const expected = calculateGrade(evalNum)
          if (grade !== expected) {
            mismatches.push({
              className,
              studentId: student.id,
              studentName,
              subject: String(item.name ?? ''),
              eval: evalNum,
              grade,
              expectedGrade: expected,
              term1: item.term1 as number | undefined,
              term2: item.term2 as number | undefined,
              term3: item.term3 as number | undefined,
              issueType: 'GRADE_EVAL_MISMATCH',
            })
          }

          const t1 = item.term1 as number | undefined
          const t2 = item.term2 as number | undefined
          const t3 = item.term3 as number | undefined
          const terms = [t1, t2, t3].filter((t): t is number => typeof t === 'number')
          if (
            terms.length === 3 &&
            terms.every((t) => t >= 10) &&
            (evalNum < 7 || grade === 'U')
          ) {
            mismatches.push({
              className,
              studentId: student.id,
              studentName,
              subject: String(item.name ?? ''),
              eval: evalNum,
              grade,
              expectedGrade: expected,
              term1: t1,
              term2: t2,
              term3: t3,
              issueType: 'PASSING_TERMS_WEAK_GRADE',
            })
          }
        }
      } catch {
        // skip on timeout / server down
      }
    }
  }

  const outDir = path.resolve(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'audit-grade-term-mismatch.json')
  fs.writeFileSync(
    outPath,
    JSON.stringify({ checked, mismatchCount: mismatches.length, mismatches }, null, 2)
  )

  console.log(`Checked ${checked} student-class annual reports`)
  console.log(`Mismatches: ${mismatches.length}`)
  console.log(`Wrote ${outPath}`)
  if (mismatches.length > 0) {
    console.log('\nSample (first 10):')
    for (const m of mismatches.slice(0, 10)) {
      console.log(
        `  [${m.issueType}] ${m.className} | ${m.studentName} | ${m.subject} | eval=${m.eval} grade=${m.grade} expected=${m.expectedGrade}`
      )
    }
  }
}

main()
