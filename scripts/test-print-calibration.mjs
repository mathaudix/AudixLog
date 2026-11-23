import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = await readFile(new URL('../src/utils/printCalibration.ts', import.meta.url), 'utf8');
const built = await transform(source, { loader: 'ts', format: 'cjs' });
const module = { exports: {} };
vm.runInNewContext(built.code, { module, exports: module.exports, localStorage: { getItem: () => null } });
const { DEFAULT_CALIBRATION, dualColumnsX, normalizeCalibration } = module.exports;

const d = DEFAULT_CALIBRATION.dual;
assert.equal(d.pageWidth, 106, 'pageWidth padrao 106');
assert.equal(d.pageHeight, 30, 'pageHeight padrao 30');
assert.equal(d.leftMargin, 3, 'margem esquerda padrao 3');
assert.equal(d.columnWidth, 50, 'largura da etiqueta padrao 50');
assert.equal(d.columnGap, 3.5, 'vao padrao 3,5');

const cols = dualColumnsX(d, 0);
assert.equal(cols.col1, 3, 'coluna 1 em x=3');
assert.equal(cols.col2, 56.5, 'coluna 2 em x=56,5 (3 + 50 + 3,5)');
// Com 3 + 50 + 3,5 + 50 = 106,5 mm a coluna 2 passa 0,5 mm do padrao de 106 mm: a folga
// fica na borda direita da bobina e o conteudo interno tem margem de seguranca.
assert.ok(cols.col2 + d.columnWidth - d.pageWidth <= 0.5 + 1e-9, 'estouro da coluna 2 no maximo 0,5 mm');

const shifted = dualColumnsX(d, 2);
assert.equal(shifted.col1, 5, 'offsetX aplicado na coluna 1');
assert.equal(shifted.col2, 58.5, 'offsetX aplicado na coluna 2');

for (const key of Object.keys(DEFAULT_CALIBRATION.offsets)) {
  assert.equal(DEFAULT_CALIBRATION.offsets[key].x, 0, `offset x padrao zero em ${key}`);
  assert.equal(DEFAULT_CALIBRATION.offsets[key].y, 0, `offset y padrao zero em ${key}`);
}

const clamped = normalizeCalibration({ offsets: { '100x50': { x: 99, y: -99 } }, dual: { columnGap: -5 } });
assert.equal(clamped.offsets['100x50'].x, 10, 'offset limitado a +10 mm');
assert.equal(clamped.offsets['100x50'].y, -10, 'offset limitado a -10 mm');
assert.equal(clamped.dual.columnGap, 0, 'vao nao fica negativo');

console.log('Print calibration tests passed: defaults 106x30, col2 at 56.5 mm, offsets applied, values clamped.');
