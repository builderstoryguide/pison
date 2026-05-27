/**
 * Per EPS class: assessment + grade coverage for sequences 1–5.
 * Run: npx tsx scripts/verify_eps_sequence_coverage.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { classGroups } from '../lib/class-curriculum'
import { subjectNamesMatch } from '../lib/report-card-subject-matching'
import { getSequenceName } from '../lib/report-card-utils'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const EPS_GROUPS = classGroups.filter((g) => g.userClassName.startsWith('EPS'))
const SEQ_NUMS = [1, 2, 3, 4, 5] as const

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  for (const group of EPS_GROUPS) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .or(`name.ilike.%${group.dbSearchName}%,class_name.ilike.%${group.dbSearchName}%`)
    const classId = classes?.[0]?.id
    const className = classes?.[0]?.name ?? group.dbSearchName
    if (!classId) {
      console.log(`\n❌ ${group.dbSearchName} not found`)
      continue
    }

    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('subjects(name)')
      .eq('class_id', classId)

    const subjects = (classSubjects ?? [])
      .map((cs) => {
        const s = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects
        return (s as { name?: string })?.name?.trim()
      })
      .filter((n): n is string => Boolean(n))
      .sort()

    console.log(`\n${'='.repeat(70)}`)
    console.log(`${className} (${classId}) — ${subjects.length} subjects`)
    console.log(`${'='.repeat(70)}`)

    for (const subjectName of subjects) {
      const gaps: string[] = []
      for (const seq of SEQ_NUMS) {
        const title = getSequenceName(seq)
        const { data: assessments } = await supabase
          .from('assessments')
          .select('id, title, subject')
          .eq('class_id', classId)
          .eq('title', title)

        const matching = (assessments ?? []).filter((a) =>
          subjectNamesMatch(a.subject || '', subjectName)
        )

        let gradeCount = 0
        for (const a of matching) {
          const { count } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', a.id)
          gradeCount += count ?? 0
        }

        if (matching.length === 0 || gradeCount === 0) {
          gaps.push(`S${seq}`)
        }
      }
      if (gaps.length > 0) {
        console.log(`  ${subjectName.slice(0, 50).padEnd(50)} missing: ${gaps.join(', ')}`)
      }
    }
  }
}

main()
