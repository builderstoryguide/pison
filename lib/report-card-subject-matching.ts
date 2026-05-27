/**
 * Subject name normalization and matching for report cards.
 */

export const SUBJECT_ALIASES: Record<string, string[]> = {
  'building construction': ['bc', 'b.c.', 'b.c', 'buildingconstruction', 'construction'],
  'physical education': ['eps', 'e.p.s.', 'e.p.s', 'pe', 'p.e.', 'p.e', 'physicaleducation', 'sport'],
  accounting: ['ac', 'a.c.', 'a.c', 'accountancy', 'accounts'],
  'home economics': ['hec', 'h.e.c.', 'h.e.c', 'homeeconomics', 'home ec', 'homeec'],
  'office practice': ['op', 'o.p.', 'o.p', 'officepractice', 'office prac', 'off practice'],
  mathematics: ['math', 'maths', 'general mathematics', 'general math', 'gen math'],
  'business mathematics': [
    'business math',
    'biz math',
    'business maths',
    'bm',
    'b.m.',
    'commercial math',
    'commercial mathematics',
  ],
  'resource management': [
    'resource management on home studies (rmhs)',
    'resource management on home studies',
    'rmhs',
    'r.m.h.s.',
    'r.m.h.s',
  ],
  'family life': [
    'family life education and gerontology (fleg)',
    'family life education and gerontology',
    'fleg',
    'f.l.e.g.',
    'f.l.e.g',
  ],
  'food and nutrition': [
    'food, nutrition and health (fnh)',
    'food nutrition and health (fnh)',
    'food, nutrition and health',
    'food nutrition and health',
    'fnh',
    'f.n.h.',
    'f.n.h',
  ],
  'law and government': [
    'law and government (lg)',
    'law and government',
    'lg',
  ],
  'natural science': ['natural science', 'natural sciences'],
  'construction process and building practice': [
    'cpb',
    'construction process',
    'building practice',
    'construction process and building practice (cpb)',
  ],
  'building construction drawing': [
    'bcd',
    'drawing',
    'building drawing',
    'building construction drawing (bcd)',
  ],
  'survey, soil mechanics and material': [
    'sms',
    'soil survey material',
    'soil survey',
    'survey soil mechanics and material',
    'survey, soil mechanics and material ( sms)',
  ],
  'quality hygine and safty environment': [
    'qhse',
    'health and safety',
    'quality hygiene and safety environment',
    'quality hygine and safty environment',
  ],
  'engineering science': [
    'engineering science',
    'eng science',
    'engineering science (?)',
  ],
  'engineering drawing': [
    'engineering drawing',
    'eng drawing',
    'engineering drawing (?)',
    'technical drawing',
  ],
  'electrical technology': [
    'electrical technology',
    'etd',
    'electrical technology and diagrams',
    'electrical technology and diagrams (etd)',
  ],
  'electrical and electronic circuit': [
    'electrical circuit',
    'electronic circuit',
    'eec',
    'electrical and electronic circuit',
    'electrical and electronic circuit (eec)',
  ],
  'electrical machines': [
    'electric machine',
    'electrical machines',
    'em',
    'electrical machines (em)',
  ],
  'industrial computing': [
    'industrial computing',
    'ic',
    'industrial computing (?)',
  ],
}

export function normalizeClassName(name: string | null | undefined): string {
  if (!name) return ''
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function normalizeSubjectName(name: string | null | undefined): string {
  if (!name) return ''
  const trimmed = name.trim().toLowerCase()

  for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
    if (trimmed === canonical || aliases.includes(trimmed)) {
      return canonical
    }
  }

  return trimmed
}

export function getSubjectVariations(name: string): string[] {
  const normalized = normalizeSubjectName(name)
  const variations = [normalized]

  for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
    if (normalized === canonical || aliases.includes(normalized)) {
      variations.push(canonical)
      variations.push(...aliases)
    }
  }

  if (SUBJECT_ALIASES[normalized]) {
    variations.push(...SUBJECT_ALIASES[normalized])
  }

  return [...new Set(variations)]
}

