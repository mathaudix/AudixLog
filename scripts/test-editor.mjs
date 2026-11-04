import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const scratch = await mkdtemp(join(root, '.editor-test-'));

async function loadTs(relativePath) {
  let source = await readFile(join(root, relativePath), 'utf8');
  if (relativePath === 'src/features/labels/geometry.ts') source = source.replace("from './limits'", "from './src_features_labels_limits.mjs'");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const output = join(scratch, relativePath.replaceAll('/', '_').replace(/\.ts$/, '.mjs'));
  await writeFile(output, js, 'utf8');
  return import(pathToFileURL(output).href);
}

try {
  const historyModule = await loadTs('src/features/labels/history.ts');
  const limitsModule = await loadTs('src/features/labels/limits.ts');
  const geometryModule = await loadTs('src/features/labels/geometry.ts');
  const branchModule = await loadTs('src/components/stats/branchChartData.ts');
  const item = { id: 't1', type: 'text', x: 20, y: 20, zIndex: 1, text: 'hello', fontSize: 10, fill: '#000', fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', bgColor: 'transparent' };
  const state = { present: [item], past: [], future: [] };
  const committed = historyModule.canvasHistoryReducer(state, { type: 'commit', value: [{ ...item, x: 25 }] });
  assert.equal(committed.present[0].x, 25);
  assert.equal(historyModule.canvasHistoryReducer(committed, { type: 'undo' }).present[0].x, 20);
  assert.equal(historyModule.canvasHistoryReducer(historyModule.canvasHistoryReducer(committed, { type: 'undo' }), { type: 'redo' }).present[0].x, 25);
  assert.equal(historyModule.canvasHistoryReducer(committed, { type: 'commit', value: committed.present }).future.length, 0);

  const moved = geometryModule.moveElement([item], 't1', 20, 10, 200, { width: 378, height: 567 });
  assert.equal(moved.elements[0].x, 30);
  assert.equal(moved.elements[0].y, 25);
  const snapped = geometryModule.moveElement([{ ...item, x: 32 }, { ...item, id: 't2', x: 100 }], 't1', 3, 0, 100, { width: 378, height: 567 });
  assert.equal(snapped.elements[0].x, 35);
  assert.ok(snapped.guides.some(guide => guide.axis === 'x' && guide.position === 100));
  const beyond = geometryModule.moveElement([item], 't1', -200, 1200, 100, { width: 378, height: 567 });
  assert.equal(beyond.elements[0].x, -180, 'element may cross left edge');
  assert.equal(beyond.elements[0].y, 1000, 'position respects configured maximum');
  const resized = geometryModule.resizeElement(item, 500, 800, 100, 'se');
  assert.ok(resized.width > 378, 'resize may exceed canvas width');
  assert.ok(resized.height > 567, 'resize may exceed canvas height');
  assert.ok(resized.x + resized.width > 378, 'resized element extends beyond canvas width');
  assert.ok(resized.y + resized.height > 567, 'resized element extends beyond canvas height');
  const legacyLogo = { id: 'legacy-logo', type: 'logo', x: 0, y: 0, width: 30, height: 30, zIndex: 5 };
  const migrated = geometryModule.normalizeLabelElements([{ ...item, y: 0 }, legacyLogo], geometryModule.logoHeaderHeight(113));
  assert.equal(migrated.length, 1, 'legacy movable logo is removed when migrating saved models');
  assert.equal(migrated[0].y, geometryModule.logoHeaderHeight(113), 'elements are clamped below reserved logo header');
  const branches = Array.from({ length: 12 }, (_, index) => `L${index + 1}`);
  const series = branchModule.buildBranchSeries(branches);
  assert.equal(series.length, 12, 'one series for each branch');
  assert.ok(series.every(item => !/outras|outros/i.test(item.name)), 'no aggregated branch series');
  assert.equal(new Set(series.map(item => item.name)).size, 12);
  assert.equal(new Set(series.map(item => item.color)).size, 12, 'all branch colors unique');
  assert.deepEqual(series.map(item => item.name), branches, 'natural branch ordering');
  assert.deepEqual(branchModule.buildBranchSeries(branches), series, 'branch colors stable');
  console.log('Editor and chart unit tests passed: history, move/resize, fixed logo migration/clamp, 12 unique stable branch series.');
} finally {
  await rm(scratch, { recursive: true, force: true });
}
