/**
 * Audit report card mark accuracy across all classes and active students.
 *
 * Run: npx tsx scripts/audit-report-card-marks.ts
 * Output: scripts/output/audit-report-card-marks.json + .csv
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { loadSequenceYearConfig } from '../lib/load-sequence-config-server'
import {
  resolveGlobalSequenceFromTitle,
  parseAcademicTermMode,
} from '../lib/report-card-assessment-resolution'
import { subjectNamesMatch, normalizeSubjectName } from '../lib/report-card-subject-matching'
import { globalToTerm } from '../lib/sequence-term-mapping'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

type Severity = 'CRITICAL' | 'WARNING' | 'INFO'

interface AuditIssue {
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

const TERMS = ['first', 'second', 'third', 'annual'] as const

async function resolveClassId(
  supabase: ReturnType<typeof createClient>,
  studentClass: string
): Promise<string | null> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentClass)
  if (isUUID) return studentClass

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

  const { data: allClasses } = await supabase.from('classes').select('id, name, class_name')
  const normalized = studentClass.trim().toLowerCase()
  const match = allClasses?.find((c) => {
    const label = (c.class_name || c.name || '').trim().toLowerCase()
    return label === normalized
  })
  return match?.id ?? null
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const issues: AuditIssue[] = []

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

  console.log(`Auditing ${classes?.length ?? 0} classes for year ${academicYear}`)
  console.log(`Sequence config: ${seqConfig.totalSequences} sequences`, seqConfig.termSequenceCounts)

  let studentsAudited = 0
  let classesWithStudents = 0

  for (const cls of classes || []) {
    const classId = cls.id
    const className = cls.class_name || cls.name || classId

    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('subject_id, subjects(id, name)')
      .eq('class_id', classId)
      .neq('is_active', false)

    const subjectNames: string[] = (classSubjects ?? [])
      .map((cs) => {
        const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects
        return (subj as { name?: string })?.name
      })
      .filter((name): name is string => Boolean(name))

    const { data: allActiveStudents } = await supabase
      .from('students')
      .select('id, first_name, last_name, class, status')
      .eq('status', 'active')

    const activeStudents: typeof allActiveStudents = []
    for (const s of allActiveStudents || []) {
      const resolved = await resolveClassId(supabase, s.class || '')
      if (resolved === classId) activeStudents.push(s)
    }

    if (activeStudents.length > 0) classesWithStudents++

    for (const student of activeStudents) {
      studentsAudited++
      const studentName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()
      const resolvedClassId = await resolveClassId(supabase, student.class || classId)
      if (!resolvedClassId) {
        issues.push({
          severity: 'CRITICAL',
          classId,
          className,
          studentId: student.id,
          studentName,
          term: 'all',
          subject: '',
          issueType: 'CLASS_RESOLUTION_FAILED',
          details: `Could not resolve class "${student.class}"`,
        })
        continue
      }

      const { data: grades } = await supabase
        .from('grades')
        .select(
          `marks_obtained, assessment:assessments!inner(subject, title, class_id)`
        )
        .eq('student_id', student.id)
        .eq('assessment.class_id', resolvedClassId)

      const assessmentSubjects = new Set<string>()
      let unmappedTitles = 0
      for (const g of grades || []) {
        const a = (g as { assessment?: { subject?: string; title?: string } }).assessment
        if (a?.subject) assessmentSubjects.add(a.subject)
        const title = a?.title || ''
        const globalSeq = resolveGlobalSequenceFromTitle(title, sequenceIdToNumberMap)
        if (globalSeq === null && title) unmappedTitles++
      }

      for (const csName of subjectNames) {
        const hasAssessment = [...assessmentSubjects].some((as) =>
          subjectNamesMatch(as, csName)
        )
        if (!hasAssessment) {
          const hasAnyGrade = (grades || []).some((g) => {
            const a = (g as { assessment?: { subject?: string } }).assessment
            return a?.subject && subjectNamesMatch(a.subject, csName)
          })
          issues.push({
            severity: hasAnyGrade ? 'WARNING' : 'INFO',
            classId,
            className,
            studentId: student.id,
            studentName,
            term: 'all',
            subject: csName,
            issueType: 'NO_ASSESSMENT_FOR_CLASS_SUBJECT',
            details: hasAnyGrade
              ? 'Grades exist but subject name may not match class_subjects'
              : 'No grades entered for this class subject',
          })
        }
      }

      if (unmappedTitles > 0) {
        issues.push({
          severity: 'WARNING',
          classId,
          className,
          studentId: student.id,
          studentName,
          term: 'all',
          subject: '',
          issueType: 'UNMAPPED_ASSESSMENT_TITLES',
          details: `${unmappedTitles} grade(s) with titles that do not resolve to a sequence`,
        })
      }

      for (const term of TERMS) {
        const termMode = parseAcademicTermMode(term)
        const termGrades = (grades || []).filter((g) => {
          const a = (g as { assessment?: { title?: string; term?: string } }).assessment
          const title = a?.title || ''
          const globalSeq = resolveGlobalSequenceFromTitle(title, sequenceIdToNumberMap)
          if (globalSeq === null) return termMode.mode === 'annual'
          const mapped = globalToTerm(globalSeq, seqConfig.termSequenceCounts)
          if (termMode.mode === 'annual') return true
          return mapped?.termNumber === termMode.term
        })

        const subjectsWithGrades = new Set<string>()
        for (const g of termGrades) {
          const subj = (g as { assessment?: { subject?: string } }).assessment?.subject
          if (subj) subjectsWithGrades.add(normalizeSubjectName(subj))
        }

        for (const csName of subjectNames) {
          const norm = normalizeSubjectName(csName)
          const hasGrade = [...subjectsWithGrades].some((sg) => subjectNamesMatch(sg, norm))
          if (!hasGrade && term !== 'annual') {
            issues.push({
              severity: 'INFO',
              classId,
              className,
              studentId: student.id,
              studentName,
              term,
              subject: csName,
              issueType: 'MISSING_TERM_MARKS',
              details: `No grades mapped to ${term} for this subject`,
            })
          }
        }
      }
    }
  }

  const outDir = path.resolve(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const jsonPath = path.join(outDir, 'audit-report-card-marks.json')
  fs.writeFileSync(jsonPath, JSON.stringify({ academicYear, issues, summary: summarize(issues) }, null, 2))

  const csvPath = path.join(outDir, 'audit-report-card-marks.csv')
  const header = 'severity,classId,className,studentId,studentName,term,subject,issueType,details'
  const rows = issues.map(
    (i) =>
      `${i.severity},${i.classId},"${i.className}",${i.studentId},"${i.studentName}",${i.term},"${i.subject}",${i.issueType},"${i.details.replace(/"/g, '""')}"`
  )
  fs.writeFileSync(csvPath, [header, ...rows].join('\n'))

  console.log('\n--- Audit complete ---')
  console.log(`Students audited: ${studentsAudited} across ${classesWithStudents} classes`)
  console.log(JSON.stringify(summarize(issues), null, 2))
  console.log(`Wrote ${jsonPath}`)
  console.log(`Wrote ${csvPath}`)

  const critical = issues.filter((i) => i.severity === 'CRITICAL').length
  if (critical > 0) process.exit(1)
}

function summarize(issues: AuditIssue[]) {
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
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
