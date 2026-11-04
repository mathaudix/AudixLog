import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'label-bounds-'));
await build({ entryPoints: ['src/features/labels/constants.ts', 'src/features/labels/geometry.ts'], bundle: true, format: 'esm', outdir: dir, outExtension: { '.js': '.mjs' }, platform: 'node', logLevel: 'silent' });
const { DEFAULT_ELEMENTS, LABEL_DIMENSIONS, FORMATS } = await import(pathToFileURL(join(dir, 'constants.mjs')).href);
const { elementBounds } = await import(pathToFileURL(join(dir, 'geometry.mjs')).href);

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const failures = [];

for (const format of FORMATS) {
  const size = LABEL_DIMENSIONS[format];
  const boxes = DEFAULT_ELEMENTS.map(item => {
    const b = elementBounds(item);
    return { id: item.id, type: item.type, x: item.x, y: item.y, w: b.width, h: b.height };
  });
  for (const b of boxes) {
    if (b.x < 0 || b.y < 0 || b.x + b.w > size.width || b.y + b.h > size.height) {
      failures.push(`${format}: ${b.id} fora da etiqueta (x+w=${b.x + b.w}, y+h=${b.y + b.h}, limite ${size.width}x${size.height})`);
    }
  }
  const texts = boxes.filter(b => b.type === 'text');
  const codes = boxes.filter(b => b.type === 'barcode');
  for (const t of texts) for (const c of codes) {
    if (overlaps(t, c)) failures.push(`${format}: texto ${t.id} sobrepõe código de barras ${c.id}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`default label bounds ok (${FORMATS.length} formatos)`);
