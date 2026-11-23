import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'group-lock-'));
await build({ entryPoints: ['src/features/labels/groupLock.ts'], bundle: true, format: 'esm', outdir: dir, outExtension: { '.js': '.mjs' }, platform: 'node', logLevel: 'silent' });
const { expandToGroups, copyWithNewGroups, sanitizeGroupLock, isMovable } = await import(pathToFileURL(join(dir, 'groupLock.mjs')).href);

const fail = (msg) => { console.error('group lock FAILED:', msg); process.exit(1); };
const el = (id, extra = {}) => ({ id, type: 'text', x: 0, y: 0, zIndex: 1, text: 'a', fontSize: 10, ...extra });

// 1) selecao expande para o grupo inteiro
const els = [el('a', { groupId: 'g1' }), el('b', { groupId: 'g1' }), el('c')];
const expanded = expandToGroups(els, ['a']);
if (!(expanded.includes('a') && expanded.includes('b') && !expanded.includes('c'))) fail('expandir grupo: ' + expanded.join(','));

// 2) sem grupo, selecao nao muda
if (expandToGroups(els, ['c']).join(',') !== 'c') fail('item sem grupo nao deve expandir');

// 3) travado nao move
if (isMovable(el('x', { locked: true }))) fail('travado deve ser imovel');
if (!isMovable(el('y'))) fail('livre deve ser movel');

// 4) duplicar grupo gera novo groupId, diferente do original
const copies = copyWithNewGroups([els[0], els[1]], 12);
if (!copies[0].groupId || copies[0].groupId === 'g1') fail('copia precisa de novo groupId');
if (copies[0].groupId !== copies[1].groupId) fail('membros do mesmo grupo devem continuar juntos');
if (copies[0].x !== 12) fail('offset da copia');

// 5) modelo antigo sem groupId/locked carrega igual
const old = el('o');
const san = sanitizeGroupLock(old);
if ('groupId' in san || 'locked' in san) fail('modelo antigo nao deve ganhar campos');
const kept = sanitizeGroupLock(el('k', { groupId: 'gx', locked: true }));
if (kept.groupId !== 'gx' || kept.locked !== true) fail('serializacao deve preservar groupId/locked');

console.log('group lock ok (expandir, trava, duplicar com novo groupId, modelo antigo)');
