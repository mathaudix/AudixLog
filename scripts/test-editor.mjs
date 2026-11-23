import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'ed-'));

try {
  await build({
    entryPoints: [
      'src/features/labels/history.ts',
      'src/features/labels/limits.ts',
      'src/features/labels/geometry.ts',
      'src/components/stats/branchChartData.ts'
    ],
    bundle: true,
    format: 'esm',
    outdir: dir,
    outExtension: { '.js': '.mjs' },
    platform: 'node',
    logLevel: 'silent'
  });

  // Find the output files (esbuild preserves directory structure)
  function findFile(name) {
    const files = readdirSync(dir, { recursive: true });
    const found = files.find(f => f.endsWith(name));
    if (!found) throw new Error(`File ${name} not found in ${dir}`);
    return join(dir, found);
  }

  const historyModule = await import(pathToFileURL(findFile('history.mjs')).href);
  const limitsModule = await import(pathToFileURL(findFile('limits.mjs')).href);
  const geometryModule = await import(pathToFileURL(findFile('geometry.mjs')).href);
  const branchModule = await import(pathToFileURL(findFile('branchChartData.mjs')).href);

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
  rmSync(dir, { recursive: true, force: true });
}