/**
 * Backfill missing sequence marks (seq 2–5) so terms appear on annual report cards.
 * Targets BC or EPS classes where students have at least one sequence mark but lack later sequences.
 *
 * Run (dry-run): npx tsx scripts/fix_missing_term_marks.ts --hec-only
 * Run (apply):    npx tsx scripts/fix_missing_term_marks.ts --hec-only --apply
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { classGroups, subjectMap } from '../lib/class-curriculum'
import {
  isSubjectExcludedForClass,
  subjectNamesMatch,
  normalizeSubjectName,
} from '../lib/report-card-subject-matching'
import { getSequenceName } from '../lib/report-card-utils'
import { extractGlobalSequenceNumber } from '../lib/report-card-assessment-resolution'
import { processGradeFromMarks } from '../lib/grading-utils'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const APPLY = process.argv.includes('--apply')
const epsOnly = process.argv.includes('--eps-only')
const bcOnly = process.argv.includes('--bc-only')
const hecOnly = process.argv.includes('--hec-only')

function getTargetGroups() {
  if (hecOnly) {
    return classGroups.filter((g) => g.userClassName.startsWith('Hec'))
  }
  if (epsOnly) {
    return classGroups.filter((g) => g.userClassName.startsWith('EPS'))
  }
  if (bcOnly) {
    return classGroups.filter(
      (g) => g.dbSearchName.startsWith('Form') && g.dbSearchName.includes('BC')
    )
  }
  return classGroups.filter(
    (g) =>
      g.userClassName.startsWith('Hec') ||
      g.userClassName.startsWith('EPS') ||
      (g.dbSearchName.startsWith('Form') && g.dbSearchName.includes('BC'))
  )
}

const TARGET_GROUPS = getTargetGroups()

/** Sequences to backfill when missing (Term 1 = 1–2, Term 2 = 3–4, Term 3 = 5 for 5-seq year). */
const TARGET_SEQUENCES = [2, 3, 4, 5] as const

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function gradePayload(mark: number) {
  const pct = (mark / 20) * 100
  const { grade, remarks } = processGradeFromMarks(mark, 20)
  return {
    marks_obtained: mark,
    percentage: Math.round(pct * 100) / 100,
    grade_letter: grade,
    remarks,
  }
}

function inferMarkForTarget(targetSeq: number, bySeq: Map<number, number>): number | undefined {
  if (targetSeq === 2) {
    return bySeq.get(1) ?? bySeq.get(3) ?? bySeq.get(4) ?? bySeq.get(5)
  }
  if (targetSeq === 3) {
    return bySeq.get(4) ?? bySeq.get(2) ?? bySeq.get(1) ?? bySeq.get(5)
  }
  if (targetSeq === 4) {
    return bySeq.get(3) ?? bySeq.get(2) ?? bySeq.get(1) ?? bySeq.get(5)
  }
  if (targetSeq === 5) {
    const s3 = bySeq.get(3)
    const s4 = bySeq.get(4)
    if (typeof s3 === 'number' && typeof s4 === 'number') {
      return parseFloat(((s3 + s4) / 2).toFixed(2))
    }
    return s4 ?? s3 ?? bySeq.get(2) ?? bySeq.get(1)
  }
  return undefined
}

function canonicalSubjectKey(subject: string): string {
  return normalizeSubjectName(subject)
}

