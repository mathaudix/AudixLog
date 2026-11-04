import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

async function load(file) {
  const source = await readFile(new URL(`../src/utils/${file}`, import.meta.url), 'utf8');
  const built = await transform(source, { loader: 'ts', format: 'cjs' });
  const module = { exports: {} };
  const require = (name) => {
    if (name === './accessKey') return loaded.accessKey;
    throw new Error(`unexpected require ${name}`);
  };
  vm.runInNewContext(built.code, { module, exports: module.exports, require });
  return module.exports;
}

const loaded = {};
loaded.accessKey = await load('accessKey.ts');
const dest = await load('destination.ts');
const { branchFromDest, formatCnpj } = dest;

const branchMap = { '03790896001110': 'L11', '11222333000144': 'L12' };

// CNPJ formatado e só dígitos devem achar a mesma filial (destinatário do XML).
assert.equal(branchFromDest('03.790.896/0011-10', branchMap), 'L11');
assert.equal(branchFromDest('03790896001110', branchMap), 'L11');
assert.equal(branchFromDest('99999999000199', branchMap), undefined);
assert.equal(branchFromDest(undefined, branchMap), undefined);
assert.equal(formatCnpj('03790896001110'), '03.790.896/0011-10');

// O mapa de filiais não é consultado pelo CNPJ do emitente.
assert.equal(branchFromDest('12345678000195', { '12345678000195': 'EMIT' }), 'EMIT');

console.log('test-destination: ok');
