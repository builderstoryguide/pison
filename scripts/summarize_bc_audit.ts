import * as fs from 'fs'
import * as path from 'path'

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'output/bc-report-card-terms-audit.json'), 'utf8')
)

let noTerms = 0
const partialByClass: Record<string, Record<string, number>> = {}

for (const r of data.results) {
  if (r.term !== 'annual') continue
  if (!partialByClass[r.className]) partialByClass[r.className] = {}
  for (const s of r.subjects) {
    const hasEval = typeof s.eval === 'number'
    const t1 = typeof s.term1 === 'number'
    const t2 = typeof s.term2 === 'number'
    const t3 = typeof s.term3 === 'number'
    if (hasEval && !t1 && !t2 && !t3) {
      noTerms++
      console.log('NO_TERMS', r.className, s.name, s.eval)
    }
    if (hasEval && !(t1 && t2 && t3)) {
      const key = s.name.slice(0, 40)
      partialByClass[r.className][key] = (partialByClass[r.className][key] || 0) + 1
    }
  }
}

console.log('\nnoTermsWithEval:', noTerms)
console.log('\nPartial annual (missing some term) frequency by class/subject:')
for (const [cls, subs] of Object.entries(partialByClass)) {
  const top = Object.entries(subs).sort((a, b) => b[1] - a[1]).slice(0, 8)
  console.log(cls, top.map(([n, c]) => `${n}(${c})`).join(', '))
}
