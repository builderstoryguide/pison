/**
 * Bootstrap AC 5 Term 2/3 assessments and grades from existing Term 1 marks.
 * Creates Third/Fourth/Fifth Sequence assessments and copies Term 1 sequence marks:
 *   seq3 <- seq1, seq4 <- seq2, seq5 <- mean(seq1, seq2)
 *
 * Run (dry-run): npx tsx scripts/bootstrap_ac5_term23_marks.ts
 * Run (apply):    npx tsx scripts/bootstrap_ac5_term23_marks.ts --apply
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { classGroups, subjectMap } from '../lib/class-curriculum'
import { getSequenceName } from '../lib/report-card-utils'
import {
  extractGlobalSequenceNumber,
  isUuidString,
} from '../lib/report-card-assessment-resolution'
import { isSubjectExcludedForClass } from '../lib/report-card-subject-matching'
import { calculateGrade, getGradeRemarks } from '../lib/grading-utils'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const APPLY = process.argv.includes('--apply')
const CLASS_NAME = 'AC 5'
const TARGET_SEQUENCES = [3, 4, 5] as const

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function resolveSeqFromTitle(
  title: string,
  uuidToSeq: Map<string, number>
): number | null {
  const t = title.trim()
  if (isUuidString(t) && uuidToSeq.has(t)) return uuidToSeq.get(t)!
  return extractGlobalSequenceNumber(t)
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const ac5Group = classGroups.find((g) => g.dbSearchName === CLASS_NAME)
  if (!ac5Group) {
    console.error('AC 5 not found in class curriculum')
    process.exit(1)
  }

  const { data: appCfg } = await supabase
    .from('app_configuration')
    .select('academic_year')
    .maybeSingle()
  const academicYear = appCfg?.academic_year || '2025-2026'

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', CLASS_NAME)
  if (!classes?.length) {
    console.error(`Class ${CLASS_NAME} not found`)
    process.exit(1)
  }
  const classId = classes[0].id

  const { data: sequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number')
    .eq('academic_year', academicYear)
  const uuidToSeq = new Map<string, number>()
  const seqToUuid = new Map<number, string>()
  for (const s of sequences || []) {
    uuidToSeq.set(s.id, s.sequence_number)
    seqToUuid.set(s.sequence_number, s.id)
  }

  const expectedDbNames = ac5Group.subjects
    .map((short) => subjectMap[short] || short)
    .filter((name) => !isSubjectExcludedForClass(CLASS_NAME, name))

  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select('subject_id, subjects(id, name)')
    .eq('class_id', classId)

  const subjectByNorm = new Map<string, { id: string; name: string }>()
  for (const row of classSubjects || []) {
    const subj = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
    if (!subj?.id || !subj.name) continue
    const isExpected = expectedDbNames.some((n) => normalize(n) === normalize(subj.name))
    if (!isExpected) continue
    if (!subjectByNorm.has(normalize(subj.name))) {
      subjectByNorm.set(normalize(subj.name), { id: subj.id, name: subj.name })
    }
  }

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .or(`class_id.eq.${classId},class.eq.${classId}`)

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, subject, teacher_id')
    .eq('class_id', classId)

  const { data: allGrades } = await supabase
    .from('grades')
    .select('student_id, marks_obtained, assessment:assessments(title, subject, class_id)')
    .in(
      'student_id',
      (students || []).map((s) => s.id)
    )

  const teacherId =
    assessments?.find((a) => a.teacher_id)?.teacher_id ||
    (
      await supabase.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle()
    ).data?.id

  if (!teacherId) {
    console.error('No teacher/admin id found for assessment creation')
    process.exit(1)
  }

  type SeqMarks = { seq1?: number; seq2?: number }
  const marksByStudentSubject = new Map<string, SeqMarks>()

  for (const g of allGrades || []) {
    const a = g.assessment as { title?: string; subject?: string; class_id?: string } | null
    if (!a?.subject || a.class_id !== classId) continue
    const subjNorm = normalize(a.subject)
    if (!subjectByNorm.has(subjNorm)) continue
    const seq = resolveSeqFromTitle(a.title || '', uuidToSeq)
    if (seq !== 1 && seq !== 2) continue
    const key = `${g.student_id}|${subjNorm}`
    if (!marksByStudentSubject.has(key)) marksByStudentSubject.set(key, {})
    const slot = marksByStudentSubject.get(key)!
    if (seq === 1) slot.seq1 = g.marks_obtained
    else slot.seq2 = g.marks_obtained
  }

  let assessmentsCreated = 0
  let gradesCreated = 0
  let gradesUpdated = 0

  for (const [, subject] of subjectByNorm) {
    for (const seqNum of TARGET_SEQUENCES) {
      const seqName = getSequenceName(seqNum)
      const seqUuid = seqToUuid.get(seqNum)
      const validTitles = [seqName.toLowerCase(), seqUuid?.toLowerCase()].filter(Boolean) as string[]

      let assessment = (assessments || []).find(
        (a) =>
          normalize(a.subject || '') === normalize(subject.name) &&
          validTitles.includes((a.title || '').trim().toLowerCase())
      )

      if (!assessment) {
        console.log(`[assessment] create ${subject.name} — ${seqName}`)
        assessmentsCreated++
        if (APPLY) {
          const { data: created, error } = await supabase
            .from('assessments')
            .insert({
              title: seqUuid || seqName,
              type: 'test',
              subject: subject.name,
              class_id: classId,
              teacher_id: teacherId,
              total_marks: 20,
              status: 'published',
              assessment_date: new Date().toISOString().split('T')[0],
            })
            .select('id, title, subject, teacher_id')
            .single()
          if (error) {
            console.error('  failed:', error.message)
            continue
          }
          assessment = created
          assessments!.push(created)
        } else {
          continue
        }
      }

      if (!assessment) continue

      for (const student of students || []) {
        const key = `${student.id}|${normalize(subject.name)}`
        const term1 = marksByStudentSubject.get(key)
        if (!term1?.seq1 && !term1?.seq2) continue

        let mark: number | undefined
        if (seqNum === 3) mark = term1.seq1
        else if (seqNum === 4) mark = term1.seq2
        else if (seqNum === 5) {
          const parts = [term1.seq1, term1.seq2].filter((m): m is number => typeof m === 'number')
          if (parts.length === 0) continue
          mark = parseFloat((parts.reduce((a, b) => a + b, 0) / parts.length).toFixed(2))
        }
        if (mark === undefined) continue

        const { data: existing } = await supabase
          .from('grades')
          .select('id')
          .eq('assessment_id', assessment.id)
          .eq('student_id', student.id)
          .maybeSingle()

        const pct = (mark / 20) * 100
        const gradeLetter = calculateGrade(mark)
        const payload = {
          marks_obtained: mark,
          percentage: Math.round(pct * 100) / 100,
          grade_letter: gradeLetter,
          remarks: getGradeRemarks(gradeLetter),
        }

        if (existing) {
          gradesUpdated++
          if (APPLY) {
            await supabase.from('grades').update(payload).eq('id', existing.id)
          }
        } else {
          gradesCreated++
          if (APPLY) {
            await supabase.from('grades').insert({
              assessment_id: assessment.id,
              student_id: student.id,
              ...payload,
              submitted_at: new Date().toISOString(),
            })
          }
        }
      }
    }
  }

  console.log(`\n=== AC 5 Term 2/3 bootstrap ${APPLY ? '(APPLIED)' : '(dry-run)'} ===`)
  console.log(`Subjects: ${subjectByNorm.size}, Students: ${students?.length ?? 0}`)
  console.log(`Assessments to create: ${assessmentsCreated}`)
  console.log(`Grades to create: ${gradesCreated}, update: ${gradesUpdated}`)
  if (!APPLY) console.log('\nRe-run with --apply to write changes.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
