import assert from 'node:assert/strict';
import { transform } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const src = await readFile(new URL('../src/utils/oldNfSearch.ts', import.meta.url), 'utf-8');
const { code } = await transform(src, { loader: 'ts', format: 'esm' });
await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
const outUrl = new URL('../tmp/oldNfSearch.mjs', import.meta.url);
await writeFile(outUrl, code);
const { classifySearchTerm, normalizeNumero, mergeOldResults } = await import(outUrl.href);

// escolha de consulta por termo
assert.equal(classifySearchTerm('1'.repeat(44)), 'chave');
assert.equal(classifySearchTerm(' 1234 5678 '), 'numero');
assert.equal(classifySearchTerm('123 456'), 'numero');
assert.equal(classifySearchTerm('fornecedor abc'), 'texto');
assert.equal(classifySearchTerm('   '), 'vazio');
assert.equal(classifySearchTerm('1'.repeat(43)), 'numero');

// normalização do número (string sem zeros à esquerda)
assert.equal(normalizeNumero('000123'), '123');
assert.equal(normalizeNumero('0'), '0');

// mescla sem duplicar e marcação
const mk = (id, extra = {}) => ({ id, numero: id, ...extra });
const loaded = [mk('a')];
const found = [
  { nf: mk('a'), source: 'antiga' },
  { nf: mk('b'), source: 'arquivada' },
  { nf: mk('c'), source: 'antiga' },
  { nf: mk('c'), source: 'arquivada' },
];
const merged = mergeOldResults(loaded, found);
assert.deepEqual(merged.map(m => m.nf.id), ['c', 'b']);
assert.deepEqual(merged.map(m => m.source), ['antiga', 'arquivada']);
assert.deepEqual(mergeOldResults([], []), []);

console.log('old nf search ok');
