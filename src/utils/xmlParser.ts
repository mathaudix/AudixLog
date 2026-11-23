export class NFeXmlError extends Error { constructor(message: string) { super(message); this.name = 'NFeXmlError'; } }
export interface ParsedNFe { chave: string; numero: string; fornecedor: string; cnpjDest: string; cnpjEmit: string; valor: number; peso: number; volumes: number; produtos: string }

/** Busca por nome local ignorando namespace (NFe usa xmlns default). */
function allByLocal(scope: Element | Document, local: string): Element[] {
  return Array.from(scope.getElementsByTagNameNS('*', local));
}

function firstByLocal(scope: Element | Document | null, local: string): Element | null {
  if (!scope) return null;
  return allByLocal(scope, local)[0] ?? null;
}

function text(scope: Element | Document | null, tag: string): string {
  return firstByLocal(scope, tag)?.textContent?.trim() ?? '';
}

function number(textValue: string): number {
  const value = Number.parseFloat(textValue.replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function parseNFeXml(source: string): ParsedNFe {
  const xml = new DOMParser().parseFromString(source, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) throw new NFeXmlError('XML da NF-e inválido ou malformado');
  const inf = firstByLocal(xml, 'infNFe');
  if (!inf) throw new NFeXmlError('XML não contém infNFe');
  const chave = (inf.getAttribute('Id') ?? '').replace(/^NFe/, '');
  const det = allByLocal(xml, 'det');
  const produtos = det.map(item => {
    const prod = firstByLocal(item, 'prod');
    if (!prod) return '';
    return `${number(text(prod, 'qCom'))} x ${text(prod, 'xProd') || 'Item'}`;
  }).filter(Boolean).join('\n');
  const emit = firstByLocal(xml, 'emit');
  const dest = firstByLocal(xml, 'dest');
  return {
    chave,
    numero: text(xml, 'nNF'),
    fornecedor: emit ? text(emit, 'xNome') || 'Fornecedor N/I' : 'Fornecedor N/I',
    cnpjDest: dest ? text(dest, 'CNPJ') : '',
    cnpjEmit: emit ? text(emit, 'CNPJ') : '',
    valor: number(text(xml, 'vNF')),
    peso: number(text(xml, 'pesoB')),
    volumes: Math.trunc(number(text(xml, 'qVol'))),
    produtos
  };
}
