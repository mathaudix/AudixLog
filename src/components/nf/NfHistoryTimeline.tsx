import { useI18n } from './../../i18n/I18nProvider';
import { Button } from '../ui/Button';
import { useState } from 'react';
import { Archive, Clock3, Edit3, PackagePlus, UserRound, UserRoundCog, Truck, Undo2, Check } from 'lucide-react';
import type { HistoryAction, HistoryEntry } from '../../types';
import { formatDateTime } from '../../utils/format';
import { getStatusStyle } from '../../utils/statusStyles';
const actionMeta: Record<HistoryAction, { label: string; Icon: typeof Clock3; color: string }> = {
  criada: { label: 'notes.action_created', Icon: PackagePlus, color: 'text-success' }, importada: { label: 'notes.action_imported', Icon: PackagePlus, color: 'text-primary' }, editada: { label: 'notes.action_edited', Icon: Edit3, color: 'text-primary' }, status: { label: 'notes.action_status', Icon: Check, color: 'text-warning' }, responsavel: { label: 'notes.action_assignee', Icon: UserRoundCog, color: 'text-primary' }, expedida: { label: 'notes.action_dispatched', Icon: Truck, color: 'text-primary' }, estorno_expedicao: { label: 'notes.action_dispatch_reversed', Icon: Undo2, color: 'text-warning' }, arquivada: { label: 'notes.action_archived', Icon: Archive, color: 'text-tertiary' },
};
function asDate(value: HistoryEntry['at']): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const date = new Date(value as unknown as string | number | Date); return Number.isNaN(date.getTime()) ? null : date;
}
function relativeTime(value: HistoryEntry['at'], t: (key: string, vars?: Record<string, string | number>) => string): string {
  const date = asDate(value); if (!date) return t('notes.unavailable_date'); const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return t('notes.agora'); if (seconds < 3600) return t('notes.ha_minutos', { n: Math.floor(seconds / 60) }); if (seconds < 86400) return t('notes.ha_horas', { n: Math.floor(seconds / 3600) }); if (seconds < 2592000) return t('notes.ha_dias', { n: Math.floor(seconds / 86400) }); return `há ${Math.floor(seconds / 2592000)} mês`;
}
const fieldLabels = (t: (key: string) => string): Record<string, string> => ({
  numero: t('notes.field_number'), fornecedor: t('notes.field_supplier'), data: t('notes.field_date'), filial: t('notes.field_branch'), volumes: t('notes.field_volumes'), peso: t('notes.field_weight'), valor: t('notes.field_value'),
  status: t('notes.field_logistics_status'), statusconferencia: t('notes.field_checking'), responsavel: t('notes.field_assignee'), responsvel: t('notes.field_assignee'),
  chaveacesso: t('notes.chave_acesso'), chave_acesso: t('notes.chave_acesso'), produtos: t('notes.field_products'), obs: t('notes.observacoes'), foto: t('notes.field_attachment'),
});
function actionTitle(item: HistoryEntry, t: (key: string) => string): string {
  const titles: Partial<Record<HistoryAction, string>> = { criada: 'notes.title_created', importada: 'notes.title_imported', editada: 'notes.title_edited', status: 'notes.title_status_changed', responsavel: 'notes.title_assignee_changed', expedida: 'notes.title_dispatched', estorno_expedicao: 'notes.title_dispatch_reversed', arquivada: 'notes.title_archived' };
  return t(titles[item.action] ?? actionMeta[item.action]?.label ?? item.action);
}
function clean(value: unknown): string { return String(value ?? '').trim(); }
function changeLines(item: HistoryEntry, t: (key: string) => string): string[] {
  return (item.changes ?? []).filter(change => {
    const from = clean(change.from); const to = clean(change.to);
    if (!from || !to || from === '—' || to === '—' || from === to) return false;
    if ((item.action === 'criada' || item.action === 'importada') && (!from || !to || from === '—' || to === '—')) return false;
    return true;
  }).slice(0, 2).map(change => {
    const rawField = change.field.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const labels = fieldLabels(t); const label = labels[rawField] ?? labels[rawField.replace(/_/g, '')] ?? change.field;
    const statusField = rawField.includes('status');
    const from = statusField ? getStatusStyle(change.from).label : clean(change.from);
    const to = statusField ? getStatusStyle(change.to).label : clean(change.to);
    return `${label}: ${from} → ${to}`;
  });
}
function eventText(item: HistoryEntry, t: (key: string) => string): string {
  const details = changeLines(item, t);
  return [actionTitle(item, t), ...details].join(' · ');
}
export function NfHistoryTimeline({ entries = [] }: { entries?: HistoryEntry[] }) {
 const { t } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const sorted = [...entries].sort((a, b) => (asDate(b.at)?.getTime() ?? 0) - (asDate(a.at)?.getTime() ?? 0));
  if (!sorted.length) return <section className="nf-history"><h3><Clock3 size={14}/>  {t("notes.historico")}</h3><p className="nf-history-empty">{t("notes.sem_historico_registrado")}</p></section>;
  const visible = showAll ? sorted : sorted.slice(0, 3);
  return <section className="nf-history"><h3><Clock3 size={14}/>  {t("notes.historico")}</h3><ol className={`nf-history-list ${showAll ? 'is-expanded' : ''}`}>{visible.map((item, index) => { const meta = actionMeta[item.action]; const Icon = meta?.Icon ?? UserRound; const full = formatDateTime(asDate(item.at)); const author = item.nome || item.email?.split('@')[0] || item.uid; return <li key={`${item.uid}-${full}-${index}`} title={`${eventText(item, t)} • ${item.email || item.uid} • ${full}`}><Icon size={14} className={`shrink-0 ${meta?.color ?? 'text-tertiary'}`} /><span className="nf-history-event">{eventText(item, t)}</span><span className="nf-history-author" title={item.email || item.uid}>{author}</span><time title={full}>{relativeTime(item.at, t)}</time></li>; })}</ol>{sorted.length > 3 && <Button type="button" className="nf-history-toggle" onClick={() => setShowAll(value => !value)}>{showAll ? t('notes.show_less') : t('notes.view_all_count', { count: sorted.length })}</Button>}</section>;
}
