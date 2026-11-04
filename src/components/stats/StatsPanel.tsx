import type { Filters, NfStats, NotaFiscal } from '../../types';
import { DonutChart } from './DonutChart';
import { BarChart } from './BarChart';

export function StatsPanel({ stats, nfs, filters, onStatus, onBranch }: { stats: NfStats; nfs: NotaFiscal[]; filters: Filters; onStatus: (status: 'pendente' | 'conferida' | 'divergente' | 'expedidas') => void; onBranch: (branch: string) => void }) {
  return <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"><DonutChart stats={stats} onFilter={onStatus}/><BarChart nfs={nfs} startDate={filters.startDate} endDate={filters.endDate} onSelect={onBranch}/></div>;
}
