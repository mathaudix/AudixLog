import { useI18n } from './../../i18n/I18nProvider';
import { Button } from '../ui/Button';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { NotaFiscal } from '../../types';
import { formatCurrency } from '../../utils/format';
import { buildBranchSeries, sortBranchesNaturally } from './branchChartData';

type Metric = 'nfs' | 'volumes' | 'peso' | 'valor';
type Mode = 'accumulated' | 'period';
type ChartRow = { bucket: number; label: string; [branch: string]: string | number };
type DatedNotaFiscal = NotaFiscal & { createdAt?: Date | string | { seconds?: number; toDate?: () => Date } };
const metricLabels: Record<Metric, string> = { nfs: 'NFs', volumes: 'Volumes', peso: 'Peso (kg)', valor: 'Valor (R$)' };
const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const dayFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
function getMetricValue(nf: NotaFiscal, metric: Metric): number { return metric === 'nfs' ? 1 : metric === 'volumes' ? Number(nf.volumes) || 0 : metric === 'peso' ? Number(nf.peso) || 0 : Number(nf.valor) || 0; }
function axisValue(value: number, metric: Metric): string { return metric === 'valor' ? new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: 'BRL' }).format(value) : numberFormat.format(value); }
function tooltipValue(value: number, metric: Metric): string { return metric === 'valor' ? formatCurrency(value) : `${numberFormat.format(value)}${metric === 'peso' ? ' kg' : ''}`; }
function parseLocalDate(value: string): Date | null { const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value); if (!match) return null; const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])); return Number.isNaN(date.getTime()) ? null : date; }
function noteDateTime(nf: NotaFiscal): Date | null {
  const raw = (nf as DatedNotaFiscal).createdAt;
  let date: Date | null = null;
  if (raw instanceof Date) date = raw;
  else if (typeof raw === 'string' && raw) { const parsed = new Date(raw); if (!Number.isNaN(parsed.getTime())) date = parsed; }
  else if (raw && typeof raw === 'object' && typeof raw.toDate === 'function') date = raw.toDate();
  else if (raw && typeof raw === 'object' && typeof raw.seconds === 'number') date = new Date(raw.seconds * 1000);
  if (date && !Number.isNaN(date.getTime())) return date;
  return parseLocalDate(nf.data);
}
function dateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function weekStart(date: Date): Date { const result = new Date(date.getFullYear(), date.getMonth(), date.getDate()); result.setDate(result.getDate() - ((result.getDay() + 6) % 7)); return result; }
function ChartTooltip({ active, payload, label, metric, hidden }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; metric: Metric; hidden: Set<string> }) {
  if (!active || !payload?.length) return null;
  const values = payload.filter(item => !hidden.has(item.name)).sort((a, b) => b.value - a.value);
  return <div className="min-w-44 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface p-3 shadow-xl"><p className="sticky top-0 mb-2 bg-surface text-xs font-semibold text-fg">{label}</p><div className="space-y-1.5">{values.map(item => <div key={item.name} className="flex items-center justify-between gap-5 text-xs"><span className="flex items-center gap-2 text-muted"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}/>{item.name}</span><b className="tabular-nums text-fg">{tooltipValue(Number(item.value), metric)}</b></div>)}</div></div>;
}
function readPreference<T extends string>(key: string, fallback: T, allowed: readonly T[]): T { try { const value = localStorage.getItem(key); return allowed.includes(value as T) ? value as T : fallback; } catch { return fallback; } }

