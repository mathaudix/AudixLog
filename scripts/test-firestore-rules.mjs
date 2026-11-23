import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

const APP = 'martins-sp-control';
const base = `artifacts/${APP}/public/data`;
const env = await initializeTestEnvironment({
  projectId: 'demo-audixlog',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});

let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`  ok  ${name}`); }
  catch (error) { failures += 1; console.error(`  FAIL ${name}\n    ${error.message}`); }
}

const nfBase = {
  numero: '123', fornecedor: 'ACME', data: '2026-11-01', volumes: 3, peso: 10, valor: 500,
  produtos: '', obs: '', chaveAcesso: '', filial: 'L11', responsavel: 'Ana',
  statusConferencia: 'pendente', status: 'recebido', foto: null,
};
const H = (...actions) => actions.map(action => ({ action }));
const withHistory = (extra, hist) => ({ ...extra, historico: hist });

await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, `${base}/allowed_users/admin`), { email: 'a@x.com', nome: 'Admin', role: 'admin', ativo: true });
  await setDoc(doc(db, `${base}/allowed_users/op`), { email: 'o@x.com', nome: 'Op', role: 'operador', ativo: true });
  await setDoc(doc(db, `${base}/allowed_users/inativo`), { email: 'i@x.com', nome: 'In', role: 'operador', ativo: false });
  await setDoc(doc(db, `${base}/nfs/nf1`), { ...nfBase, createdAt: Timestamp.now(), historico: H('criada') });
});

const as = uid => env.authenticatedContext(uid, { email_verified: true }).firestore();
const nfRef = (db, id = 'nf1') => doc(db, `${base}/nfs/${id}`);

console.log('Operador (ativo):');
await check('muda statusConferencia = permitido', () => assertSucceeds(updateDoc(nfRef(as('op')), withHistory({ statusConferencia: 'conferida' }, H('criada', 'status')))));
await check('muda volumes e peso = permitido', () => assertSucceeds(updateDoc(nfRef(as('op')), withHistory({ volumes: 4, peso: 11 }, H('criada', 'editada')))));
await check('expede nota = permitido', () => assertSucceeds(updateDoc(nfRef(as('op')), withHistory({ status: 'expedido', dataExpedicao: Timestamp.now() }, H('criada', 'expedida')))));
await check('altera valor = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ valor: 999 }, H('criada', 'editada')))));
await check('altera fornecedor = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ fornecedor: 'Outro' }, H('criada', 'editada')))));
await check('altera numero da NF = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ numero: '999' }, H('criada', 'editada')))));
await check('altera filial = permitido', () => assertSucceeds(updateDoc(nfRef(as('op')), withHistory({ filial: 'L12' }, H('criada', 'editada')))));
await check('altera obs = permitido', () => assertSucceeds(updateDoc(nfRef(as('op')), withHistory({ obs: 'Caixa amassada' }, H('criada', 'editada')))));
await check('altera foto = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ foto: 'data:image/png;base64,AAAA' }, H('criada', 'editada')))));
await check('altera produtos = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ produtos: 'Item X' }, H('criada', 'editada')))));
await check('obs com tipo invalido (numero) = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ obs: 123 }, H('criada', 'editada')))));
await check('obs acima do limite = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ obs: 'x'.repeat(2001) }, H('criada', 'editada')))));
await check('exclui nota = negado', () => assertFails(deleteDoc(nfRef(as('op')))));
await check('volumes negativo = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ volumes: -1 }, H('criada', 'editada')))));
await check('volumes texto = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ volumes: 'dez' }, H('criada', 'editada')))));
await check('statusConferencia invalido = negado', () => assertFails(updateDoc(nfRef(as('op')), withHistory({ statusConferencia: 'qualquer' }, H('criada', 'status')))));
await check('encolher historico = negado', () => assertFails(updateDoc(nfRef(as('op')), { statusConferencia: 'conferida', historico: [] })));
await check('criar nota valida = permitido', () => assertSucceeds(setDoc(nfRef(as('op'), 'nf2'), { ...nfBase, createdAt: Timestamp.now(), historico: H('criada') })));
await check('criar nota com valor negativo = negado', () => assertFails(setDoc(nfRef(as('op'), 'nf3'), { ...nfBase, valor: -5, createdAt: Timestamp.now(), historico: H('criada') })));
await check('criar nota sem numero = negado', () => assertFails(setDoc(nfRef(as('op'), 'nf4'), { ...nfBase, numero: '', createdAt: Timestamp.now(), historico: H('criada') })));

console.log('Admin:');
await check('altera valor = permitido', () => assertSucceeds(updateDoc(nfRef(as('admin')), withHistory({ valor: 999 }, H('criada', 'editada')))));
await check('altera fornecedor e numero = permitido', () => assertSucceeds(updateDoc(nfRef(as('admin')), withHistory({ fornecedor: 'Novo', numero: '124' }, H('criada', 'editada')))));
await check('exclui nota = permitido', () => assertSucceeds(deleteDoc(nfRef(as('admin')))));

console.log('Usuario inativo:');
await check('nao altera nota = negado', () => assertFails(updateDoc(nfRef(as('inativo')), withHistory({ statusConferencia: 'conferida' }, H('criada', 'status')))));

console.log('Historico:');
await check('history_nfs nao pode ser apagado', () => assertFails(deleteDoc(doc(as('admin'), `${base}/history_nfs/x`))));

await env.cleanup();
if (failures) { console.error(`\n${failures} teste(s) de regra falharam.`); process.exit(1); }
console.log('\ntest-firestore-rules: todos os casos passaram.');
