// Conta cores hex soltas em src/**/*.{ts,tsx,css}, excluindo src/styles/tokens.css.
// Uso: npm run count:hex
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const EXCLUDE = join('styles', 'tokens.css');
const HEX = /#[0-9a-fA-F]{3,8}\b/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(full);
  }
  return out;
}

let total = 0;
const perFile = [];
for (const file of walk(root)) {
  const rel = relative(root, file);
  if (rel === EXCLUDE || rel.split(sep).join('/') === 'styles/tokens.css') continue;
  const matches = readFileSync(file, 'utf8').match(HEX);
  if (matches) {
    total += matches.length;
    perFile.push([rel, matches.length]);
  }
}
perFile.sort((a, b) => b[1] - a[1]);
for (const [f, n] of perFile) console.log(`${String(n).padStart(4)}  ${f}`);
console.log(`TOTAL hex fora de tokens.css: ${total}`);
