import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'resize-rot-'));
await build({ entryPoints: ['src/features/labels/geometry.ts'], bundle: true, format: 'esm', outdir: dir, outExtension: { '.js': '.mjs' }, platform: 'node', logLevel: 'silent' });
const { resizeRotated, resizeElement, elementBounds } = await import(pathToFileURL(join(dir, 'geometry.mjs')).href);

const fail = (msg) => { console.error('resize rotated FAILED:', msg); process.exit(1); };
const rad = (d) => (d * Math.PI) / 180;
// ancora global de um handle: ponto da caixa do item (local) oposto a alca, convertido para tela/canvas
function anchorOf(el, handle) {
  const b = elementBounds(el);
  const rot = rad(el.rotation ?? 0);
  const cx = el.x + b.width / 2, cy = el.y + b.height / 2;
  const west = handle.includes('w'), east = handle.includes('e'), north = handle.includes('n'), south = handle.includes('s');
  // ancora = lado/canto OPOSTO a alca: se a alca e 'e', a ancora fica no lado 'w' (local -x)
  const lx = east ? -b.width / 2 : west ? b.width / 2 : 0;
  const ly = south ? -b.height / 2 : north ? b.height / 2 : 0;
  return { x: cx + lx * Math.cos(rot) - ly * Math.sin(rot), y: cy + lx * Math.sin(rot) + ly * Math.cos(rot) };
}

const base = { id: 't', type: 'text', x: 40, y: 40, zIndex: 1, text: 'Filial: X', fontSize: 14, fill: '#000', fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', bgColor: 'transparent', width: 80, height: 20 };
const zoom = 100; // 1 px de tela = 1 unidade

for (const rotation of [0, 90, 45]) {
  for (const handle of ['e', 'se', 'w', 'n']) {
    const el = { ...base, rotation };
    const before = anchorOf(el, handle);
    // opposite handle anchor: the one diagonal/side opposite to handle
    const opp = { e: 'w', w: 'e', n: 's', s: 'n', se: 'nw', nw: 'se', ne: 'sw', sw: 'ne' }[handle];
    const oppBefore = anchorOf(el, handle);
    const out = resizeRotated(el, 15, 9, zoom, handle, 0);
    const oppAfter = anchorOf(out, handle);
    const err = Math.hypot(oppAfter.x - oppBefore.x, oppAfter.y - oppBefore.y);
    if (err > 0.3) fail(`rot ${rotation} handle ${handle}: ancora oposta moveu ${err.toFixed(3)}`);
    void before;
  }
}

// rot 90, alca direita local +20 -> largura local +20
{
  const el = { ...base, rotation: 90 };
  const out = resizeRotated(el, 0, 20, zoom, 'e', 0);
  // dy global +20 em rotacao 90 corresponde ao eixo local +x
  if (Math.abs(elementBounds(out).width - 100) > 1) fail(`rot 90 largura local esperada 100, obtida ${elementBounds(out).width}`);
}

// rot 0 deve ser identico ao resizeElement
{
  const el = { ...base, rotation: 0 };
  const a = resizeRotated(el, 13, 7, 80, 'se', 15);
  const b = resizeElement(el, 13, 7, 80, 'se', 15);
  if (JSON.stringify(a) !== JSON.stringify(b)) fail('rot 0 deve ser igual a resizeElement');
}

console.log('resize rotated ok (rot 0/90/45 x 4 alcas, largura local, regressao rot 0)');
