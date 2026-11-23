import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'snap-'));
await build({ entryPoints: ['src/features/labels/snapGuides.ts'], bundle: true, format: 'esm', outdir: dir, outExtension: { '.js': '.mjs' }, platform: 'node', logLevel: 'silent' });
const { computeSnap, boxOf } = await import(pathToFileURL(join(dir, 'snapGuides.mjs')).href);

const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const fail = (msg) => { console.error('snap guides FAILED:', msg); process.exit(1); };
const canvas = { width: 100, height: 50 };

// 1) centro a 3 unidades do centro da etiqueta -> encaixa e gera guia em x=50
{
  const moving = { x: 40 + 3, y: 10, width: 20, height: 10 };
  const r = computeSnap(moving, [], canvas, 4);
  if (!near(r.dx, -3)) fail(`centro: dx esperado -3, veio ${r.dx}`);
  if (!r.guides.some(g => g.axis === 'x' && near(g.position, 50))) fail('centro: guia x=50 ausente');
}

// 2) sem alvo proximo (distancia 10 do centro, 5 da borda) -> sem snap
{
  const r = computeSnap({ x: 55, y: 10, width: 20, height: 10 }, [], canvas, 4);
  if (r.dx !== 0 || r.guides.some(g => g.axis === 'x')) fail('sem snap: deveria ficar parado');
}

// 3) borda esquerda a 1 unidade da borda de outro item -> encaixe
{
  const other = { x: 20, y: 20, width: 10, height: 10 };
  const r = computeSnap({ x: 21, y: 40, width: 10, height: 5 }, [other], canvas, 4);
  if (!near(r.dx, -1)) fail(`borda: dx esperado -1, veio ${r.dx}`);
  if (!r.guides.some(g => g.axis === 'x' && near(g.position, 20))) fail('borda: guia x=20 ausente');
}

// 4) item girado 90 usa a caixa rotacionada (100x20 -> 20x100), centro preservado
{
  const item = { type: 'rect', id: 'r', x: 0, y: 0, width: 100, height: 20, rotation: 90 };
  const b = boxOf(item);
  if (!near(b.width, 20, 1e-6) || !near(b.height, 100, 1e-6)) fail(`girado: caixa esperada 20x100, veio ${b.width}x${b.height}`);
  if (!near(b.x + b.width / 2, 50) || !near(b.y + b.height / 2, 10)) fail('girado: centro nao preservado');
}

// 5) item sem rotation equivale a caixa normal
{
  const b = boxOf({ type: 'rect', id: 'n', x: 5, y: 6, width: 30, height: 10 });
  if (b.x !== 5 || b.y !== 6 || b.width !== 30 || b.height !== 10) fail('sem rotation: caixa deveria ser igual');
}

console.log('snap guides ok (5 casos)');
