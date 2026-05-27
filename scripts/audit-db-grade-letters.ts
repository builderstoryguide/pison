/**
 * Audit grades.grade_letter vs canonical A/B/C/D/U from marks_obtained.
 * Run: npx tsx scripts/audit-db-grade-letters.ts
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import {
  calculateGradeFromMarks,
  getGradeRemarks,
} from '../lib/grading-utils'

dotenv.config({ path: '.env.local' })

interface MismatchRow {
  gradeId: string
  studentId: string
  assessmentId: string
  subject: string
  marksObtained: number
  totalMarks: number
  storedLetter: string
  expectedLetter: string
  storedRemarks: string | null
  expectedRemarks: string
  issueType: string
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const mismatches: MismatchRow[] = []
  let scanned = 0

  const pageSize = 1000
  let from = 0
  while (true) {
    const { data: rows, error } = await supabase
      .from('grades')
      .select(
        `
        id,
        student_id,
        marks_obtained,
        grade_letter,
        remarks,
        assessment:assessments!inner(id, subject, total_marks)
      `
      )
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('Query error:', error.message)
      process.exit(1)
    }
    if (!rows?.length) break

    for (const row of rows) {
      scanned++
      const marks = row.marks_obtained as number
      if (typeof marks !== 'number' || Number.isNaN(marks)) continue

      const assessment = row.assessment as {
        id?: string
        subject?: string
        total_marks?: number
      } | null
      const totalMarks =
        typeof assessment?.total_marks === 'number' && assessment.total_marks > 0
          ? assessment.total_marks
          : 20
      const expectedLetter = calculateGradeFromMarks(marks, totalMarks)
      const storedLetter = String(row.grade_letter ?? '').trim()
      const expectedRemarks = getGradeRemarks(expectedLetter)
      const storedRemarks = row.remarks as string | null

      if (storedLetter !== expectedLetter) {
        let issueType = 'LETTER_MISMATCH'
        if (marks === 14 && storedLetter === 'U') issueType = 'MARK_14_STORED_U'
        if (['F', 'E'].includes(storedLetter) && ['U', 'D'].includes(expectedLetter)) {
          issueType = 'LEGACY_AF_SCALE'
        }
        mismatches.push({
          gradeId: row.id as string,
          studentId: row.student_id as string,
          assessmentId: assessment?.id ?? '',
          subject: assessment?.subject ?? '',
          marksObtained: marks,
          totalMarks,
          storedLetter,
          expectedLetter,
          storedRemarks,
          expectedRemarks,
          issueType,
        })
      }
    }

    if (rows.length < pageSize) break
    from += pageSize
  }

  const outDir = path.resolve(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const summary = {
    scanned,
    mismatchCount: mismatches.length,
    byIssueType: mismatches.reduce(
      (acc, m) => {
        acc[m.issueType] = (acc[m.issueType] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
  }

  const jsonPath = path.join(outDir, 'audit-db-grade-letters.json')
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ summary, mismatches }, null, 2)
  )

  const csvPath = path.join(outDir, 'audit-db-grade-letters.csv')
  const header =
    'gradeId,studentId,assessmentId,subject,marksObtained,totalMarks,storedLetter,expectedLetter,issueType'
  const csvRows = mismatches.map(
    (m) =>
      `${m.gradeId},${m.studentId},${m.assessmentId},"${m.subject.replace(/"/g, '""')}",${m.marksObtained},${m.totalMarks},${m.storedLetter},${m.expectedLetter},${m.issueType}`
  )
  fs.writeFileSync(csvPath, [header, ...csvRows].join('\n'))

  console.log('--- DB grade letter audit ---')
  console.log(JSON.stringify(summary, null, 2))
  console.log(`Wrote ${jsonPath}`)
  console.log(`Wrote ${csvPath}`)
  if (mismatches.length > 0) {
    console.log('\nSample mismatches (first 15):')
    for (const m of mismatches.slice(0, 15)) {
      console.log(
        `  [${m.issueType}] ${m.subject} mark=${m.marksObtained} stored=${m.storedLetter} expected=${m.expectedLetter}`
      )
    }
  }
}

main()
