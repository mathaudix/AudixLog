import { identificarDestino, type Destino } from './destino';

export interface NfeLida {
  chave: string;
  valor: number;
  peso: number;
  fornecedor: string;
  documento: string;
  ie: string;
  destino: Destino;
}

export type ParseResult = { ok: true; nota: NfeLida } | { ok: false; motivo: 'invalido' | 'valor' | 'nao_nfe' };

const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** Decodifica os bytes do arquivo respeitando BOM e o encoding declarado no cabeçalho (UTF-8 ou ISO-8859-1 etc.). */
export function decodificarXml(bytes: ArrayBuffer): string {
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 200));
  const declarado = /encoding\s*=\s*["']([^"']+)["']/i.exec(head)?.[1]?.trim().toLowerCase();
  const label = declarado && declarado !== 'utf-8' && declarado !== 'utf8' ? declarado : 'utf-8';
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

/** Remove BOM e espaços/quebras antes da declaração XML (o DOMParser rejeita ambos). */
export function normalizarXml(xmlText: string): string {
  return xmlText.replace(/^\uFEFF/, '').replace(/^\s+(?=<)/, '');
}

/** Lê a NF-e a partir do texto XML. Usa chNFe ou o atributo Id de infNFe sem o prefixo NFe. */
export function parseNfeXml(xmlText: string, parser: (text: string) => Document | null = defaultParser): ParseResult {
  let doc: Document | null;
  try { doc = parser(normalizarXml(xmlText)); } catch { return { ok: false, motivo: 'invalido' }; }
  if (!doc || doc.getElementsByTagName('parsererror').length > 0) return { ok: false, motivo: 'invalido' };
  const infNFe = firstByLocal(doc, 'infNFe');
  if (!infNFe) return { ok: false, motivo: 'nao_nfe' };
  const text = (scope: Element | Document | null, tag: string): string => firstByLocal(scope, tag)?.textContent?.trim() ?? '';
  const chNFe = text(doc, 'chNFe');
  const idAttr = infNFe.getAttribute('Id') ?? '';
  const chave = onlyDigits(chNFe || idAttr.replace(/^NFe/i, ''));
  if (chave.length !== 44) return { ok: false, motivo: 'invalido' };
  const valor = Number(text(infNFe, 'vNF').replace(',', '.'));
  if (!(valor > 0)) return { ok: false, motivo: 'valor' };
  // pesoB pode aparecer em mais de um volume (vol); soma todos.
  const peso = allByLocal(infNFe, 'pesoB').reduce((s, el) => s + (Number(el.textContent?.trim().replace(',', '.')) || 0), 0);
  const emit = firstByLocal(infNFe, 'emit');
  const dest = firstByLocal(infNFe, 'dest');
  const fornecedor = text(emit, 'xNome').toUpperCase();
  const documento = onlyDigits(text(emit, 'CNPJ') || text(emit, 'CPF'));
  const ie = text(emit, 'IE');
  const cnpjDest = text(dest, 'CNPJ') || text(dest, 'CPF');
  const textoDest = [text(dest, 'xNome'), text(dest, 'xFant'), text(dest, 'xMun')].join(' ');
  return { ok: true, nota: { chave, valor, peso, fornecedor, documento, ie, destino: identificarDestino(cnpjDest, textoDest) } };
}

/** Busca por nome local, ignorando namespace (a NF-e usa xmlns default). */
function allByLocal(scope: Element | Document, local: string): Element[] {
  return Array.from(scope.getElementsByTagNameNS('*', local));
}

function firstByLocal(scope: Element | Document | null, local: string): Element | null {
  if (!scope) return null;
  return allByLocal(scope, local)[0] ?? null;
}

function defaultParser(text: string): Document | null {
  if (typeof DOMParser === 'undefined') return null;
  return new DOMParser().parseFromString(text, 'application/xml');
}
