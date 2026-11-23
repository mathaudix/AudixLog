import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'rot-edge-'));
await build({ entryPoints: ['src/features/labels/snapGuides.ts'], bundle: true, format: 'esm', outdir: dir, outExtension: { '.js': '.mjs' }, platform: 'node', logLevel: 'silent' });
const { keepInside, boxOf } = await import(pathToFileURL(join(dir, 'snapGuides.mjs')).href);

const fail = (msg) => { console.error('rotate edge FAILED:', msg); process.exit(1); };
const canvas = { width: 181, height: 113 };

// Barcode 34 de largura girado 90: caixa rotacionada vira 34 de altura, 
// mas aqui testamos um item largo (width 80, height 20) girado 90 perto da borda direita.
const item = { id: 'b', type: 'barcode', x: 170, y: 40, zIndex: 1, value: '1', width: 80, height: 20, rotation: 90 };
const fixed = keepInside(item, canvas);
const box = boxOf(fixed);
if (box.x < -0.6 || box.x + box.width > canvas.width + 0.6) fail(`caixa girada fora: x=${box.x} w=${box.width}`);

// Sem giro nao muda
const flat = { ...item, rotation: 0 };
if (keepInside(flat, canvas) !== flat) fail('item sem giro nao deve mudar');

// Item mais alto que a etiqueta girado 90: centraliza no eixo que estoura (y) e mantem o x
const big = { id: 'g', type: 'barcode', x: 0, y: 0, zIndex: 1, value: '1', width: 300, height: 20, rotation: 90 };
const bigFixed = keepInside(big, canvas);
const bb = boxOf(bigFixed);
const cy = bb.y + bb.height / 2;
if (Math.abs(cy - canvas.height / 2) > 0.6) fail(`item maior nao centralizado em y: cy=${cy}`);
if (Math.abs(bb.x + bb.width / 2 - 150) > 0.6) fail('x nao deveria mudar quando so o y estoura');

console.log('rotate edge ok (3 casos)');
