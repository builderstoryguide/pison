/**
 * Spot-check EPS 1 Industrial Computing & Engineering Drawing on annual report.
 * Run: npx tsx scripts/spot_check_eps1.ts
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const BASE = process.env.REPORT_API_BASE || 'http://localhost:3000'
const CLASS_ID = '65515326-ec10-49a9-a3c5-4d0a15af728c'
const TARGETS = ['INDUSTRIAL COMPUTING', 'ENGINEERING DRAWING', 'TECHNICAL DRAWING']

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('class', CLASS_ID)

  for (const st of students ?? []) {
    const url = `${BASE}/api/admin/reports/student-report?studentId=${st.id}&classId=${CLASS_ID}&academicTermId=annual`
    const res = await fetch(url)
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
      if (!TARGETS.some((t) => name.toUpperCase().includes(t.slice(0, 12)))) continue
      const issues: string[] = []
      if (item.total === '-') issues.push('total=-')
      if (typeof item.term2 !== 'number') issues.push('no term2')
      if (typeof item.term3 !== 'number') issues.push('no term3')
      if (issues.length) {
        console.log(
          `${st.first_name} ${st.last_name} | ${name} | eval=${item.eval} | ${issues.join(', ')}`
        )
      }
    }
  }
  console.log('Spot-check done (only printing rows with issues).')
}

main()
