import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const srcDir = join(root, 'src');

// Carrega pt e en (compilados pelo esbuild) e achata as chaves em "a.b.c".
const tmp = mkdtempSync(join(tmpdir(), 'i18n-'));
async function load(name) {
  const out = join(tmp, `${name}.mjs`);
  await build({ entryPoints: [join(srcDir, 'i18n', `${name}.ts`)], bundle: true, format: 'esm', outfile: out, logLevel: 'silent' });
  return (await import(pathToFileURL(out).href))[name];
}
function flatten(obj, prefix = '', acc = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, acc); else acc.add(key);
  }
  return acc;
}
const pt = flatten(await load('pt'));
const en = flatten(await load('en'));

// Coleta todos os arquivos .ts/.tsx de src (exceto i18n).
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.tsx?$/.test(name) && !p.includes(`${join('src', 'i18n')}`)) files.push(p);
  }
  return files;
}

// Chaves usadas: t('x'), t("x"), t(`x`) estáticas, e props labelKey/titleKey/textKey com string.
const used = new Map();
const callRe = /\bt\(\s*(['"`])([A-Za-z0-9_.\-]+)\1/g;
const propRe = /\b(?:labelKey|titleKey|textKey|messageKey|placeholderKey)\s*[:=]\s*(['"`])([A-Za-z0-9_.\-]+)\1/g;
for (const file of walk(srcDir)) {
  const text = readFileSync(file, 'utf8');
  for (const re of [callRe, propRe]) {
    for (const m of text.matchAll(re)) {
      const list = used.get(m[2]) ?? [];
      list.push(relative(root, file));
      used.set(m[2], list);
    }
  }
}

const missing = [];
for (const [key, files] of used) {
  // Chave usada não pode faltar em pt nem en.
  const inPt = pt.has(key);
  const inEn = en.has(key);
  if (!inPt || !inEn) missing.push({ key, inPt, inEn, file: [...new Set(files)][0] });
}

if (process.argv.includes('--report')) {
  console.log(JSON.stringify(missing, null, 1));
  console.log(`usadas: ${used.size}, faltantes: ${missing.length}`);
  process.exit(0);
}

assert.equal(
  missing.length, 0,
  'Chaves de tradução usadas no código que faltam em pt ou en:\n' +
  missing.map(m => `  ${m.key} (pt:${m.inPt} en:${m.inEn}) ex.: ${m.file}`).join('\n'),
);
console.log(`i18n keys: ${used.size} chaves usadas verificadas em pt e en, OK`);
