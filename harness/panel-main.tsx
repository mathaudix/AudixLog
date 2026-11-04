// Painel de conferencia (so desenvolvimento): sidebar + filtros + grafico + tabela com mock. Sem Firebase.
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '../src/styles/tokens.css';
import '../src/styles.css';
import '../src/redesign.css';
import '../src/styles/sidebar.css';
import '../src/styles/controls.css';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { Sidebar } from '../src/components/layout/Sidebar';
import { NfFilters } from '../src/components/nf/NfFilters';
import { NfTable } from '../src/components/nf/NfTable';
import { BarChart } from '../src/components/stats/BarChart';
import { DonutChart } from '../src/components/stats/DonutChart';
import { PageHeader } from '../src/components/ui/system';
import type { Filters, NotaFiscal } from '../src/types';

const params = new URLSearchParams(location.search);
if (params.get('theme') === 'dark') document.documentElement.classList.add('dark');
const empty = params.get('empty') === '1';
const filtered = params.get('filtered') === '1';

const base = {
  data: '2026-11-03', chaveAcesso: '35261112345678000190550010000012341000012345', serie: '1',
  responsavel: 'Matheus', produtos: '2 x Caixa grande', obs: '', historico: [],
};
const nfs: NotaFiscal[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L1', 'L2'].map((filial, i) => ({
  ...base, id: String(i + 1), numero: String(10231 + i), fornecedor: `Fornecedor ${i + 1} Ltda`,
  volumes: 1 + i, peso: 100 + i * 20, valor: 2000 + i * 500,
  statusConferencia: (['conferida', 'pendente', 'divergente'] as const)[i % 3], status: 'expedido', filial,
}));
const rows = empty ? [] : nfs;
const chartRows: NotaFiscal[] = empty ? [] : ['L1', 'L2', 'L3', 'L4', 'L5', 'L1', 'L2', 'L3'].map((filial, i) => ({ ...base, id: `r${i}`, numero: String(20231 + i), fornecedor: `Recebida ${i}`, volumes: 2, peso: 90 + i * 7, valor: 1500 + i * 300, statusConferencia: 'pendente', status: 'recebido', filial, data: `2026-10-${String(3 + i * 3).padStart(2, '0')}` }));
const stats = { totalEstoque: rows.length, expedidas: rows.length, pendentesConf: rows.filter(n => n.statusConferencia === 'pendente').length, conferidas: rows.filter(n => n.statusConferencia === 'conferida').length, divergentes: rows.filter(n => n.statusConferencia === 'divergente').length };
const branches = ['L1', 'L2', 'L3', 'L4', 'L5'];

function Panel() {
  const [filters, setFilters] = useState<Filters>({ search: filtered ? 'Fornecedor' : '', startDate: filtered ? '2026-11-01' : '', endDate: '', status: filtered ? 'pendente' : 'todos', filial: '' });
  const noop = () => undefined;
  return <div className="app-shell flex h-[100dvh] min-w-0 overflow-hidden">
    <Sidebar tab="expedidas" expanded={false} onToggle={noop} onTab={noop} onRateio={noop} onSettings={noop} onLabelEditor={noop} />
    <main className="min-w-0 flex-1 overflow-y-auto p-6">
      <PageHeader title="Notas expedidas" description="Notas enviadas no periodo selecionado." />
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-4">
          <NfFilters filters={filters} onChange={setFilters} branches={branches} />
          <NfTable hasFilters={filtered} onClearFilters={() => setFilters({ search: '', startDate: '', endDate: '', status: 'todos', filial: '' })} allowDelete={false} nfs={rows} selected={[]} onSelect={noop} onSelectAll={noop} onStatus={noop} onEdit={noop} onDelete={noop} onDispatch={noop} onUndo={noop} onPrint={noop} sort={{ key: 'data', direction: 'desc' }} onSort={noop} />
        </div>
        <div className="space-y-4">
          <DonutChart stats={stats} onFilter={noop} />
          <BarChart nfs={chartRows} startDate="2026-10-01" endDate="2026-11-30" onSelect={noop} />
        </div>
      </div>
    </main>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><I18nProvider><Panel /></I18nProvider></React.StrictMode>,
);
