import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = await readFile(new URL('../src/utils/staleness.ts', import.meta.url), 'utf8');
const built = await transform(source, { loader: 'ts', format: 'cjs' });
const module = { exports: {} };
vm.runInNewContext(built.code, { module, exports: module.exports, require: () => ({}) });
const { getStaleInfo, formatStaleDuration } = module.exports;

const HOUR = 3_600_000;
const now = Date.parse('2026-11-03T12:00:00-04:00');
const base = { status: 'recebido', statusConferencia: 'pendente' };

// 1) Limite 0 desliga o alerta, mesmo para nota antiga
assert.equal(getStaleInfo({ ...base, createdAt: new Date(now - 100 * HOUR) }, now, 0).stale, false);

// 2) Dentro e acima do limite (24h)
assert.equal(getStaleInfo({ ...base, createdAt: new Date(now - 10 * HOUR) }, now, 24).stale, false);
const over = getStaleInfo({ ...base, createdAt: new Date(now - 50 * HOUR) }, now, 24);
assert.equal(over.stale, true);
assert.equal(over.ms, 50 * HOUR);

// 3) Conferida, divergente e expedida nunca ficam paradas
assert.equal(getStaleInfo({ ...base, statusConferencia: 'conferida', createdAt: new Date(now - 99 * HOUR) }, now, 24).stale, false);
assert.equal(getStaleInfo({ ...base, statusConferencia: 'divergente', createdAt: new Date(now - 99 * HOUR) }, now, 24).stale, false);
assert.equal(getStaleInfo({ ...base, status: 'expedido', createdAt: new Date(now - 99 * HOUR) }, now, 24).stale, false);

// 4) Sem data de entrada não há como medir: não fica parada
assert.equal(getStaleInfo({ ...base, createdAt: null }, now, 24).stale, false);

// 5) Timestamp do Firestore ({ seconds }) e string ISO
assert.equal(getStaleInfo({ ...base, createdAt: { seconds: (now - 30 * HOUR) / 1000 } }, now, 24).stale, true);
assert.equal(getStaleInfo({ ...base, createdAt: new Date(now - 2 * HOUR).toISOString() }, now, 24).stale, false);

// 6) Formatação: 2d 4h
const duration = formatStaleDuration(52 * HOUR);
assert.deepEqual({ ...duration }, { d: 2, h: 4, m: 0 });

console.log('staleness: ok');
