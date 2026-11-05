import { useI18n } from './../../i18n/I18nProvider';
import { Button } from '../ui/Button';
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Scale, AlarmClock, AlertTriangle, Check, ChevronDown, Clock3, Copy, PackageCheck, Pencil, Printer, Trash2, Truck, Undo2 } from 'lucide-react';
import type { NotaFiscal, StatusConferencia } from '../../types';
import { formatCurrency, formatDateDisplay } from '../../utils/format';
import { formatStaleDuration, type StaleInfo } from '../../utils/staleness';
import { branchChipStyle, getStatusIconTone, getStatusStyle } from '../../utils/statusStyles';
import { NfHistoryTimeline } from './NfHistoryTimeline';
import { Tooltip } from '../ui/Tooltip';
import { StatusPill } from '../ui/system';

interface Props {
  allowDelete: boolean; nf: NotaFiscal; selected: boolean; reveal?: boolean;
  onSelect: (id: string) => void; onStatus: (id: string, status: StatusConferencia) => void;
  onEdit: (nf: NotaFiscal) => void; onDelete: (nf: NotaFiscal) => void;
  onDispatch: (nf: NotaFiscal) => void; onUndo: (nf: NotaFiscal) => void; onPrint: (nf: NotaFiscal) => void;
  stale?: StaleInfo; staleHours?: number; divergent?: boolean; divergenceTitle?: string;
}
function StatusControl({ nf, onStatus }: { nf: NotaFiscal; onStatus: Props['onStatus'] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = nf.statusConferencia;
  const style = getStatusStyle(status);
  const options = [
    { value: 'pendente' as const, label: 'Pendente', Icon: Clock3, color: 'text-warning' },
    { value: 'conferida' as const, label: 'Conferida', Icon: PackageCheck, color: 'text-success' },
    { value: 'divergente' as const, label: 'Divergente', Icon: AlertTriangle, color: 'text-danger' },
  ];
  const current = options.find(option => option.value === status) ?? { value: 'pendente' as const, label: style.label, Icon: Clock3, color: 'text-warning' };
  const Icon = current.Icon;
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const r = wrapperRef.current?.getBoundingClientRect();
      if (!r) return;
      const menuH = menuRef.current?.offsetHeight ?? 150;
      const menuW = menuRef.current?.offsetWidth ?? 160;
      const below = r.bottom + 4;
      const top = below + menuH > window.innerHeight && r.top - 4 - menuH > 0 ? r.top - 4 - menuH : below;
      const left = Math.min(Math.max(8, r.left), window.innerWidth - menuW - 8);
      setPos({ top, left });
    };
    place();
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); wrapperRef.current?.querySelector('button')?.focus(); }
    };
    const onClose = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [open]);
  return <div ref={wrapperRef} className="relative inline-flex"><Tooltip content={style.label}><Button type="button" variant="soft" size="sm" iconOnly className={`h-8 w-8 rounded-[10px] border-0 bg-transparent shadow-none hover:bg-surface-2 ${getStatusIconTone(status)}`} aria-label={`Status ${style.label}. Alterar status da NF ${nf.numero}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><Icon size={17} strokeWidth={2.2}/></Button></Tooltip>{open && createPortal(<div ref={menuRef} role="menu" aria-label={`Alterar status da NF ${nf.numero}`} style={{ position: 'fixed', top: pos?.top ?? 0, left: pos?.left ?? 0, zIndex: 60, visibility: pos ? 'visible' : 'hidden' }} className="min-w-36 rounded-xl border border-border bg-surface p-1 shadow-lg">{options.map(({ value, label, Icon: OptionIcon, color }) => <button key={value} type="button" role="menuitemradio" aria-checked={status === value} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-fg hover:bg-surface-2" onClick={() => { onStatus(nf.id, value); setOpen(false); }}><OptionIcon size={16} className={color}/><span>{label}</span></button>)}</div>, document.body)}</div>;
}
function Row({ allowDelete, nf, selected, reveal = false, onSelect, onStatus, onEdit, onDelete, onDispatch, onUndo, onPrint, stale, staleHours = 0, divergent = false, divergenceTitle }: Props) {
 const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const isExpanded = expanded || reveal;
  useEffect(() => { if (reveal) document.querySelector(`[data-nf-id=\"${CSS.escape(nf.id)}\"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [reveal, nf.id]);
  const [copied, setCopied] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const toggle = () => setExpanded(value => !value);
  const copyAccessKey = async () => { if (!nf.chaveAcesso) return; try { await navigator.clipboard.writeText(nf.chaveAcesso); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } };
  const productLines = (nf.produtos || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const parsedProducts = productLines.map(line => { const match = line.match(/^(\d+(?:[.,]\d+)?)\s*[x×]\s*(.+)$/i); return match ? { quantity: match[1] ?? '', description: (match[2] ?? '').trim() } : null; });
  const productsParsed = productLines.length > 0 && parsedProducts.every(item => item !== null);
  const visibleProducts = showAllProducts ? parsedProducts : parsedProducts.slice(0, 5);
  const divergenceBadge = divergent ? <StatusPill tone="warning" className="w-fit"><span title={divergenceTitle} className="inline-flex items-center gap-1"><Scale size={13} aria-hidden="true" />{t('notes.divergent_badge')}</span></StatusPill> : null;
  const staleDuration = stale?.stale ? formatStaleDuration(stale.ms) : null;
  const staleBadge = staleDuration ? <StatusPill tone="danger" className="w-fit"><span title={t('notes.stale_title', { hours: staleHours })} className="inline-flex items-center gap-1"><AlarmClock size={14} className="!text-danger"/>{staleDuration.d > 0 ? t('notes.stale_days_hours', { d: staleDuration.d, h: staleDuration.h }) : t('notes.stale_hours_minutes', { h: staleDuration.h, m: staleDuration.m })}</span></StatusPill> : null;
  const actions = <div className="nf-actions" role="group" aria-label={t('notes.actions_for_invoice', { number: nf.numero })}>{nf.status === 'recebido' ? <><Tooltip content="Expedir"><Button variant="ghost" size="sm" iconOnly title={t("notes.expedir")} aria-label={`Expedir NF ${nf.numero}`} onClick={() => onDispatch(nf)}><Truck size={16}/></Button></Tooltip><Tooltip content="Editar"><Button variant="ghost" size="sm" iconOnly title={t("notes.editar")} aria-label={`Editar NF ${nf.numero}`} onClick={() => onEdit(nf)}><Pencil size={16}/></Button></Tooltip>{allowDelete && <Tooltip content="Excluir"><Button variant="danger-ghost" size="sm" iconOnly className="nf-delete-action" title={t("notes.excluir")} aria-label={`Excluir nota fiscal ${nf.numero}`} onClick={() => onDelete(nf)}><Trash2 size={16}/></Button></Tooltip>}</> : <Tooltip content="Estornar expedição"><Button variant="ghost" size="sm" iconOnly title={t("notes.estornar_expedicao")} aria-label={`Estornar NF ${nf.numero}`} onClick={() => onUndo(nf)}><Undo2 size={16}/></Button></Tooltip>}<Tooltip content="Imprimir etiqueta"><Button variant="ghost" size="sm" iconOnly title={t("notes.imprimir_etiqueta")} aria-label={`Imprimir NF ${nf.numero}`} onClick={() => onPrint(nf)}><Printer size={16}/></Button></Tooltip></div>;
  return <>
    <tr data-nf-id={nf.id} className={`nf-desktop-row ${selected ? 'nf-row-selected' : ''} ${isExpanded ? 'is-expanded' : ''}`}>
      <td className="nf-check-cell col-check"><input aria-label={`Selecionar NF ${nf.numero}`} type="checkbox" checked={selected} onChange={() => onSelect(nf.id)}/></td><td className="col-status"><StatusControl nf={nf} onStatus={onStatus}/></td>
      <td className="col-data nf-date-cell">{formatDateDisplay(nf.data)}</td><td className="col-nf"><Button className="nf-number-button" onClick={toggle} aria-expanded={isExpanded}><span className="nf-number">{nf.numero}</span><ChevronDown size={14} className={`nf-expand-chevron ${expanded ? 'is-open' : ''}`}/></Button></td>
      <td className="col-fornecedor"><div className="nf-supplier" title={nf.fornecedor}>{nf.fornecedor}</div>{staleBadge}{divergenceBadge}{nf.filial && <span className="nf-branch-badge branch-chip" style={branchChipStyle(nf.filial)}>{nf.filial}</span>}</td>
      <td className="nf-numeric col-vol">{nf.volumes}</td><td className="nf-numeric col-peso">{Number(nf.peso || 0).toLocaleString('pt-BR')}  {t("notes.kg")}</td><td className="nf-numeric nf-money col-valor">{formatCurrency(nf.valor)}</td><td className="nf-actions-cell col-acoes">{actions}</td>
    </tr>
    <tr data-nf-id={nf.id} className={`nf-mobile-row ${selected ? 'nf-row-selected' : ''} ${isExpanded ? 'is-expanded' : ''}`}><td colSpan={8}><article className="nf-mobile-card">
      <div className="nf-mobile-top"><label className="nf-mobile-number"><input aria-label={`Selecionar NF ${nf.numero}`} type="checkbox" checked={selected} onChange={() => onSelect(nf.id)}/><Button className="nf-number-button" onClick={toggle} aria-expanded={isExpanded}><span className="nf-number">{t("notes.nf")} {nf.numero}</span><span className="nf-date">{formatDateDisplay(nf.data)}</span><ChevronDown size={14} className={`nf-expand-chevron ${expanded ? 'is-open' : ''}`}/></Button></label><StatusControl nf={nf} onStatus={onStatus}/></div>
      <div className="nf-mobile-supplier" title={nf.fornecedor}>{nf.fornecedor}</div><div className="nf-mobile-facts">{nf.filial && <span className="nf-branch-badge branch-chip" style={branchChipStyle(nf.filial)}>{nf.filial}</span>}{staleBadge}{divergenceBadge}<span>{nf.volumes}  {t("notes.vol")}</span><span>{Number(nf.peso || 0).toLocaleString('pt-BR')}  {t("notes.kg")}</span><b>{formatCurrency(nf.valor)}</b></div>{actions}
    </article></td></tr>
    {isExpanded && <tr className="nf-expanded-row"><td colSpan={8}><div className="nf-expanded-grid"><section className="nf-detail-grid" aria-label={t("notes.detalhes_da_nota")}><div><span>{t("notes.responsavel_2")}</span><b>{nf.responsavel || '—'}</b></div><div className="nf-detail-wide"><span>{t("notes.chave_de_acesso")}</span><div className="nf-key-value"><b className="break-all">{nf.chaveAcesso || '—'}</b>{nf.chaveAcesso && <Tooltip content={copied ? 'Copiado' : t('notes.copiar_chave')}><Button type="button" variant="ghost" size="sm" iconOnly className="nf-copy-button" title={copied ? 'Copiado' : t('notes.copiar_chave')} aria-label={t("notes.copiar_chave_de_acesso")} onClick={() => void copyAccessKey()}>{copied ? <Check size={15}/> : <Copy size={15}/>}</Button></Tooltip>}</div></div><div className="nf-detail-wide"><span>{t("notes.produtos")}</span>{productsParsed ? <div className="nf-product-list">{visibleProducts.map((item, index) => item && <div className="nf-product-item" key={`${item.quantity}-${index}`}><span className="nf-product-quantity">{item.quantity}</span><span>{item.description}</span></div>)}{parsedProducts.length > 5 && <Button type="button" variant="ghost" className="nf-products-toggle" onClick={() => setShowAllProducts(value => !value)}>{showAllProducts ? 'Mostrar menos' : `mais ${parsedProducts.length - 5}`}</Button>}</div> : <b>{nf.produtos || '—'}</b>}</div><div className="nf-detail-wide"><span>{t("notes.observacoes")}</span><b>{nf.obs || '—'}</b></div>{nf.foto && <img src={nf.foto} alt="Anexo da nota" className="nf-attachment"/>}</section><NfHistoryTimeline entries={nf.historico}/></div></td></tr>}
  </>;
}
export const NfRow = memo(Row);
