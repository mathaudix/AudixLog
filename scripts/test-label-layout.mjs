import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = await readFile(new URL('../src/utils/labelPrintCore.ts', import.meta.url), 'utf8');
const built = await transform(source.replace(/import logoMarkBlackSvg from '[^']+';/, "const logoMarkBlackSvg = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1\" height=\"1\"></svg>';"), { loader: 'ts', format: 'cjs' });
const module = { exports: {} };
vm.runInNewContext(built.code, { module, exports: module.exports, require: () => ({ default: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>' }) });
const { standardLabelMarkup, abreviarFornecedor, LABEL_MM, STANDARD_LABEL_CSS } = module.exports;

const supplier = 'PRIETO ALIMENTOS LTDA';
const base = { supplier, branch: '03 - CAMPO GRANDE CENTRO', nfNumber: '1047826', volume: 1, total: 4, header: '', barcodeMarkup: '<svg></svg>' };
const num = (html, name) => Number(html.match(new RegExp(`data-${name}-font-size="([^"]+)"`))[1]);

assert.equal(abreviarFornecedor('PRIETO ALIMENTOS LTDA'), 'PRIETO ALIMENTOS');

for (const format of ['100x50', '150x100', '100x150', '100x30 (2Col)']) {
  const html = standardLabelMarkup({ ...base, format });
  assert.ok(!html.includes('CAMPO GRANDE'), `${format}: sem nome da filial`);
  assert.ok(!html.includes('barcode'), `${format}: sem código de barras`);
  assert.ok(!html.includes('REMETENTE') && !html.includes('NOTA FISCAL'), `${format}: sem rótulos extras`);
  assert.ok(html.includes('>03<'), `${format}: código da filial só`);
  assert.ok(html.includes('1047826'), `${format}: NF sem prefixo`);
  assert.ok(!/background:#000[^;"]*;?[^"]*branch|class="branch-code"[^>]*background/.test(html), `${format}: filial sem fundo preto`);
  const branch = num(html, 'branch'), nf = num(html, 'nf'), vol = num(html, 'vol');
  assert.ok(branch > nf, `${format}: filial > NF`);
  assert.equal(vol, nf, `${format}: NF == volume`);
  const order = ['class="top"', 'class="supplier"', 'class="rule"', 'class="branch"', 'class="invoice"'].map(t => html.indexOf(t));
  assert.ok(order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])), `${format}: ordem vertical`);
  assert.ok(html.indexOf('class="volume"') > html.indexOf('class="top"') && html.indexOf('class="volume"') < html.indexOf('class="supplier"'), `${format}: volume no topo`);
  assert.ok(html.includes('class="volume"'), `${format}: volume presente`);
  assert.ok(STANDARD_LABEL_CSS.includes('margin-left:auto') && STANDARD_LABEL_CSS.includes('justify-content:flex-end'), `${format}: pilula a direita`);
  assert.ok(html.includes('class="brand"'), `${format}: logo presente`);
  const noVol = standardLabelMarkup({ ...base, format, volume: 0, total: 0 });
  assert.ok(!noVol.includes('class="volume"'), `${format}: sem volume some`);
  assert.ok(noVol.includes('class="brand"'), `${format}: logo continua sem volume`);
  assert.ok(num(noVol, 'branch') >= branch, `${format}: filial cresce sem volume`);
}

const big = standardLabelMarkup({ ...base, format: '100x50' });
assert.ok(num(big, 'branch') >= 13, 'filial >= 13 mm na 100x50');
assert.ok(num(big, 'nf') >= 7, 'NF >= 7 mm na 100x50');

console.log('Label layout assertions passed for all 4 formats: branch-only, NF and volume same size, no barcode, no sobra.');
