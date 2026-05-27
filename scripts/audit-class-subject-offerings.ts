/**
 * Audit class_subjects for excluded or non-curriculum subjects.
 *
 * Run: npx tsx scripts/audit-class-subject-offerings.ts
 * Output: scripts/output/audit-class-subject-offerings.json + .csv
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { isSubjectExcludedForClass } from '../lib/report-card-subject-matching'
import { classGroups, subjectMap } from '../lib/class-curriculum'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ')
}

function requiredDbNamesForGroup(group: (typeof classGroups)[0]): string[] {
  return group.subjects
    .map((shortName) => subjectMap[shortName] || shortName)
    .filter((dbName) => !isSubjectExcludedForClass(group.dbSearchName, dbName))
}

type AuditRow = {
  classId: string
  className: string
  subjectId: string
  subjectName: string
  issueType: 'EXCLUDED_BY_RULE' | 'NOT_IN_CURRICULUM'
  details: string
}

async function main() {
  const issues: AuditRow[] = []
  const groupByDbName = new Map(
    classGroups.map((g) => [normalize(g.dbSearchName), g])
  )

  for (const group of classGroups) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, class_name')
      .ilike('name', group.dbSearchName)

    const cls = classes?.[0]
    if (!cls) {
      console.warn(`Class not found: ${group.dbSearchName}`)
      continue
    }

    const classLabel = cls.class_name || cls.name || group.dbSearchName
    const required = requiredDbNamesForGroup(group)

    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('subject_id, subjects(id, name)')
      .eq('class_id', cls.id)

    for (const row of classSubjects || []) {
      const subj = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
      const name = (subj as { name?: string })?.name
      if (!name) continue

      if (isSubjectExcludedForClass(classLabel, name)) {
        issues.push({
          classId: cls.id,
          className: classLabel,
          subjectId: row.subject_id,
          subjectName: name,
          issueType: 'EXCLUDED_BY_RULE',
          details: `Subject is excluded for ${classLabel} but still linked in class_subjects`,
        })
        continue
      }

      const inCurriculum = required.some((req) => normalize(req) === normalize(name))
      if (!inCurriculum) {
        issues.push({
          classId: cls.id,
          className: classLabel,
          subjectId: row.subject_id,
          subjectName: name,
          issueType: 'NOT_IN_CURRICULUM',
          details: `Not in canonical curriculum for ${group.userClassName}`,
        })
      }
    }
  }

  const { data: allClasses } = await supabase.from('classes').select('id, name, class_name')
  for (const cls of allClasses || []) {
    const label = cls.class_name || cls.name || ''
    const key = normalize(label)
    if (groupByDbName.has(key)) continue

    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('subject_id, subjects(id, name)')
      .eq('class_id', cls.id)

    for (const row of classSubjects || []) {
      const subj = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
      const name = (subj as { name?: string })?.name
      if (!name) continue
      if (isSubjectExcludedForClass(label, name)) {
        issues.push({
          classId: cls.id,
          className: label,
          subjectId: row.subject_id,
          subjectName: name,
          issueType: 'EXCLUDED_BY_RULE',
          details: `Excluded for ${label} (class not in fix_class_subjects groups)`,
        })
      }
    }
  }

  const outDir = path.resolve(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const summary = {
    total: issues.length,
    excludedByRule: issues.filter((i) => i.issueType === 'EXCLUDED_BY_RULE').length,
    notInCurriculum: issues.filter((i) => i.issueType === 'NOT_IN_CURRICULUM').length,
    byClass: issues.reduce<Record<string, number>>((acc, i) => {
      acc[i.className] = (acc[i.className] || 0) + 1
      return acc
    }, {}),
  }

  const jsonPath = path.join(outDir, 'audit-class-subject-offerings.json')
  fs.writeFileSync(jsonPath, JSON.stringify({ summary, issues }, null, 2))

  const csvPath = path.join(outDir, 'audit-class-subject-offerings.csv')
  const header = 'classId,className,subjectId,subjectName,issueType,details'
  const rows = issues.map(
    (i) =>
      `${i.classId},"${i.className.replace(/"/g, '""')}",${i.subjectId},"${i.subjectName.replace(/"/g, '""')}",${i.issueType},"${i.details.replace(/"/g, '""')}"`
  )
  fs.writeFileSync(csvPath, [header, ...rows].join('\n'))

  console.log('--- Class subject offerings audit ---')
  console.log(JSON.stringify(summary, null, 2))
  console.log(`Wrote ${jsonPath}`)
  console.log(`Wrote ${csvPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
