import { useI18n } from './../../i18n/I18nProvider';
import { Button } from '../ui/Button';
import { useState } from 'react';
import type { NfStats } from '../../types';
import { BadgeCheck, CircleAlert, Clock3, Truck } from 'lucide-react';
import { STATUS_STYLES } from '../../utils/statusStyles';

type StatusKey = 'pendente' | 'conferida' | 'divergente' | 'expedidas';
interface Segment { key: StatusKey; label: string; value: number; color: string; icon: typeof Clock3 }
const STATUS_ICONS: Record<StatusKey, typeof Clock3> = { pendente: Clock3, conferida: BadgeCheck, divergente: CircleAlert, expedidas: Truck };

export function DonutChart({ stats, onFilter }: { stats: NfStats; onFilter: (status: StatusKey) => void }) {
 const { t } = useI18n();
  const [active, setActive] = useState<StatusKey | null>(null);
  const data: Segment[] = [
    { key: 'conferida', label: 'Conferidas', value: stats.conferidas, color: STATUS_STYLES.conferida.hex, icon: STATUS_ICONS.conferida },
    { key: 'divergente', label: 'Divergentes', value: stats.divergentes, color: STATUS_STYLES.divergente.hex, icon: STATUS_ICONS.divergente },
    { key: 'expedidas', label: 'Expedidas', value: stats.expedidas, color: STATUS_STYLES.expedidas.hex, icon: STATUS_ICONS.expedidas },
    { key: 'pendente', label: 'Pendentes', value: stats.pendentesConf, color: STATUS_STYLES.pendente.hex, icon: STATUS_ICONS.pendente },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return <section className="flex min-w-0 min-h-[260px] flex-col rounded-xl border border-border bg-surface p-4 shadow-sm">
    <div><h2 className="text-sm font-semibold text-fg">{t("stats.status_das_notas")}</h2><p className="mt-0.5 text-[11px] text-muted">{t("stats.distribuicao_por_situacao")}</p></div>
    <div className="my-auto grid grid-cols-[132px_minmax(0,1fr)] items-center gap-3 sm:gap-4">
      <div className="relative h-[132px] w-[132px] shrink-0" role="img" aria-label={`Distribuição de ${total} notas fiscais por status`}>
        <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90 overflow-visible">
          <circle cx="20" cy="20" r={radius} fill="none" stroke="var(--chart-track)" strokeWidth="2.7" />
          {total > 0 && data.map(item => {
            const share = item.value / total;
            const visibleLength = Math.max(0, share * circumference - 1.8);
            const currentOffset = offset;
            offset += share * circumference;
            const highlighted = active === null || active === item.key;
            return item.value > 0 ? <circle key={item.key} cx="20" cy="20" r={radius} fill="none" stroke={item.color}
              strokeWidth={active === item.key ? 3.5 : 2.8} strokeLinecap="round"
              strokeDasharray={`${visibleLength} ${circumference - visibleLength}`} strokeDashoffset={-currentOffset}
              opacity={highlighted ? 1 : 0.28} className="chart-donut-segment cursor-pointer transition-all duration-500 ease-out"
              onMouseEnter={() => setActive(item.key)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(item.key)} onBlur={() => setActive(null)} onClick={() => onFilter(item.key)}
              role="button" tabIndex={0} aria-label={`${item.label}: ${item.value} (${Math.round(share * 100)}%)`}>
              <title>{`${item.label}: ${item.value} · ${(share * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</title>
            </circle> : null;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid content-center justify-items-center text-center">
          <strong className="tabular-nums text-2xl font-bold tracking-tight text-fg">{total.toLocaleString('pt-BR')}</strong>
          <span className="mt-0.5 text-[10px] font-medium text-muted">{t("notes.notas_fiscais")}</span>
        </div>
      </div>
      <div className="grid min-w-0 gap-0.5">
        {data.map(item => {
          const percent = total ? item.value / total * 100 : 0;
          const Icon = item.icon;
          const dimmed = active !== null && active !== item.key;
          return <Button key={item.key} type="button" onClick={() => onFilter(item.key)} onMouseEnter={() => setActive(item.key)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(item.key)} onBlur={() => setActive(null)} title={`${item.label}: ${item.value} notas fiscais`}
            className={`group flex min-h-7 items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${dimmed ? 'opacity-45' : ''}`}>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md" style={{ color: item.color, backgroundColor: `${item.color}18` }}><Icon size={12}/></span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-fg">{item.label}</span>
            <span className="tabular-nums text-[11px] font-semibold text-fg">{item.value.toLocaleString('pt-BR')}</span>
            <span className="w-8 text-right tabular-nums text-[10px] text-muted">{percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
          </Button>;
        })}
        {total === 0 && <p className="px-1.5 text-[11px] text-muted">{t("stats.nenhuma_nota_fiscal_para_exibir")}</p>}
      </div>
    </div>
  </section>;
}
