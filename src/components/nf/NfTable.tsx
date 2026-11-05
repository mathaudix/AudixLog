import { useI18n } from './../../i18n/I18nProvider';
import { ArrowDown, ArrowUp, ArrowUpDown, FileX2 } from 'lucide-react';
import type { NotaFiscal, SortConfig, StatusConferencia } from '../../types';
import { NfRow } from './NfRow';
import { EmptyState } from '../ui/system';
import { Button } from '../ui/Button';
import type { StaleInfo } from '../../utils/staleness';
import './nf-table.css';
import './nf-table-fit.css';
import './nf-table-header.css';
import './nf-table-spacing.css';
interface Props { hasFilters?: boolean; onClearFilters?: () => void; revealId?: string | null; allowDelete: boolean; nfs: NotaFiscal[]; selected: string[]; loading?: boolean; onSelect: (id: string) => void; onSelectAll: (ids: string[]) => void; onStatus: (id: string, status: StatusConferencia) => void; onEdit: (nf: NotaFiscal) => void; onDelete: (nf: NotaFiscal) => void; onDispatch: (nf: NotaFiscal) => void; onUndo: (nf: NotaFiscal) => void; onPrint: (nf: NotaFiscal) => void; sort: SortConfig; onSort: (key: keyof NotaFiscal) => void; staleById?: Map<string, StaleInfo>; divergentById?: Map<string, string>; staleHours?: number }
export function NfTable(props: Props) {
 const { t } = useI18n();
  const fields: Array<[keyof NotaFiscal, string]> = [['data', 'Data'], ['numero', 'NF'], ['fornecedor', 'Fornecedor'], ['volumes', 'Volumes'], ['peso', 'Peso'], ['valor', 'Valor']];
  const icon = (key: keyof NotaFiscal) => props.sort.key !== key ? <ArrowUpDown size={12}/> : props.sort.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>;
  return <div className="nf-table-shell"><div className="nf-table-scroll"><table className="nf-table"><thead><tr><th className="nf-check-cell col-check"><input aria-label={t("notes.selecionar_todos")} type="checkbox" checked={props.nfs.length > 0 && props.nfs.every(nf => props.selected.includes(nf.id))} onChange={event => props.onSelectAll(event.target.checked ? props.nfs.map(nf => nf.id) : [])}/></th><th className="col-status">{t("notes.status_2")}</th>{fields.map(([key, label]) => <th key={key} className={`${key === 'data' ? 'col-data' : key === 'numero' ? 'col-nf' : key === 'fornecedor' ? 'col-fornecedor' : key === 'volumes' ? 'col-vol' : key === 'peso' ? 'col-peso' : 'col-valor'}${key === 'volumes' || key === 'peso' || key === 'valor' ? ' text-right' : ''}`}><button type="button" className={`nf-sort-button ${props.sort.key === key ? 'is-active' : ''}`} onClick={() => props.onSort(key)} aria-label={`Ordenar por ${label}`}>{label}{icon(key)}</button></th>)}<th className="col-acoes text-right">{t("notes.acoes")}</th></tr></thead><tbody>
    {props.loading ? Array.from({ length: 5 }, (_, index) => <tr className="nf-skeleton-row" key={index}><td colSpan={8}><span/></td></tr>) : props.nfs.length ? props.nfs.map(nf => <NfRow key={nf.id} stale={props.staleById?.get(nf.id)} divergent={props.divergentById?.has(nf.id)} divergenceTitle={props.divergentById?.get(nf.id)} staleHours={props.staleHours ?? 0} allowDelete={props.allowDelete} reveal={props.revealId === nf.id} nf={nf} selected={props.selected.includes(nf.id)} onSelect={props.onSelect} onStatus={props.onStatus} onEdit={props.onEdit} onDelete={props.onDelete} onDispatch={props.onDispatch} onUndo={props.onUndo} onPrint={props.onPrint}/>) : <tr><td colSpan={8}><EmptyState icon={<FileX2 size={22}/>} title={props.hasFilters ? 'Nenhuma nota encontrada com estes filtros' : 'Nenhuma nota expedida no período'} description={props.hasFilters ? 'Ajuste a busca, o status ou o período.' : undefined} action={props.hasFilters && props.onClearFilters ? <Button variant="secondary" size="sm" onClick={props.onClearFilters}>Limpar filtros</Button> : undefined}/></td></tr>}
    </tbody></table></div><div className="nf-table-footer">{props.loading ? t('notes.loading_invoices') : `${props.nfs.length} ${t(props.nfs.length === 1 ? 'notes.invoices_on_page' : 'notes.invoices_on_page_plural')} ${t('notes.on_this_page')}`}</div></div>;
}