export function subjectNamesMatch(
  name1: string | null | undefined,
  name2: string | null | undefined
): boolean {
  if (!name1 || !name2) return false

  const norm1 = normalizeSubjectName(name1)
  const norm2 = normalizeSubjectName(name2)

  if (norm1 === norm2) return true

  const variations1 = getSubjectVariations(name1)
  const variations2 = getSubjectVariations(name2)

  if (variations1.some((v1) => variations2.includes(v1))) return true

  const removeCommonWords = (str: string): string => {
    const commonWords = ['the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'a', 'an']
    return str
      .split(' ')
      .filter((word) => !commonWords.includes(word))
      .join(' ')
      .trim()
  }

  const cleaned1 = removeCommonWords(norm1)
  const cleaned2 = removeCommonWords(norm2)

  const words1 = cleaned1.split(' ').filter((w) => w.length > 2)
  const words2 = cleaned2.split(' ').filter((w) => w.length > 2)

  if (words1.length === 1 && words2.length === 1) {
    return words1[0] === words2[0]
  }

  if ((words1.length === 1 && words2.length > 1) || (words1.length > 1 && words2.length === 1)) {
    return false
  }

  if (words1.length > 1 && words2.length > 1) {
    const matchingWords = words1.filter((w1) => words2.some((w2) => w1 === w2))
    if (matchingWords.length >= 2) return true
    const allWords1Match = words1.every((w1) => words2.includes(w1))
    const allWords2Match = words2.every((w2) => words1.includes(w2))
    if (allWords1Match || allWords2Match) return true
  }

  return false
}

export function isSubjectExcludedForClass(
  className: string | null | undefined,
  subjectName: string | null | undefined
): boolean {
  const normalizedClass = normalizeClassName(className)
  if (!normalizedClass || !subjectName) {
    return false
  }

  const ac1Ac2Excluded = ['entrepreneurship', 'computer science']
  const ac4Excluded = ['introduction to marketing', 'computer science']
  const hec1Hec2Excluded = ['computer science']
  const hec3Hec4Excluded = ['introduction to marketing', 'office practice', 'computer science']
  const bcExcluded = ['industrial computing']
  const isSubjectInRule = (ruleSubjects: string[]) =>
    ruleSubjects.some((ruleSubject) => subjectNamesMatch(subjectName, ruleSubject))

  if (normalizedClass === 'AC1' || normalizedClass === 'AC2') {
    return isSubjectInRule(ac1Ac2Excluded)
  }
  if (normalizedClass === 'AC4') {
    return isSubjectInRule(ac4Excluded)
  }
  if (normalizedClass === 'HEC1' || normalizedClass === 'HEC2') {
    return isSubjectInRule(hec1Hec2Excluded)
  }
  if (normalizedClass === 'HEC3' || normalizedClass === 'HEC4') {
    return isSubjectInRule(hec3Hec4Excluded)
  }
  if (isBcClass(normalizedClass)) {
    return isSubjectInRule(bcExcluded)
  }

  return false
}

/** Matches BC1–BC5 and FORM1BC–FORM5BC. */
export function isBcClass(normalizedClass: string): boolean {
  if (/^BC\d+$/.test(normalizedClass)) return true
  if (/^FORM\d+BC$/.test(normalizedClass)) return true
  return false
}

/** Matches EPS1–EPS5 and FORM1EPS–FORM5EPS. */
export function isEpsClass(normalizedClass: string): boolean {
  if (/^EPS\d+$/.test(normalizedClass)) return true
  if (/^FORM\d+EPS$/.test(normalizedClass)) return true
  return false
}

/** Matches BC1–BC5, FORM1BC–FORM5BC, EPS*, FORM*EPS. */
export function isBcOrEpsClass(normalizedClass: string): boolean {
  return isBcClass(normalizedClass) || isEpsClass(normalizedClass)
}
