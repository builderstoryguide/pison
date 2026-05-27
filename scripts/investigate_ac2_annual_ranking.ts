/**
 * AC 2 annual ranking investigation — compares display-scale cohort avg vs legacy raw-pooled avg.
 * Run: npx tsx scripts/investigate_ac2_annual_ranking.ts
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import {
  DEFAULT_TERM_COUNTS,
  type TermSequenceCounts,
} from '../lib/sequence-term-mapping'
import { getTermFromAssessment } from '../lib/report-card-assessment-resolution'
import { normalizeSubjectName, isSubjectExcludedForClass } from '../lib/report-card-subject-matching'
import {
  buildCohortRankingMetrics,
  buildCohortRawPooledMetrics,
  rankCohortByMetrics,
  type StudentGradeRow,
  type StudentBranchGradeRow,
} from '../lib/report-card-class-ranking'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const CLASS_NAME = 'AC 2'

function studentName(s: {
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
}): string {
  return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')
}

async function main() {
  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    className: CLASS_NAME,
  }

  const { data: appCfg } = await supabase
    .from('app_configuration')
    .select('academic_year')
    .maybeSingle()
  const academicYear = appCfg?.academic_year || '2024-2025'
  report.academicYear = academicYear

  const { data: seqConfigRow } = await supabase
    .from('sequence_configurations')
    .select('total_sequences, term_sequence_counts')
    .eq('academic_year', academicYear)
    .maybeSingle()

  let termCounts: TermSequenceCounts = { ...DEFAULT_TERM_COUNTS }
  let totalSequences: 5 | 6 = 6
  if (seqConfigRow) {
    totalSequences = (seqConfigRow.total_sequences ?? 6) as 5 | 6
    const raw = seqConfigRow.term_sequence_counts as Partial<Record<string, number>> | null
    if (raw) {
      termCounts = {
        'Term 1': raw['Term 1'] ?? 2,
        'Term 2': raw['Term 2'] ?? 2,
        'Term 3': raw['Term 3'] ?? 2,
      }
    }
  }

  const { data: academicSequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number, term, is_active')
    .eq('academic_year', academicYear)

  const sequenceIdToNumberMap = new Map<string, number>()
  for (const s of academicSequences || []) {
    if (s.is_active !== false) {
      sequenceIdToNumberMap.set(s.id, s.sequence_number)
    }
  }

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .ilike('name', CLASS_NAME)

  if (!classes?.length) {
    console.error(`Class "${CLASS_NAME}" not found`)
    process.exit(1)
  }

  const classId = classes[0].id
  const classLabel = String(classes[0].class_name || classes[0].name || CLASS_NAME)
  report.classId = classId

  const classKeys = Array.from(
    new Set(
      [classId, classes[0].name, classes[0].class_name]
        .filter((v): v is string => Boolean(v && String(v).trim()))
        .map((v) => String(v).trim())
    )
  )

  const studentBuckets: Array<{ id: string }[]> = []
  for (const key of classKeys) {
    const { data } = await supabase.from('students').select('id').eq('class', key)
    studentBuckets.push(data || [])
  }
  const studentIds = [...new Map(studentBuckets.flat().map((s) => [s.id, s])).keys()]

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, middle_name, last_name')
    .in('id', studentIds)

  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select(`
      subject_id,
      subjects!inner ( id, name, coefficient, has_sub_branches, is_active )
    `)
    .eq('class_id', classId)

  const subjects = (classSubjects || [])
    .map((cs) => {
      const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects
      return subj as { id: string; name: string; coefficient: number; has_sub_branches?: boolean }
    })
    .filter((s) => s?.id && !isSubjectExcludedForClass(classLabel, s.name))

  const { data: subBranches } = await supabase
    .from('subject_sub_branches')
    .select('id, subject_id')
    .in(
      'subject_id',
      subjects.map((s) => s.id)
    )

  const { data: subjectBranchesNew } = await supabase
    .from('subject_branches')
    .select('id, subject_id')
    .in(
      'subject_id',
      subjects.map((s) => s.id)
    )

  const branchIdsBySubjectId = new Map<string, string[]>()
  const rankingSubjects = subjects.map((subject) => {
    const branchesOld = (subBranches || []).filter((b) => b.subject_id === subject.id)
    const branchesNew = (subjectBranchesNew || []).filter((b) => b.subject_id === subject.id)
    const branchIds = [...branchesOld.map((b) => b.id), ...branchesNew.map((b) => b.id)]
    if (branchIds.length) branchIdsBySubjectId.set(subject.id, branchIds)
    return {
      id: subject.id,
      name: subject.name,
      coefficient: subject.coefficient || 1,
      hasSubBranches:
        Boolean(subject.has_sub_branches) || branchesOld.length > 0 || branchesNew.length > 0,
    }
  })

  const { data: allGrades } = await supabase
    .from('grades')
    .select(`
      marks_obtained,
      student_id,
      assessment:assessments!inner ( subject, title, class_id )
    `)
    .in('student_id', studentIds)
    .eq('assessment.class_id', classId)

  const { data: allBranchGrades } = await supabase
    .from('branch_grades')
    .select(`
      marks_obtained,
      student_id,
      branch_id,
      assessment:branch_assessments!inner ( title, term, class_id )
    `)
    .in('student_id', studentIds)
    .eq('assessment.class_id', classId)

  const gradesByStudentId = new Map<string, StudentGradeRow[]>()
  for (const g of allGrades || []) {
    const sid = g.student_id as string
    const a = g.assessment as { subject?: string; title?: string }
    if (!gradesByStudentId.has(sid)) gradesByStudentId.set(sid, [])
    gradesByStudentId.get(sid)!.push({
      marks_obtained: g.marks_obtained as number,
      title: a?.title || '',
      subject: a?.subject || '',
      term: null,
    })
  }

  const branchGradesByStudentId = new Map<string, StudentBranchGradeRow[]>()
  const branchIdToSubjectId = new Map<string, string>()
  const subjectIdToName = new Map<string, string>()
  for (const s of subjects) {
    subjectIdToName.set(s.id, s.name)
  }
  for (const b of subBranches || []) {
    branchIdToSubjectId.set(b.id, b.subject_id)
  }
  for (const b of subjectBranchesNew || []) {
    branchIdToSubjectId.set(b.id, b.subject_id)
  }

  for (const bg of allBranchGrades || []) {
    const sid = bg.student_id as string
    const a = bg.assessment as { title?: string; term?: string }
    if (!branchGradesByStudentId.has(sid)) branchGradesByStudentId.set(sid, [])
    branchGradesByStudentId.get(sid)!.push({
      marks_obtained: bg.marks_obtained as number,
      branch_id: bg.branch_id as string,
      title: a?.title || '',
      term: a?.term ?? null,
    })
  }

  const includeAllTermsGrades = true
  const gradeIncluded = () => true
  const gradeBelongsToTerm = (
    term: 1 | 2 | 3,
    assessmentTerm: string | null | undefined,
    assessmentTitle: string | null | undefined,
    assessmentSubject: string | null | undefined
  ): boolean => {
    const resolved = getTermFromAssessment(
      assessmentTitle ?? null,
      assessmentTerm ?? null,
      sequenceIdToNumberMap,
      termCounts
    )
    if (resolved !== null) return resolved === term
    if (assessmentTerm) {
      const normalizedDb = assessmentTerm.toLowerCase()
      if (term === 1 && (normalizedDb.includes('1st') || normalizedDb.includes('first'))) return true
      if (term === 2 && (normalizedDb.includes('2nd') || normalizedDb.includes('second'))) return true
      if (term === 3 && (normalizedDb.includes('3rd') || normalizedDb.includes('third'))) return true
    }
    const subj = assessmentSubject ? normalizeSubjectName(assessmentSubject) : ''
    if (subj.includes('office practice')) return true
    return false
  }

  const cohortBase = {
    studentIds,
    subjects: rankingSubjects,
    gradesByStudentId,
    branchGradesByStudentId,
    branchIdsBySubjectId,
    yearSummary: true,
    activeTerm: null as 1 | 2 | 3 | null,
    sequenceIdToNumberMap,
    termSequenceCounts: termCounts,
    totalSequences,
    gradeIncluded,
    gradeBelongsToTerm,
    includeAllTermsGrades,
    academicTermId: 'annual',
  }

  const cohortMetrics = buildCohortRankingMetrics({ ...cohortBase, scope: 'annual' })
  const rawPooled = buildCohortRawPooledMetrics({
    studentIds,
    subjects: rankingSubjects,
    gradesByStudentId,
    branchGradesByStudentId,
    branchIdToSubjectId,
    subjectIdToName,
    gradeIncluded,
  })
  const rankMap = rankCohortByMetrics(cohortMetrics)

  const rows = (students || []).map((s) => {
    const cohort = cohortMetrics.get(s.id)
    const raw = rawPooled.get(s.id)
    return {
      id: s.id,
      name: studentName(s),
      displayAvg: cohort?.weightedAvg ?? 0,
      rawPooledAvg: raw?.weightedAvg ?? 0,
      avgDelta: cohort && raw ? Math.abs(cohort.weightedAvg - raw.weightedAvg) : 0,
      rank: rankMap.get(s.id) ?? 0,
      hasMarks: cohort?.hasMarks ?? false,
    }
  })

  rows.sort((a, b) => b.displayAvg - a.displayAvg)

  const mismatches = rows.filter((r) => r.avgDelta > 0.01)
  const rank1Students = rows.filter((r) => r.rank === 1 && r.hasMarks)
  const duplicateRank1 =
    rank1Students.length > 1 &&
    rank1Students.some((a, i) =>
      rank1Students.slice(i + 1).some((b) => Math.abs(a.displayAvg - b.displayAvg) > 0.001)
    )

  report.summary = {
    studentCount: rows.length,
    mismatchesDisplayVsRaw: mismatches.length,
    rank1Count: rank1Students.length,
    duplicateRank1WithDifferentAvg: duplicateRank1,
    rank1Students: rank1Students.map((r) => ({
      name: r.name,
      displayAvg: r.displayAvg,
      rawPooledAvg: r.rawPooledAvg,
    })),
  }
  report.students = rows
  report.mismatches = mismatches

  const outDir = path.resolve(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'investigate-ac2-annual-ranking.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  console.log('AC2 annual ranking investigation')
  console.log(JSON.stringify(report.summary, null, 2))
  console.log(`Written: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
