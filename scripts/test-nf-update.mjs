import assert from 'node:assert/strict';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const bundle = await build({
  stdin: { contents: "export { toNfUpdatePayload } from './src/services/nfPayload.ts';", resolveDir: root.pathname, loader: 'ts' },
  bundle: true, format: 'esm', platform: 'neutral', write: false,
});
const dataUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`;
const { toNfUpdatePayload } = await import(dataUrl);

// Nota editada vinda do Firestore: campos opcionais ausentes viram undefined no rascunho.
const draft = {
  id: 'abc', numero: '123', fornecedor: 'X', data: '2026-11-01', volumes: 2, peso: 1.5, valor: 10,
  pesoConferido: undefined, volumesConferidos: undefined, historico: [{ action: 'criada' }], createdAt: { seconds: 1 },
  serie: '', cnpjEmitente: '', filial: '01', responsavel: 'Ana', statusConferencia: 'pendente', status: 'recebido', foto: null, dataExpedicao: null,
};
const payload = toNfUpdatePayload(draft);

for (const value of Object.values(payload)) assert.notEqual(value, undefined, 'nenhum campo undefined');
assert.equal(payload.pesoConferido, null);
assert.equal(payload.volumesConferidos, null);
assert.ok(!('id' in payload) && !('historico' in payload) && !('createdAt' in payload), 'campos de controle fora do payload');
assert.equal(payload.numero, '123');
assert.equal(payload.peso, 1.5);
assert.equal(payload.foto, null);
console.log('NF update payload assertions passed.');
