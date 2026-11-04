import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const dir = mkdtempSync(join(tmpdir(), 'rot-'));
await build({ entryPoints: ['src/features/labels/constants.ts', 'src/features/labels/geometry.ts'], bundle: true, format: 'esm', outdir: dir, outExtension: { '.js': '.mjs' }, platform: 'node', logLevel: 'silent' });
const { DEFAULT_ELEMENTS } = await import(pathToFileURL(join(dir, 'constants.mjs')).href);
const { normalizeRotation, snapRotation, rotatedBox } = await import(pathToFileURL(join(dir, 'geometry.mjs')).href);

assert.equal(normalizeRotation(370), 10);
assert.equal(normalizeRotation(-90), 270);
assert.equal(normalizeRotation(450), 90);
assert.equal(snapRotation(88, false), 90);
assert.equal(snapRotation(80, false), 80);
assert.equal(snapRotation(358, false), 0);
assert.equal(snapRotation(47, true), 45);
const box = rotatedBox(100, 20, 90);
assert.ok(Math.abs(box.width - 20) < 1e-6 && Math.abs(box.height - 100) < 1e-6, 'bounding box girada');
for (const el of DEFAULT_ELEMENTS) assert.equal(el.rotation ?? 0, 0, 'modelo padrao sem rotacao');
console.log('rotation ok');