export function BarChart({ nfs, startDate, endDate, onSelect }: { nfs: NotaFiscal[]; startDate: string; endDate: string; onSelect: (branch: string) => void }) {
 const { t } = useI18n();
  const [metric, setMetric] = useState<Metric>(() => readPreference('audixlog.branch-chart.metric', 'nfs', ['nfs', 'volumes', 'peso', 'valor']));
  const [mode, setMode] = useState<Mode>(() => readPreference('audixlog.branch-chart.mode', 'accumulated', ['accumulated', 'period']));
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  useEffect(() => { try { localStorage.setItem('audixlog.branch-chart.metric', metric); } catch { /* Preferência opcional. */ } }, [metric]);
  useEffect(() => { try { localStorage.setItem('audixlog.branch-chart.mode', mode); } catch { /* Preferência opcional. */ } }, [mode]);
  const { rows, branches, granularity } = useMemo(() => {
    const valid = nfs.map(nf => ({ nf, date: noteDateTime(nf) })).filter((item): item is { nf: NotaFiscal; date: Date } => Boolean(item.nf.filial?.trim()) && item.nf.status === 'recebido' && item.date !== null && (!startDate || dateKey(item.date) >= startDate) && (!endDate || dateKey(item.date) <= endDate));
    const totals = new Map<string, number>();
    valid.forEach(({ nf }) => { const branch = nf.filial!.trim().toUpperCase(); totals.set(branch, (totals.get(branch) ?? 0) + getMetricValue(nf, metric)); });
    const branchNames = sortBranchesNaturally([...totals.keys()]);
    if (!valid.length) return { rows: [] as ChartRow[], branches: branchNames, granularity: 'day' as const };
    const minData = new Date(Math.min(...valid.map(item => item.date.getTime())));
    const maxData = new Date(Math.max(...valid.map(item => item.date.getTime())));
    const dataStart = new Date(minData.getFullYear(), minData.getMonth(), minData.getDate());
    const dataEnd = new Date(maxData.getFullYear(), maxData.getMonth(), maxData.getDate());
    const requestedStart = startDate ? parseLocalDate(startDate) ?? dataStart : dataStart;
    const requestedEnd = endDate ? parseLocalDate(endDate) ?? dataEnd : new Date();
    const end = new Date(requestedEnd.getFullYear(), requestedEnd.getMonth(), requestedEnd.getDate());
    const requestedStartDay = new Date(requestedStart.getFullYear(), requestedStart.getMonth(), requestedStart.getDate());
    const spanDays = Math.floor((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(requestedStartDay.getFullYear(), requestedStartDay.getMonth(), requestedStartDay.getDate())) / 86400000);
    const granularity = spanDays > 62 ? 'week' : 'day';
    const start = spanDays < 6 ? new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6) : requestedStartDay;
    const buckets = new Map<number, ChartRow>();
    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (granularity === 'day') {
      for (let date = new Date(cursor); date <= last; date.setDate(date.getDate() + 1)) { const bucket = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const time = bucket.getTime(); buckets.set(time, { bucket: time, label: dayFormat.format(bucket), ...Object.fromEntries(branchNames.map(name => [name, 0])) }); }
    } else {
      cursor = weekStart(cursor); const lastWeek = weekStart(last);
      for (let date = new Date(cursor); date <= lastWeek; date.setDate(date.getDate() + 7)) { const bucket = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const time = bucket.getTime(); buckets.set(time, { bucket: time, label: dayFormat.format(bucket), ...Object.fromEntries(branchNames.map(name => [name, 0])) }); }
    }
    valid.forEach(({ nf, date }) => {
      const bucketDate = granularity === 'day' ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : weekStart(date);
      const row = buckets.get(bucketDate.getTime());
      if (!row) return;
      const branch = nf.filial!.trim().toUpperCase();
      row[branch] = Number(row[branch] ?? 0) + getMetricValue(nf, metric);
    });
    let running = Object.fromEntries(branchNames.map(name => [name, 0])) as Record<string, number>;
    const chartRows = [...buckets.values()].sort((a, b) => a.bucket - b.bucket).map(row => {
      if (mode === 'period') return row;
      const next = { ...row };
      branchNames.forEach(name => { const total = (running[name] ?? 0) + Number(row[name] ?? 0); running[name] = total; next[name] = total; });
      return next;
    });
    return { rows: chartRows, branches: branchNames, granularity };
  }, [nfs, startDate, endDate, metric, mode]);
  const toggle = (branch: string) => setHidden(current => { const next = new Set(current); if (next.has(branch)) next.delete(branch); else next.add(branch); return next; });
  const showAll = () => setHidden(new Set());
  const hideAll = () => setHidden(new Set(branches));
  const colors = useMemo(() => new Map(buildBranchSeries(branches).map(item => [item.name, item.color])), [branches]);
  const displayedRows = useMemo(() => rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'number' && key !== 'bucket' && hidden.has(key) ? 0 : value])) as ChartRow), [rows, hidden]);
  return <section className="flex min-w-0 min-h-[260px] flex-col rounded-xl border border-border bg-surface p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="card-title">{t("stats.evolucao_por_filial")}</h2><p className="card-subtitle mt-0.5">{mode === 'accumulated' ? t('stats.chart_total_acumulado') : 'Movimento em cada período'}</p></div>
      <div className="flex items-center gap-1.5"><select aria-label={t("stats.metrica_do_grafico")} value={metric} onChange={event => setMetric(event.target.value as Metric)} className="ui-input !h-8 !w-auto !py-0 !pr-7 text-[13px] font-medium">{(Object.keys(metricLabels) as Metric[]).map(key => <option key={key} value={key}>{metricLabels[key]}</option>)}</select><div role="group" aria-label={t("stats.modo_de_visualizacao")} className="flex gap-1"><Button type="button" size="sm" variant={mode === 'accumulated' ? 'soft' : 'ghost'} onClick={() => setMode('accumulated')} aria-pressed={mode === 'accumulated'}>{t("stats.acumulado")}</Button><Button type="button" size="sm" variant={mode === 'period' ? 'soft' : 'ghost'} onClick={() => setMode('period')} aria-pressed={mode === 'period'}>{t("stats.por_periodo")}</Button></div></div>
    </div>
    {rows.length === 0 ? <div className="grid flex-1 min-h-[170px] place-items-center text-sm text-muted">{t("stats.sem_dados_por_filial_no_periodo")}</div> : <>
      <div className="mt-2 h-[170px] w-full" aria-label={`Gráfico acumulado por filial, métrica ${metricLabels[metric]}`}>
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={displayedRows} margin={{ top: 7, right: 8, left: 0, bottom: 0 }}>
          <defs>{branches.map((branch, index) => <linearGradient key={branch} id={`branch-fill-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.get(branch)} stopOpacity={0.12}/><stop offset="100%" stopColor={colors.get(branch)} stopOpacity={0}/></linearGradient>)}</defs>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false}/>
          <XAxis dataKey="label" tick={{ fill: 'var(--chart-muted)', fontSize: 9 }} axisLine={false} tickLine={false} minTickGap={18}/>
          <YAxis width={42} domain={[0, 'auto']} tickFormatter={value => axisValue(Number(value), metric)} tick={{ fill: 'var(--chart-muted)', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={metric !== 'nfs' && metric !== 'volumes'}/>
          <Tooltip content={<ChartTooltip metric={metric} hidden={hidden}/>} cursor={{ stroke: 'var(--chart-grid)', strokeDasharray: '3 4' }}/>
          {branches.map((branch, index) => hidden.has(branch) ? null : <Area key={branch} type="monotone" dataKey={branch} name={branch} stroke={colors.get(branch)} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill={`url(#branch-fill-${index})`} connectNulls activeDot={{ r: 5, strokeWidth: 1, fill: colors.get(branch), stroke: colors.get(branch) }} dot={false} animationDuration={700}/>) }
        </AreaChart></ResponsiveContainer>
      </div>
      <div className="mt-1 flex min-h-0 flex-col gap-1"><div className="flex shrink-0 justify-end gap-2"><Button type="button" size="sm" variant="ghost" onClick={showAll}>{t("stats.mostrar_todas")}</Button><Button type="button" size="sm" variant="ghost" onClick={hideAll}>{t("stats.ocultar_todas")}</Button></div><div className="max-h-16 overflow-y-auto"><div className="flex flex-wrap gap-x-3 gap-y-1">{branches.map(branch => <Button key={branch} type="button" onClick={() => toggle(branch)} onDoubleClick={() => onSelect(branch)} title={`Clique para ${hidden.has(branch) ? 'mostrar' : 'ocultar'} ${branch}; duplo clique para filtrar`} size="sm" variant="ghost" className={`!h-7 !px-1.5 gap-1.5 transition-opacity ${hidden.has(branch) ? 'opacity-40' : 'text-fg'}`}><i className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.get(branch) }}/>{branch}</Button>)}</div></div></div>
      <p className="card-subtitle mt-1 text-[12px]">{t("stats.clique_na_legenda_para_ocultar_mostrar_duplo_cli")} {granularity === 'day' ? 'por dia' : 'por semana'}</p>
    </>}
  </section>;
}
