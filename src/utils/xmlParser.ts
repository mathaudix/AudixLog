export class NFeXmlError extends Error { constructor(message: string) { super(message); this.name = 'NFeXmlError'; } }
export interface ParsedNFe { chave: string; numero: string; fornecedor: string; cnpjDest: string; cnpjEmit: string; valor: number; peso: number; volumes: number; produtos: string }
function text(parent: Document | Element, tag: string): string { return parent.getElementsByTagName(tag).item(0)?.textContent?.trim() ?? ''; }
function number(textValue: string): number { const value = Number.parseFloat(textValue.replace(',', '.')); return Number.isFinite(value) ? value : 0; }
export function parseNFeXml(source: string): ParsedNFe {
  const xml = new DOMParser().parseFromString(source, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) throw new NFeXmlError('XML da NF-e inválido ou malformado');
  const inf = xml.getElementsByTagName('infNFe').item(0);
  if (!inf) throw new NFeXmlError('XML não contém infNFe');
  const chave = (inf.getAttribute('Id') ?? '').replace(/^NFe/, '');
  const det = Array.from(xml.getElementsByTagName('det'));
  const produtos = det.map(item => { const prod = item.getElementsByTagName('prod').item(0); if (!prod) return ''; return `${number(text(prod, 'qCom'))} x ${text(prod, 'xProd') || 'Item'}`; }).filter(Boolean).join('\n');
  const emit = xml.getElementsByTagName('emit').item(0); const dest = xml.getElementsByTagName('dest').item(0);
  return { chave, numero: text(xml, 'nNF'), fornecedor: emit ? text(emit, 'xNome') || 'Fornecedor N/I' : 'Fornecedor N/I',
    cnpjDest: dest ? text(dest, 'CNPJ') : '', cnpjEmit: emit ? text(emit, 'CNPJ') : '', valor: number(text(xml, 'vNF')),
    peso: number(text(xml, 'pesoB')), volumes: Math.trunc(number(text(xml, 'qVol'))), produtos };
}
