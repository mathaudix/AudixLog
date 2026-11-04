import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'group-sel-'));
await build({ entryPoints: ['src/features/labels/groupSelection.ts'], bundle: true, format: 'esm', outdir: dir, outExtension: { '.js': '.mjs' }, platform: 'node', logLevel: 'silent' });
const { selectOnClick, isolateOnDoubleClick, groupMarkerColor } = await import(pathToFileURL(join(dir, 'groupSelection.mjs')).href);

const fail = (msg) => { console.error('group selection FAILED:', msg); process.exit(1); };
const el = (id, extra = {}) => ({ id, type: 'text', x: 0, y: 0, zIndex: 1, text: 'a', fontSize: 10, ...extra });
const els = [el('a', { groupId: 'g1' }), el('b', { groupId: 'g1' }), el('c'), el('d', { groupId: 'g2' })];

// clique em membro -> grupo inteiro
if (JSON.stringify(selectOnClick(els, 'a').sort()) !== JSON.stringify(['a', 'b'])) fail('clique em membro deve selecionar grupo');
// clique em item simples -> só ele
if (JSON.stringify(selectOnClick(els, 'c')) !== JSON.stringify(['c'])) fail('item sem grupo deve selecionar só ele');
// alt/isolate -> só o membro
if (JSON.stringify(selectOnClick(els, 'a', true)) !== JSON.stringify(['a'])) fail('isolate deve selecionar só o membro');

// duplo clique com grupo inteiro selecionado -> isola membro
if (JSON.stringify(isolateOnDoubleClick(els, ['a', 'b'], 'a')) !== JSON.stringify(['a'])) fail('duplo clique deve isolar membro');
// duplo clique sem grupo selecionado inteiro -> null (comportamento atual)
if (isolateOnDoubleClick(els, ['c'], 'a') !== null) fail('sem grupo inteiro selecionado deve retornar null');
// duplo clique em item sem grupo -> null (edição de texto atual)
if (isolateOnDoubleClick(els, ['c'], 'c') !== null) fail('item sem grupo deve manter edição atual');
// já isolado -> null (mantém edição atual)
if (isolateOnDoubleClick(els, ['a'], 'a') !== null) fail('já isolado deve manter comportamento atual');

// clique em outro membro depois de isolado volta ao grupo
if (JSON.stringify(selectOnClick(els, 'b').sort()) !== JSON.stringify(['a', 'b'])) fail('após isolado, clique volta ao grupo');

// cor estável
if (groupMarkerColor('grp-x') !== groupMarkerColor('grp-x')) fail('cor deve ser estável');

console.log('group selection ok (clique->grupo, isolar, duplo clique, cor estável)');
