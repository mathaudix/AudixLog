import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = await readFile(new URL('../src/utils/accessKey.ts', import.meta.url), 'utf8');
const built = await transform(source, { loader: 'ts', format: 'cjs' });
const module = { exports: {} };
vm.runInNewContext(built.code, { module, exports: module.exports });
const { isValidAccessKey, accessKeyCheckDigit } = module.exports;

const base = '3526011234567800019555001000123456112345678';
const valid = base + accessKeyCheckDigit(base);
assert.equal(valid.length, 44);
assert.equal(isValidAccessKey(valid), true, 'chave com DV correto deve ser válida');
const wrongDv = base + ((accessKeyCheckDigit(base) + 1) % 10);
assert.equal(isValidAccessKey(wrongDv), false, 'DV errado deve ser recusado');
assert.equal(isValidAccessKey(valid.slice(0, 43)), false, '43 dígitos deve ser recusado');
assert.equal(isValidAccessKey(''), false);
assert.equal(isValidAccessKey('abc'), false);
assert.equal(isValidAccessKey(valid.match(/.{1,4}/g).join(' ')), true, 'chave formatada com espaços deve ser aceita');
console.log('test-access-key-validation: ok');
