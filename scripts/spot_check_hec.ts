/**
 * Spot-check HEC classes: FLEG, FNH, RMHS, Citizenship, PE, Law and Government.
 * Run: npx tsx scripts/spot_check_hec.ts
 */
import * as dotenv from 'dotenv'
import { classGroups } from '../lib/class-curriculum'
import { subjectNamesMatch } from '../lib/report-card-subject-matching'

dotenv.config({ path: '.env.local' })

const BASE = process.env.REPORT_API_BASE || 'http://localhost:3000'
const HEC_GROUPS = classGroups.filter((g) => g.userClassName.startsWith('Hec'))

const TARGET_PATTERNS = [
  'FLEG',
  'Family Life',
  'FNH',
  'Food',
  'RMHS',
  'Resource Management',
  'Citizenship',
  'Physical Education',
  'Law and government',
  'Law and Government',
]

function matchesTarget(name: string): boolean {
  return TARGET_PATTERNS.some((p) => subjectNamesMatch(name, p) || name.toUpperCase().includes(p.toUpperCase().slice(0, 8)))
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let issueCount = 0

  for (const group of HEC_GROUPS) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .or(`name.ilike.%${group.dbSearchName}%,class_name.ilike.%${group.dbSearchName}%`)
    const classId = classes?.[0]?.id
    if (!classId) continue

    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, status')
      .or(`class_id.eq.${classId},class.eq.${classId}`)

    const active = (students ?? []).filter(
      (s) => !s.status || String(s.status).toLowerCase() === 'active'
    )

    console.log(`\n--- ${group.dbSearchName} (${active.length} students) ---`)

    for (const st of active) {
      const url = `${BASE}/api/admin/reports/student-report?studentId=${st.id}&classId=${classId}&academicTermId=annual`
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
      if (!res.ok) continue
      const data = (await res.json()) as {
        subjects?: Record<string, { items?: Record<string, unknown>[] }>
      }
      const items: Record<string, unknown>[] = []
      for (const sec of Object.values(data.subjects || {})) {
        if (sec?.items) items.push(...sec.items)
      }
      for (const item of items) {
        const name = String(item.name ?? '')
        if (!matchesTarget(name)) continue
        const issues: string[] = []
        if (item.total === '-') issues.push('total=-')
        if (typeof item.term2 !== 'number') issues.push('no term2')
        if (typeof item.term3 !== 'number') issues.push('no term3')
        if (issues.length) {
          issueCount++
          console.log(
            `  ${st.first_name} ${st.last_name} | ${name} | eval=${item.eval} | ${issues.join(', ')}`
          )
        }
      }
    }
  }

  console.log(`\nSpot-check done. Issues found: ${issueCount}`)
}

main()
