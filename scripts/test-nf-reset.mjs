import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

async function load(path) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const built = await transform(source, { loader: 'ts', format: 'cjs' });
  const module = { exports: {} };
  vm.runInNewContext(built.code, { module, exports: module.exports, require: () => { throw new Error('import inesperado'); } });
  return module.exports;
}

const { emptyDraft, resetAfterSave } = await load('src/utils/nfDraft.ts');

// Estado preenchido por uma bipagem anterior.
const filled = {
  ...emptyDraft('2026-11-01'),
  numero: '123456', fornecedor: 'ACME', volumes: 3, peso: 12.5, valor: 900,
  chaveAcesso: '35261112345678000190550010000012341000012345', filial: 'L11',
  responsavel: 'Ana', cnpjEmitente: '12345678000190', cnpjDestinatario: '03790896001110',
  serie: '001', obs: 'avaria', produtos: 'caixas', statusConferencia: 'divergente', foto: 'data:x',
};

const reset = resetAfterSave('2026-11-04');
const initial = emptyDraft('2026-11-04');

// Após salvar, nada persiste da nota anterior (inclusive filial e responsável).
assert.deepEqual(reset, initial);
assert.equal(reset.chaveAcesso, '');
assert.equal(reset.filial, '');
assert.equal(reset.responsavel, '');
assert.equal(reset.numero, '');
assert.equal(reset.statusConferencia, 'pendente');
assert.equal(reset.foto, null);
assert.notEqual(reset, filled);

// Todo campo preenchido volta ao valor inicial (nenhum valor da nota anterior sobra).
for (const key of Object.keys(filled)) {
  assert.deepEqual(reset[key], initial[key], `campo não resetado: ${key}`);
}

// Nenhum código consulta destino por CNPJ do emitente.
const sources = ['src/components/nf/NfFormModal.tsx', 'src/App.tsx', 'src/utils/destination.ts'];
for (const path of sources) {
  const text = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  assert.doesNotMatch(text, /suggestDestination|destinationKey|saveDestRules|destRules|rememberDestination|setFilialSource/, `${path} ainda usa memória por CNPJ`);
}

console.log('test-nf-reset: ok');
