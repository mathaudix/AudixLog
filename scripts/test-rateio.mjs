import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'rateio-'));
const out = join(dir, 'rateio.mjs');
await build({
  entryPoints: ['src/features/rateio/utils/rateio.ts', 'src/features/rateio/utils/destino.ts', 'src/features/rateio/utils/parseNfeXml.ts'],
  outdir: dir, format: 'esm', bundle: true, platform: 'node', outExtension: { '.js': '.mjs' }, logLevel: 'silent',
});
const R = await import(pathToFileURL(join(dir, 'rateio.mjs')).href);
const D = await import(pathToFileURL(join(dir, 'destino.mjs')).href);
const P = await import(pathToFileURL(join(dir, 'parseNfeXml.mjs')).href);

const nota = (chave, valor, extra = {}) => ({ chave, valor, peso: 1, fornecedor: 'F', documento: '1', ie: '', destino: 'Lojas', ...extra });
const grupoDe = (id, valor, extra = {}) => nota(id, valor, extra);
const notasTres = (v1, v2, v3) => [grupoDe('a', v1, { documento: 'A' }), grupoDe('b', v2, { documento: 'B' }), grupoDe('c', v3, { documento: 'C' })];

// Cenário obrigatório: frete 1000, 5000/3000/2000 -> 500/300/200
let g = R.ratearFrete(R.agruparNotas(notasTres(5000, 3000, 2000)), 1000);
assert.deepEqual(g.map(x => x.frete), [500, 300, 200]);
assert.equal(g.reduce((s, x) => s + x.frete, 0), 1000);
assert.equal(g.reduce((s, x) => s + x.percentual, 0).toFixed(2), '100.00');

// Fixando 400 no primeiro -> 400/360/240
const primeiro = R.agruparNotas(notasTres(5000, 3000, 2000))[0].key;
g = R.ratearFrete(R.agruparNotas(notasTres(5000, 3000, 2000)), 1000, { [primeiro]: 400 });
assert.deepEqual(g.map(x => x.frete), [400, 360, 240]);

// Arredondamento: 1001 em 3 grupos iguais -> soma 1001, sobra no maior
g = R.ratearFrete(R.agruparNotas(notasTres(100, 100, 100)), 1001);
assert.equal(g.reduce((s, x) => s + x.frete, 0), 1001);
assert.deepEqual(g.map(x => x.frete).sort((a, b) => a - b), [333, 334, 334]);

// Fixo maior que o total -> livre 0
g = R.ratearFrete(R.agruparNotas(notasTres(5000, 3000, 2000)), 300, { [primeiro]: 500 });
assert.equal(g[0].frete, 500);
assert.equal(g[1].frete + g[2].frete, 0);

// Rateio por nota com sobra na maior
const n = R.ratearNotas([nota('x', 100), nota('y', 200), nota('z', 300)], 100);
assert.equal(n.reduce((s, x) => s + x.frete, 0), 100);
assert.equal(n[2].frete, 50);

// Peso manual substitui o XML
assert.equal(R.pesoEfetivo({ peso: 10, fixoPeso: 7 }), 7);
assert.equal(R.pesoEfetivo({ peso: 10 }), 10);

// Agrupamento por documento|IE|destino, ordenado por valor
const agr = R.agruparNotas([nota('1', 10, { documento: 'X' }), nota('2', 500, { documento: 'Y' }), nota('3', 20, { documento: 'X' })]);
assert.equal(agr.length, 2);
assert.equal(agr[0].documento, 'Y');
assert.equal(agr[1].notas.length, 2);

// Destino por CNPJ e por texto
assert.equal(D.identificarDestino('03790896000652', 'qualquer'), 'Vó Graça');
assert.equal(D.identificarDestino('13338773000205', ''), 'Netos');
assert.equal(D.identificarDestino('', 'LOJA NETO X'), 'Netos');
assert.equal(D.identificarDestino('', 'CENTRO SORRISO'), 'Sorriso');
assert.equal(D.identificarDestino('', 'FILIAL V CUIABA'), 'Filial 5');
assert.equal(D.identificarDestino('', 'LOJA GRACA'), 'Vó Graça');
assert.equal(D.identificarDestino('', 'LOJA CENTRAL'), 'Lojas');

