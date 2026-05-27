/**
 * Fix AC 4 missing term marks per investigation plan.
 * - Creates OFR Fifth Sequence assessment + grades for all students
 * - Backfills missing sequence grades using adjacent-sequence marks:
 *     First Seq  <- Second Seq
 *     Third Seq  <- Fourth Seq
 *     Fifth Seq  <- mean(Third, Fourth) or Fourth if only one
 *
 * Run (dry-run): npx tsx scripts/fix_ac4_missing_term_marks.ts
 * Run (apply):    npx tsx scripts/fix_ac4_missing_term_marks.ts --apply
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { classGroups, subjectMap } from '../lib/class-curriculum'
import { isSubjectExcludedForClass } from '../lib/report-card-subject-matching'
import { getSequenceName } from '../lib/report-card-utils'
import { extractGlobalSequenceNumber } from '../lib/report-card-assessment-resolution'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const APPLY = process.argv.includes('--apply')
const CLASS_ID = '8fe6b8a4-0eba-4e52-8813-32975299b206'
const CLASS_NAME = 'AC 4'

const SEQ_TITLE: Record<number, string> = {
  1: 'First Sequence',
  2: 'Second Sequence',
  3: 'Third Sequence',
  4: 'Fourth Sequence',
  5: 'Fifth Sequence',
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function calculateGrade(mark: number, total = 20): string {
  const pct = (mark / total) * 100
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'U'
}

function gradePayload(mark: number) {
  const pct = (mark / 20) * 100
  return {
    marks_obtained: mark,
    percentage: Math.round(pct * 100) / 100,
    grade_letter: calculateGrade(mark),
    remarks: mark >= 10 ? 'Pass' : 'Fail',
  }
}

function inferMarkForTarget(
  targetSeq: number,
  bySeq: Map<number, number>
): number | undefined {
  if (targetSeq === 1) {
    return bySeq.get(2) ?? bySeq.get(3) ?? bySeq.get(4) ?? bySeq.get(5)
  }
  if (targetSeq === 3) {
    return bySeq.get(4) ?? bySeq.get(2) ?? bySeq.get(1)
  }
  if (targetSeq === 5) {
    const t3 = bySeq.get(3)
    const t4 = bySeq.get(4)
    if (typeof t3 === 'number' && typeof t4 === 'number') {
      return parseFloat(((t3 + t4) / 2).toFixed(2))
    }
    return t4 ?? t3 ?? bySeq.get(2) ?? bySeq.get(1)
  }
  return undefined
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const { data: appCfg } = await supabase
    .from('app_configuration')
    .select('academic_year')
    .maybeSingle()
  const academicYear = appCfg?.academic_year || '2025-2026'

  const { data: sequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number')
    .eq('academic_year', academicYear)
  const seqToUuid = new Map<number, string>()
  for (const s of sequences || []) {
    seqToUuid.set(s.sequence_number, s.id)
  }

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('class', CLASS_ID)
    .eq('status', 'active')

  if (!students?.length) {
    console.error('No active students for AC 4')
    process.exit(1)
  }

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, subject, teacher_id')
    .eq('class_id', CLASS_ID)

  const teacherId =
    assessments?.find((a) => a.teacher_id)?.teacher_id ||
    (await supabase.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle())
      .data?.id

  if (!teacherId) {
    console.error('No teacher/admin id for assessment creation')
    process.exit(1)
  }

  const { data: allGrades } = await supabase
    .from('grades')
    .select('id, student_id, marks_obtained, assessment:assessments!inner(title, subject, class_id)')
    .in(
      'student_id',
      students.map((s) => s.id)
    )

  type MarksKey = string
  const marksByStudentSubject = new Map<MarksKey, Map<number, number>>()

  for (const g of allGrades || []) {
    const a = g.assessment as { title?: string; subject?: string; class_id?: string } | null
    if (!a?.subject || a.class_id !== CLASS_ID) continue
    const seq = extractGlobalSequenceNumber(a.title || '')
    if (!seq || seq < 1 || seq > 5) continue
    const key = `${g.student_id}|${normalize(a.subject)}`
    if (!marksByStudentSubject.has(key)) marksByStudentSubject.set(key, new Map())
    marksByStudentSubject.get(key)!.set(seq, g.marks_obtained)
  }

  let assessmentsCreated = 0
  let gradesCreated = 0

  async function ensureAssessment(
    subjectName: string,
    seqNum: number
  ): Promise<{ id: string; title: string; subject: string } | null> {
    const seqName = getSequenceName(seqNum)
    const seqUuid = seqToUuid.get(seqNum)
    const validTitles = [seqName.toLowerCase(), seqUuid?.toLowerCase()].filter(Boolean)

    let assessment = (assessments || []).find(
      (a) =>
        normalize(a.subject || '') === normalize(subjectName) &&
        validTitles.includes((a.title || '').trim().toLowerCase())
    )

    if (!assessment) {
      const alt = (assessments || []).find(
        (a2) =>
          normalize(a2.subject || '') === normalize(subjectName) &&
          (a2.title || '').trim() === SEQ_TITLE[seqNum]
      )
      if (alt) assessment = alt
    }

    if (!assessment) {
      const title = SEQ_TITLE[seqNum]
      console.log(`[assessment] create ${subjectName} — ${SEQ_TITLE[seqNum]}`)
      assessmentsCreated++
      if (!APPLY) return null

      const { data: created, error } = await supabase
        .from('assessments')
        .insert({
          title,
          type: 'test',
          subject: subjectName,
          class_id: CLASS_ID,
          teacher_id: teacherId,
          total_marks: 20,
          status: 'published',
          assessment_date: new Date().toISOString().split('T')[0],
        })
        .select('id, title, subject, teacher_id')
        .single()

      if (error) {
        console.error('  failed:', error.message)
        return null
      }
      assessment = created
      assessments!.push(created)
    }

    return assessment as { id: string; title: string; subject: string }
  }

  async function ensureGrade(
    assessmentId: string,
    studentId: string,
    mark: number,
    label: string
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('grades')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existing) return

    console.log(`[grade] ${label} = ${mark}`)
    gradesCreated++
    if (APPLY) {
      const { error } = await supabase.from('grades').insert({
        assessment_id: assessmentId,
        student_id: studentId,
        ...gradePayload(mark),
        submitted_at: new Date().toISOString(),
      })
      if (error) console.error('  failed:', error.message)
    }
  }

  const ac4Group = classGroups.find((g) => g.dbSearchName === CLASS_NAME)
  const expectedDbNames = new Set(
    (ac4Group?.subjects || [])
      .map((short) => subjectMap[short] || short)
      .filter((name) => !isSubjectExcludedForClass(CLASS_NAME, name))
      .map((name) => normalize(name))
  )

  const subjectNames = [
    ...new Set(
      (assessments || [])
        .map((a) => a.subject)
        .filter((s): s is string => Boolean(s) && expectedDbNames.has(normalize(s)))
    ),
  ]

  const ofrSubject =
    subjectNames.find((s) => normalize(s).includes('ohada finance reporting')) ||
    'OHADA Finance Reporting (OFR)'

  // Priority 1: OFR Fifth Sequence for all students
  const ofrAssessment = await ensureAssessment(ofrSubject, 5)
  if (ofrAssessment) {
    for (const student of students) {
      const key = `${student.id}|${normalize(ofrSubject)}`
      const bySeq = marksByStudentSubject.get(key) || new Map()
      const mark = inferMarkForTarget(5, bySeq)
      if (mark === undefined) continue
      const name = `${student.first_name} ${student.last_name}`.trim()
      await ensureGrade(ofrAssessment.id, student.id, mark, `${name} / ${ofrSubject} / Fifth`)
      bySeq.set(5, mark)
      marksByStudentSubject.set(key, bySeq)
    }
  }

  // Backfill missing seq 1, 3, 5 on curriculum subjects only
  const targets = [1, 3, 5] as const
  for (const student of students) {
    const studentName = `${student.first_name} ${student.last_name}`.trim()
    for (const subjectName of subjectNames) {
      const key = `${student.id}|${normalize(subjectName)}`
      const bySeq = marksByStudentSubject.get(key) || new Map()
      if (bySeq.size === 0) continue

      for (const seqNum of targets) {
        if (bySeq.has(seqNum)) continue
        const mark = inferMarkForTarget(seqNum, bySeq)
        if (mark === undefined) continue

        const assessment = await ensureAssessment(subjectName, seqNum)
        if (!assessment) continue

        await ensureGrade(
          assessment.id,
          student.id,
          mark,
          `${studentName} / ${subjectName} / ${SEQ_TITLE[seqNum]}`
        )
        bySeq.set(seqNum, mark)
        marksByStudentSubject.set(key, bySeq)
      }
    }
  }

  console.log(`\n=== AC 4 missing term marks ${APPLY ? '(APPLIED)' : '(dry-run)'} ===`)
  console.log(`Students: ${students.length}, Subjects: ${subjectNames.length}`)
  console.log(`Assessments created: ${assessmentsCreated}`)
  console.log(`Grades created: ${gradesCreated}`)
  if (!APPLY) console.log('\nRe-run with --apply to write changes.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
