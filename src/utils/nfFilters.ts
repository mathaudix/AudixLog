import type { Filters, NotaFiscal, NfStats, SortConfig } from '../types';
export function filterAndSort(nfs: NotaFiscal[], filters: Filters, sort: SortConfig, logisticsStatus: NotaFiscal['status'] = 'recebido'): NotaFiscal[] {
  const query = filters.search.trim().toLocaleLowerCase('pt-BR');
  const dateOf = (nf: NotaFiscal): string => {
    if (logisticsStatus !== 'expedido') return nf.data;
    const value = nf.dataExpedicao;
    if (nf.dataExpedicaoISO) return nf.dataExpedicaoISO;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (value && typeof value === 'object' && 'seconds' in value) return new Date(value.seconds * 1000).toISOString().slice(0, 10);
    if (typeof value === 'string' && value) return value.slice(0, 10);
    // Fallback para createdAt (timestamp do Firestore) se disponível, senão string vazia
    // para não filtrar incorretamente pela data de entrada.
    const created = nf.createdAt;
    if (created && typeof created === 'object' && 'seconds' in created) return new Date(created.seconds * 1000).toISOString().slice(0, 10);
    if (created instanceof Date) return created.toISOString().slice(0, 10);
    if (typeof created === 'string' && created) return created.slice(0, 10);
    return '';
  };
  return nfs.filter(nf => nf.status === logisticsStatus && (!query || [nf.numero, nf.fornecedor, nf.chaveAcesso, nf.filial].some(value => String(value ?? '').toLocaleLowerCase('pt-BR').includes(query)))
    && (!filters.startDate || dateOf(nf) >= filters.startDate) && (!filters.endDate || dateOf(nf) <= filters.endDate)
    && (filters.status === 'todos' || nf.statusConferencia === filters.status)
    && (!filters.filial || String(nf.filial ?? '').toLocaleUpperCase('pt-BR') === filters.filial.toLocaleUpperCase('pt-BR')))
    .sort((a, b) => {
      const left = a[sort.key]; const right = b[sort.key];
      const av = left instanceof Date ? left.getTime() : typeof left === 'number' ? left : String(left ?? '').toLocaleLowerCase('pt-BR');
      const bv = right instanceof Date ? right.getTime() : typeof right === 'number' ? right : String(right ?? '').toLocaleLowerCase('pt-BR');
      const result = av < bv ? -1 : av > bv ? 1 : 0; return sort.direction === 'asc' ? result : -result;
    });
}
export function computeStats(nfs: NotaFiscal[]): NfStats {
  return nfs.reduce<NfStats>((stats, nf) => {
    if (nf.status === 'recebido') { stats.totalEstoque += 1; if (nf.statusConferencia === 'conferida') stats.conferidas += 1; else if (nf.statusConferencia === 'divergente') stats.divergentes += 1; else stats.pendentesConf += 1; }
    else stats.expedidas += 1; return stats;
  }, { totalEstoque: 0, expedidas: 0, pendentesConf: 0, conferidas: 0, divergentes: 0 });
}
