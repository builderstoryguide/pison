import * as fs from 'fs'
import * as path from 'path'

const auditPath = path.join(__dirname, 'output/hec-report-card-terms-audit.json')
if (!fs.existsSync(auditPath)) {
  console.error(`Missing ${auditPath} — run audit_hec_report_card_terms.ts first`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(auditPath, 'utf8'))

let noTerms = 0
let missingTotal = 0
const partialByClass: Record<string, Record<string, number>> = {}
const bucketByClass: Record<string, Record<string, number>> = {}

for (const r of data.results) {
  if (r.term !== 'annual') continue
  if (!partialByClass[r.className]) partialByClass[r.className] = {}
  if (!bucketByClass[r.className]) {
    bucketByClass[r.className] = { A: 0, B: 0, C: 0, OK: 0 }
  }

  for (const s of r.subjects) {
    bucketByClass[r.className][s.bucket] = (bucketByClass[r.className][s.bucket] || 0) + 1

    const hasEval = typeof s.eval === 'number'
    const t1 = typeof s.term1 === 'number'
    const t2 = typeof s.term2 === 'number'
    const t3 = typeof s.term3 === 'number'
    const hasTotal = typeof s.total === 'number'

    if (hasEval && !t1 && !t2 && !t3) {
      noTerms++
      console.log('NO_TERMS', r.className, r.studentName, s.name, s.eval)
    }
    if (hasEval && !hasTotal) {
      missingTotal++
    }
    if (hasEval && !(t1 && t2 && t3)) {
      const key = s.name.slice(0, 40)
      partialByClass[r.className][key] = (partialByClass[r.className][key] || 0) + 1
    }
  }
}

console.log('\nnoTermsWithEval:', noTerms)
console.log('hasEvalButNoNumericTotal:', missingTotal)
console.log('\nBucket counts by class:')
for (const [cls, counts] of Object.entries(bucketByClass)) {
  console.log(`  ${cls}: A=${counts.A} B=${counts.B} C=${counts.C} OK=${counts.OK}`)
}
console.log('\nPartial annual (missing some term) frequency by class/subject:')
for (const [cls, subs] of Object.entries(partialByClass)) {
  const top = Object.entries(subs).sort((a, b) => b[1] - a[1]).slice(0, 12)
  console.log(cls, top.map(([n, c]) => `${n}(${c})`).join(', '))
}
