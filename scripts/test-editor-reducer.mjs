import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'ed-'));
await build({ entryPoints: ['src/features/labels/history.ts', 'src/features/labels/sanitize.ts'], bundle: true, format: 'esm', outdir: dir, outExtension: { '.js': '.mjs' }, platform: 'node', logLevel: 'silent' });
const { canvasHistoryReducer } = await import(pathToFileURL(join(dir, 'history.mjs')).href);
const { sanitizeLabelData } = await import(pathToFileURL(join(dir, 'sanitize.mjs')).href);

const a = { id: 'a', type: 'text', x: 1, y: 2, zIndex: 1, text: 'x', fontSize: 10 };
const b = { ...a, id: 'b', x: 5 };
let s = { present: [a], past: [], future: [] };
s = canvasHistoryReducer(s, { type: 'commit', value: [a, b] });
if (s.past.length !== 1 || s.present.length !== 2) throw new Error('add falhou');
s = canvasHistoryReducer(s, { type: 'undo' });
if (s.present.length !== 1) throw new Error('undo falhou');
s = canvasHistoryReducer(s, { type: 'redo' });
if (s.present.length !== 2) throw new Error('redo falhou');
for (let i = 0; i < 150; i++) s = canvasHistoryReducer(s, { type: 'commit', value: [{ ...a, x: i + 10 }] });
if (s.past.length !== 100) throw new Error('limite de 100 passos falhou: ' + s.past.length);

const old = { formato: '100x50', elements: [
  { id: 't', type: 'text', x: 1, y: 2, zIndex: 1, text: 'NF {NUMERO}', fontSize: 12, fill: '#000', fontFamily: 'Arial', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', bgColor: 'transparent' },
  { type: 'logo', id: 'z' }] };
const clean = sanitizeLabelData(old);
if (clean.elements.length !== 1 || clean.formato !== '100x50') throw new Error('compat de modelo antigo falhou');
console.log('editor reducer ok');
