import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = await readFile(new URL('../src/utils/divergence.ts', import.meta.url), 'utf8');
const built = await transform(source, { loader: 'ts', format: 'cjs' });
const module = { exports: {} };
vm.runInNewContext(built.code, { module, exports: module.exports, require: () => ({}) });
const { calcDivergence } = module.exports;

const tol = { weightTolerancePct: 2, volumeTolerance: 0 };

const within = calcDivergence({ pesoEsperado: 100, pesoConferido: 101, volEsperado: 10 }, tol);
assert.equal(within.hasCheck, true);
assert.equal(within.weightOk, true);
assert.equal(within.divergent, false);
assert.equal(within.weightDiffPct, 1);

const above = calcDivergence({ pesoEsperado: 100, pesoConferido: 105, volEsperado: 10 }, tol);
assert.equal(above.weightOk, false);
assert.equal(above.divergent, true);
assert.equal(above.weightDiffKg, 5);

const below = calcDivergence({ pesoEsperado: 100, pesoConferido: 97, volEsperado: 10 }, tol);
assert.equal(below.weightOk, false);
assert.equal(below.weightDiffPct, -3);
assert.equal(below.divergent, true);

const none = calcDivergence({ pesoEsperado: 100, volEsperado: 10 }, tol);
assert.equal(none.hasCheck, false);
assert.equal(none.divergent, false);

const zeroExpected = calcDivergence({ pesoEsperado: 0, pesoConferido: 5, volEsperado: 0 }, tol);
assert.equal(zeroExpected.weightDiffPct, null);
assert.equal(zeroExpected.divergent, true);

const volume = calcDivergence({ pesoEsperado: 100, volEsperado: 10, volConferido: 9 }, tol);
assert.equal(volume.volumeDiff, -1);
assert.equal(volume.volumeOk, false);
assert.equal(volume.divergent, true);

console.log('test-divergence: 6 casos ok');
