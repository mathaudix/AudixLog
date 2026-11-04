import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const load = async (rel) => {
  const src = await readFile(new URL(`../src/utils/${rel}`, import.meta.url), 'utf8');
  const { code } = await transform(src, { loader: 'ts', format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
};
const w = await load('nfWindow.ts');
const DAY = 86400000; const now = Date.parse('2026-11-04T12:00:00-04:00');

assert.equal(w.windowCutoff(90, now).getTime(), now - 90 * DAY);
assert.equal(w.WINDOW_OPTIONS.join(','), '30,60,90,180');

const A = [{ id: '1' }, { id: '2', tag: 'A' }]; const B = [{ id: '2', tag: 'B' }, { id: '3' }];
const merged = w.mergeNfsById(A, B);
assert.deepEqual(merged.map(n => n.id), ['1', '2', '3']);
assert.equal(merged[1].tag, 'A');

const ts = ms => ({ toDate: () => new Date(ms) });
const cutoff = w.windowCutoff(90, now);
assert.equal(w.isInWindow({ createdAt: ts(now - 10 * DAY) }, cutoff), true);
assert.equal(w.isInWindow({ createdAt: ts(now - 120 * DAY) }, cutoff), false);
assert.equal(w.isInWindow({ createdAt: null }, cutoff), false);

const out = w.toJsonSafe({ a: ts(now), historico: [{ at: ts(now) }], n: 1 });
assert.equal(out.a, new Date(now).toISOString());
assert.equal(out.historico[0].at, new Date(now).toISOString());
assert.equal(out.n, 1);

assert.equal(w.formatBackupDate(new Date(2026, 10, 4)), '2026-11-04');
assert.equal(w.isBackupStale(null), true);
assert.equal(w.isBackupStale(new Date(now - 2 * DAY).toISOString(), now), false);
assert.equal(w.isBackupStale(new Date(now - 8 * DAY).toISOString(), now), true);

const decideDuplicate = async (nf, findByChave) => (!nf.numero || (nf.chaveAcesso && await findByChave(nf.chaveAcesso))) ? 'duplicada' : 'nova';
assert.equal(await decideDuplicate({ numero: '1', chaveAcesso: 'K' }, async () => ({ id: 'x' })), 'duplicada');
assert.equal(await decideDuplicate({ numero: '1', chaveAcesso: 'K' }, async () => null), 'nova');

console.log('nf window ok');
