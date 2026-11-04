import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

// Empacota o modulo real (labelPrint.ts resolve seus imports) e usa a mesma
// buildStandardPrintContent da impressao. Assim o teste cobre o codigo de producao.
await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
const outfile = new URL('../tmp/mass_print_test.cjs', import.meta.url).pathname;
await build({
  entryPoints: [new URL('../src/utils/labelPrint.ts', import.meta.url).pathname],
  bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent',
  // Vite trata "?raw" como texto; o esbuild precisa do mesmo tratamento para os logos SVG.
  loader: { '.svg': 'text' },
  plugins: [{ name: 'raw-query', setup(b) {
    b.onResolve({ filter: /\?raw$/ }, args => ({ path: new URL(args.path.replace(/\?raw$/, ''), `file://${args.resolveDir}/`).pathname, namespace: 'raw' }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, async args => ({ contents: (await import('node:fs')).readFileSync(args.path, 'utf8'), loader: 'text' }));
  } }],
});
globalThis.window = { open: () => null };
globalThis.localStorage = { getItem: () => null };
const { createRequire } = await import('node:module');
const mod = createRequire(import.meta.url)(outfile);

const nfs = [
  { numero: '1001', fornecedor: 'ALFA', filial: '03', chaveAcesso: '', volumes: 2 },
  { numero: '1002', fornecedor: 'BETA', filial: '03', chaveAcesso: '', volumes: 0 },
  { numero: '1003', fornecedor: 'GAMA', filial: '03', chaveAcesso: '', volumes: 3 },
];

const html2 = mod.buildStandardPrintContent(nfs, { format: '100x30 (2Col)', zoom: 100, fontAdjust: 0 });
assert.equal(html2.split('class="page"').length - 1, 3, '2Col: 6 etiquetas em 3 paginas');
// Cada etiqueta do 2Col e uma <section> de coluna com position:absolute (as internas nao).
assert.equal((html2.match(/<section style="position:absolute;left:/g) ?? []).length, 6, '2Col: 6 etiquetas no total');
const vols = [...html2.matchAll(/<div class="volume"><small[^>]*>VOL<\/small><strong[^>]*>(\d+)\/(\d+)<\/strong>/g)].map(m => `${m[1]}/${m[2]}`);
assert.deepEqual(vols, ['1/2', '2/2', '1/1', '1/3', '2/3', '3/3'], '2Col: pilulas VOL na ordem; nota sem volume = 1 etiqueta 1/1');
const numeros = [...html2.matchAll(/(1001|1002|1003)/g)].map(m => m[1]);
assert.deepEqual(numeros, ['1001', '1001', '1002', '1003', '1003', '1003'], '2Col: ordem das notas');
assert.ok(html2.includes('left:56.5mm'), '2Col: coluna 2 em 56,5 mm');

const html1 = mod.buildStandardPrintContent(nfs, { format: '100x50', zoom: 100, fontAdjust: 0 });
assert.equal(html1.split('class="label page"').length - 1, 6, '100x50: 6 etiquetas = 6 paginas');

console.log('Mass print assertions passed: 2Col 6 labels/3 pages, VOL pills in order, 100x50 6 pages.');
