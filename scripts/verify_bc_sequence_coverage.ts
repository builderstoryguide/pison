/**
 * Per BC class: assessment + grade coverage for sequences 1–5.
 * Run: npx tsx scripts/verify_bc_sequence_coverage.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { getSequenceName } from '../lib/report-card-utils'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const BC_CLASSES = [
  'Form 1 BC',
  'Form 2 BC',
  'Form 3 BC',
  'Form 4 BC',
  'Form 5 BC',
]

const SEQ_NUMS = [1, 2, 3, 4, 5] as const

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  for (const className of BC_CLASSES) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .ilike('name', className)
    const classId = classes?.[0]?.id
    if (!classId) {
      console.log(`\n❌ ${className} not found`)
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
          .ilike('subject', `%${subjectName.slice(0, 20)}%`)

        let gradeCount = 0
        if (assessments?.length) {
          for (const a of assessments) {
            const { count } = await supabase
              .from('grades')
              .select('*', { count: 'exact', head: true })
              .eq('assessment_id', a.id)
            gradeCount += count ?? 0
          }
        }

        if (!assessments?.length || gradeCount === 0) {
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
