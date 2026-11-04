import type { NotaFiscal } from '../types';

export type SearchKind = 'chave' | 'numero' | 'texto' | 'vazio';
export type OldSource = 'antiga' | 'arquivada';
export interface TaggedNf { nf: NotaFiscal; source: OldSource }

/** Escolhe o tipo de consulta pelo termo: 44 dígitos = chave; só dígitos = número; resto = não suportado. */
export function classifySearchTerm(term: string): SearchKind {
  const clean = term.replace(/\s/g, '');
  if (!clean) return 'vazio';
  if (/^\d{44}$/.test(clean)) return 'chave';
  if (/^\d+$/.test(clean)) return 'numero';
  return 'texto';
}

/** Número sem zeros à esquerda (o app grava numero como string sem zeros iniciais). */
export function normalizeNumero(term: string): string {
  return term.replace(/\s/g, '').replace(/^0+(?=\d)/, '');
}

/**
 * Mescla resultados antigos/arquivados sem duplicar e sem repetir o que já está carregado.
 * Ordem de prioridade: já carregada > antiga > arquivada (um mesmo id aparece uma vez).
 */
export function mergeOldResults(loaded: NotaFiscal[], found: TaggedNf[]): TaggedNf[] {
  const seen = new Set(loaded.map(nf => nf.id));
  const out: TaggedNf[] = [];
  const ordered = [...found].sort((a, b) => (a.source === b.source ? 0 : a.source === 'antiga' ? -1 : 1));
  for (const item of ordered) {
    if (seen.has(item.nf.id)) continue;
    seen.add(item.nf.id); out.push(item);
  }
  return out;
}
