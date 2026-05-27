/**
 * Resolve EPS 1–5 class IDs and verify class_subjects.
 * Run: npx tsx scripts/resolve_eps_classes.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { classGroups, subjectMap } from '../lib/class-curriculum'
import { isSubjectExcludedForClass, subjectNamesMatch } from '../lib/report-card-subject-matching'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const EPS = classGroups.filter((g) => g.userClassName.startsWith('EPS'))

  for (const g of EPS) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, class_name')
      .or(`name.ilike.%${g.dbSearchName}%,class_name.ilike.%${g.dbSearchName}%`)

    const cls = classes?.[0]
    if (!cls) {
      console.log(`MISSING ${g.dbSearchName}`)
      continue
    }

    const { data: cs } = await supabase
      .from('class_subjects')
      .select('subjects(name)')
      .eq('class_id', cls.id)

    const names = (cs ?? [])
      .map((r) => {
        const subj = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
        return (subj as { name?: string })?.name
      })
      .filter((n): n is string => Boolean(n))

    const expected = g.subjects
      .filter((s) => !isSubjectExcludedForClass(g.dbSearchName, subjectMap[s] || s))
      .map((s) => subjectMap[s] || s)

    const missing = expected.filter(
      (e) => !names.some((n) => subjectNamesMatch(n, e))
    )

    console.log(`${g.dbSearchName}`)
    console.log(`  id: ${cls.id}`)
    console.log(`  class_subjects: ${names.length} (expected ${expected.length})`)
    if (missing.length) console.log(`  missing: ${missing.join(' | ')}`)
    console.log('')
  }
}

main()