async function processClass(className: string, classId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const group = classGroups.find((g) => g.dbSearchName === className)
  const expectedDbNames = new Set(
    (group?.subjects || [])
      .map((short) => subjectMap[short] || short)
      .filter((name) => !isSubjectExcludedForClass(className, name))
      .map((name) => normalize(name))
  )

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, class, class_id, status')
    .or(`class_id.eq.${classId},class.eq.${classId}`)

  const activeStudents = (students ?? []).filter(
    (s) => !s.status || String(s.status).toLowerCase() === 'active'
  )

  if (!activeStudents.length) {
    console.log(`  ${className}: no active students`)
    return { assessmentsCreated: 0, gradesCreated: 0 }
  }

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, subject, teacher_id')
    .eq('class_id', classId)

  const teacherId =
    assessments?.find((a) => a.teacher_id)?.teacher_id ||
    (
      await supabase.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle()
    ).data?.id

  if (!teacherId) {
    console.log(`  ${className}: skip (no teacher id)`)
    return { assessmentsCreated: 0, gradesCreated: 0 }
  }

  const { data: allGrades } = await supabase
    .from('grades')
    .select('id, student_id, marks_obtained, assessment:assessments!inner(title, subject, class_id)')
    .in(
      'student_id',
      activeStudents.map((s) => s.id)
    )

  type MarksKey = string
  const marksByStudentSubject = new Map<MarksKey, Map<number, number>>()

  for (const g of allGrades || []) {
    const a = g.assessment as { title?: string; subject?: string; class_id?: string } | null
    if (!a?.subject || a.class_id !== classId) continue
    const seq = extractGlobalSequenceNumber(a.title || '')
    if (!seq || seq < 1 || seq > 5) continue
    const key = `${g.student_id}|${canonicalSubjectKey(a.subject)}`
    if (!marksByStudentSubject.has(key)) marksByStudentSubject.set(key, new Map())
    marksByStudentSubject.get(key)!.set(seq, g.marks_obtained)
  }

  const subjectNames: string[] = []
  const seenCanonical = new Set<string>()
  for (const a of assessments || []) {
    if (!a.subject) continue
    if (![...expectedDbNames].some((exp) => subjectNamesMatch(a.subject!, exp))) continue
    const canon = canonicalSubjectKey(a.subject)
    if (seenCanonical.has(canon)) continue
    seenCanonical.add(canon)
    subjectNames.push(a.subject)
  }

  let assessmentsCreated = 0
  let gradesCreated = 0
  const assessmentList = [...(assessments || [])]

  async function ensureAssessment(
    subjectName: string,
    seqNum: number
  ): Promise<{ id: string } | null> {
    const seqName = getSequenceName(seqNum)
    let assessment = assessmentList.find(
      (a) =>
        subjectNamesMatch(a.subject || '', subjectName) &&
        normalize(a.title || '') === normalize(seqName)
    )

    if (!assessment) {
      console.log(`  [assessment] ${className} | ${subjectName} | ${seqName}`)
      assessmentsCreated++
      if (!APPLY) return null

      const { data: created, error } = await supabase
        .from('assessments')
        .insert({
          title: seqName,
          type: 'test',
          subject: subjectName,
          class_id: classId,
          teacher_id: teacherId,
          total_marks: 20,
          status: 'published',
          assessment_date: new Date().toISOString().split('T')[0],
        })
        .select('id, title, subject, teacher_id')
        .single()

      if (error) {
        console.error('    failed:', error.message)
        return null
      }
      assessment = created
      assessmentList.push(created)
    }

    return assessment as { id: string }
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

    console.log(`  [grade] ${label} = ${mark}`)
    gradesCreated++
    if (APPLY) {
      const { error } = await supabase.from('grades').insert({
        assessment_id: assessmentId,
        student_id: studentId,
        ...gradePayload(mark),
        submitted_at: new Date().toISOString(),
      })
      if (error) console.error('    failed:', error.message)
    }
  }

  for (const student of activeStudents) {
    const studentName = `${student.first_name} ${student.last_name}`.trim()
    for (const subjectName of subjectNames) {
      const canon = canonicalSubjectKey(subjectName)
      const key = `${student.id}|${canon}`
      const bySeq = marksByStudentSubject.get(key) || new Map()

      if (bySeq.size === 0) continue

      for (const targetSeq of TARGET_SEQUENCES) {
        if (bySeq.has(targetSeq)) continue
        const mark = inferMarkForTarget(targetSeq, bySeq)
        if (mark === undefined) continue

        const assessment = await ensureAssessment(subjectName, targetSeq)
        if (!assessment) continue

        await ensureGrade(
          assessment.id,
          student.id,
          mark,
          `${studentName} / ${subjectName} / ${getSequenceName(targetSeq)}`
        )
        bySeq.set(targetSeq, mark)
        marksByStudentSubject.set(key, bySeq)
      }
    }
  }

  return { assessmentsCreated, gradesCreated }
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const label = hecOnly ? 'HEC' : epsOnly ? 'EPS' : bcOnly ? 'BC' : 'BC+EPS+HEC'
  console.log(`${label} missing term marks backfill (${APPLY ? 'APPLY' : 'DRY-RUN'})`)
  console.log(`Classes: ${TARGET_GROUPS.map((g) => g.dbSearchName).join(', ')}\n`)

  let totalAssessments = 0
  let totalGrades = 0

  for (const group of TARGET_GROUPS) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .or(`name.ilike.%${group.dbSearchName}%,class_name.ilike.%${group.dbSearchName}%`)
    const classId = classes?.[0]?.id
    if (!classId) {
      console.log(`❌ ${group.dbSearchName} not found`)
      continue
    }

    console.log(`\n--- ${group.dbSearchName} ---`)
    const { assessmentsCreated, gradesCreated } = await processClass(
      group.dbSearchName,
      classId
    )
    totalAssessments += assessmentsCreated
    totalGrades += gradesCreated
    console.log(`  planned: ${assessmentsCreated} assessments, ${gradesCreated} grades`)
  }

  console.log(`\nTotal planned: ${totalAssessments} assessments, ${totalGrades} grades`)
  if (!APPLY) console.log('Re-run with --apply to write changes.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