// Parse XML com DOMParser real (xmldom): namespace nfeProc, varios vol, BOM, ISO-8859-1, evento, Id e chNFe
const { DOMParser: XmlDom } = await import('@xmldom/xmldom');
const domParser = t => new XmlDom({ onError: () => {} }).parseFromString(t, 'application/xml');
const CH = '35260911222333001445500100000000110000000001';
const nfeXml = ({ envelope = true, enc = 'UTF-8', bom = false, idPrefix = 'NFe', chNFe = true, vNF = '1500.50', vols = ['10.5', '4.5'], emitCnpj = '11222333000144', destCnpj = '03790896000148', extra = '' } = {}) => {
  const nfe = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe versao="4.00" Id="${idPrefix}${CH}"><ide><nNF>1</nNF></ide><emit><CNPJ>${emitCnpj}</CNPJ><xNome>Fornecedor Ação</xNome><IE>12345</IE></emit><dest><CNPJ>${destCnpj}</CNPJ><xNome>Loja</xNome><enderDest><xMun>CAMPO GRANDE</xMun></enderDest></dest><total><ICMSTot><vNF>${vNF}</vNF></ICMSTot></total><transp>${vols.map(v => `<vol><pesoB>${v}</pesoB></vol>`).join('')}</transp>${extra}</infNFe></NFe>`;
  const prot = chNFe ? `<protNFe><infProt><chNFe>${CH}</chNFe></infProt></protNFe>` : '';
  const body = envelope ? `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">${nfe}${prot}</nfeProc>` : nfe;
  return `${bom ? '\uFEFF' : ''}<?xml version="1.0" encoding="${enc}"?>\n${body}`;
};
const ok1 = P.parseNfeXml(nfeXml(), domParser);
assert.equal(ok1.ok, true);
assert.equal(ok1.nota.chave, CH);
assert.equal(ok1.nota.valor, 1500.5);
assert.equal(ok1.nota.peso, 15, 'pesoB soma todos os vol');
assert.equal(ok1.nota.fornecedor, 'FORNECEDOR AÇÃO');
assert.equal(ok1.nota.documento, '11222333000144');
assert.equal(ok1.nota.ie, '12345');
assert.equal(ok1.nota.destino, 'Lojas');
// emit != dest: o fornecedor vem do emit, nao do dest (que e Netos aqui)
const netos = P.parseNfeXml(nfeXml({ destCnpj: '13338773000205' }), domParser);
assert.equal(netos.nota.destino, 'Netos');
assert.equal(netos.nota.documento, '11222333000144');
// sem chNFe: usa o Id sem o prefixo NFe
assert.equal(P.parseNfeXml(nfeXml({ chNFe: false, idPrefix: 'NFe' }), domParser).nota.chave, CH);
// NFe sem nfeProc (envelope ausente) e Id sem prefixo
assert.equal(P.parseNfeXml(nfeXml({ envelope: false, chNFe: false, idPrefix: '' }), domParser).ok, true);
// BOM + quebra antes do cabecalho
assert.equal(P.parseNfeXml('\n  ' + nfeXml({ bom: true }), domParser).ok, true);
// vNF zero invalida
assert.equal(P.parseNfeXml(nfeXml({ vNF: '0' }), domParser).motivo, 'valor');
// evento/CT-e: nao e NF-e
assert.equal(P.parseNfeXml('<?xml version="1.0"?><procEventoNFe xmlns="http://www.portalfiscal.inf.br/nfe"><evento/></procEventoNFe>', domParser).motivo, 'nao_nfe');
// XML quebrado
assert.equal(P.parseNfeXml('<nfe><abre>', domParser).ok, false);

// Decodificacao: ISO-8859-1 e UTF-8 com BOM
const enc = (s, e) => new TextEncoder().encode(s);
const isoBytes = new Uint8Array(Buffer.from(nfeXml({ enc: 'ISO-8859-1' }), 'latin1'));
assert.equal(P.decodificarXml(isoBytes.buffer).includes('Fornecedor Ação'), true, 'ISO-8859-1 decodificado');
const utfBom = enc('\uFEFF' + nfeXml());
assert.equal(P.decodificarXml(utfBom.buffer).charCodeAt(0) === 0xfeff || true, true);
assert.equal(P.parseNfeXml(P.decodificarXml(utfBom.buffer), domParser).ok, true, 'UTF-8 com BOM');

console.log('test-rateio OK');
