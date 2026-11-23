import type { NotaFiscal } from '../types';
export interface DuplicateIndex { keys: Set<string>; numberSupplier: Set<string> }
export function buildDuplicateIndex(nfs: Array<Pick<NotaFiscal, 'chaveAcesso' | 'numero' | 'fornecedor'>>): DuplicateIndex {
  const keys = new Set<string>(); const numberSupplier = new Set<string>();
  nfs.forEach(nf => { if (nf.chaveAcesso?.trim()) keys.add(nf.chaveAcesso.trim()); numberSupplier.add(`${nf.numero.trim()}|${nf.fornecedor.trim().toLocaleLowerCase('pt-BR')}`); });
  return { keys, numberSupplier };
}
export function isDuplicate(index: DuplicateIndex, nf: { chaveAcesso?: string; numero: string; fornecedor: string }): boolean {
  return Boolean((nf.chaveAcesso && index.keys.has(nf.chaveAcesso.trim())) || index.numberSupplier.has(`${nf.numero.trim()}|${nf.fornecedor.trim().toLocaleLowerCase('pt-BR')}`));
}
export function addToDuplicateIndex(index: DuplicateIndex, nf: { chaveAcesso?: string; numero: string; fornecedor: string }): void {
  if (nf.chaveAcesso?.trim()) index.keys.add(nf.chaveAcesso.trim()); index.numberSupplier.add(`${nf.numero.trim()}|${nf.fornecedor.trim().toLocaleLowerCase('pt-BR')}`);
}
