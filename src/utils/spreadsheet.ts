type XlsxModule = typeof import('xlsx');
let xlsxPromise: Promise<XlsxModule> | null = null;
export const loadXlsx = (): Promise<XlsxModule> => (xlsxPromise ??= import('xlsx'));
import type { NotaFiscal } from '../types';
import { safeCell } from './sanitize';
import { getLocalDateISO } from './format';
export async function exportNfsToXlsx(nfs: NotaFiscal[]): Promise<void> {
  const XLSX = await loadXlsx();
  const rows = nfs.map(nf => ({ 'Data Entrada': nf.data ? nf.data.split('-').reverse().join('/') : '', 'Número NF': nf.numero,
    'Status Conferência': nf.statusConferencia.toUpperCase(), 'Status Logística': nf.status === 'expedido' ? 'EXPEDIDO' : 'RECEBIDO',
    'Fornecedor': nf.fornecedor, 'Filial': nf.filial ?? '', 'Responsável': nf.responsavel ?? '', 'Volumes': nf.volumes, 'Peso (KG)': nf.peso,
    'Valor (R$)': nf.valor, 'Produtos / Itens': nf.produtos ?? '', 'Observações': nf.obs ?? '', 'Chave de Acesso': nf.chaveAcesso ?? '', 'Data Expedição': nf.dataExpedicao ? String(nf.dataExpedicao) : '-' }));
  const sheet = XLSX.utils.json_to_sheet(rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, safeCell(v)])))); if (rows[0]) sheet['!cols'] = Object.keys(rows[0]).map(key => ({ wch: Math.max(key.length, 15) }));
  const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Relatorio'); XLSX.writeFile(book, `Controle_AudixLOG_${getLocalDateISO()}.xlsx`);
}
