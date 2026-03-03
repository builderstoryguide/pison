import fs from 'node:fs';
import path from 'node:path';

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

const repoRoot = process.cwd();
const enPath = path.join(repoRoot, 'i18n/messages/en.json');
const frPath = path.join(repoRoot, 'i18n/messages/fr.json');

const scanDirs = ['app', 'components', 'lib', 'hooks'];
const sourceExts = new Set(['.ts', '.tsx']);

const readJson = (filePath: string) =>
  JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, JsonValue>;

const flattenKeys = (obj: Record<string, JsonValue>, prefix = ''): string[] => {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, JsonValue>, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
};

const walkFiles = (dirPath: string): string[] => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      files.push(...walkFiles(fullPath));
      continue;
    }
    if (sourceExts.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
};

const collectTranslationUsages = (content: string): string[] => {
  const pattern = /\bt\(\s*['"`]([^'"`]+)['"`]/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const key = match[1].trim();
    if (key.includes('${') || key.includes(' ')) {
      continue;
    }
    matches.push(key);
  }
  return matches;
};

const collectLiteralCandidates = (content: string): string[] => {
  const candidates: string[] = [];
  const jsxTextPattern = />\s*([A-Za-z][^<{]{2,})\s*</g;
  const attrPattern = /\b(?:placeholder|title|aria-label|label)\s*=\s*['"]([^'"]*[A-Za-z][^'"]*)['"]/g;

  let match: RegExpExecArray | null;
  while ((match = jsxTextPattern.exec(content)) !== null) {
    candidates.push(match[1].trim());
  }
  while ((match = attrPattern.exec(content)) !== null) {
    candidates.push(match[1].trim());
  }

  return candidates.filter((value) => {
    if (!value) return false;
    if (value.startsWith('http')) return false;
    if (value.includes('{{') || value.includes('}}')) return false;
    if (/^[A-Z0-9_ -]+$/.test(value)) return false;
    return /[A-Za-z]/.test(value);
  });
};

const main = () => {
  const en = readJson(enPath);
  const fr = readJson(frPath);

  const enKeys = new Set(flattenKeys(en));
  const frKeys = new Set(flattenKeys(fr));

  const missingInFr = [...enKeys].filter((key) => !frKeys.has(key));
  const missingInEn = [...frKeys].filter((key) => !enKeys.has(key));

  if (missingInFr.length || missingInEn.length) {
    console.error('i18n key mismatch detected.');
    if (missingInFr.length) {
      console.error(`Missing in fr.json (${missingInFr.length}):`);
      missingInFr.slice(0, 50).forEach((k) => console.error(`  - ${k}`));
    }
    if (missingInEn.length) {
      console.error(`Missing in en.json (${missingInEn.length}):`);
      missingInEn.slice(0, 50).forEach((k) => console.error(`  - ${k}`));
    }
    process.exit(1);
  }

  const files = scanDirs.flatMap((dir) => walkFiles(path.join(repoRoot, dir)));
  const usedKeys = new Set<string>();
  const unknownKeys: string[] = [];
  const literalWarnings: { file: string; samples: string[] }[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const usages = collectTranslationUsages(content);
    usages.forEach((key) => {
      usedKeys.add(key);
      if (!enKeys.has(key)) {
        unknownKeys.push(`${path.relative(repoRoot, file)} -> ${key}`);
      }
    });

    if (file.endsWith('.tsx')) {
      const literals = collectLiteralCandidates(content);
      if (literals.length > 0) {
        literalWarnings.push({
          file: path.relative(repoRoot, file),
          samples: [...new Set(literals)].slice(0, 5),
        });
      }
    }
  }

  if (unknownKeys.length > 0) {
    console.warn('Unknown translation keys found in source (warning mode):');
    unknownKeys.slice(0, 100).forEach((line) => console.warn(`  - ${line}`));
  }

  const unusedKeys = [...enKeys].filter((key) => !usedKeys.has(key));

  console.log(`Translation keys checked: ${enKeys.size}`);
  console.log(`Used keys found in source: ${usedKeys.size}`);
  console.log(`Potentially unused keys: ${unusedKeys.length}`);
  if (unusedKeys.length > 0) {
    unusedKeys.slice(0, 40).forEach((key) => console.log(`  - ${key}`));
  }

  console.log(`Potential hardcoded literal warnings: ${literalWarnings.length}`);
  if (literalWarnings.length > 0) {
    literalWarnings.slice(0, 40).forEach((warn) => {
      console.log(`  - ${warn.file}: ${warn.samples.join(' | ')}`);
    });
  }
};

main();
