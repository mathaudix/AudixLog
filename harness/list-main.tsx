// Lista de notas com dados mock (sem Firebase). Só para desenvolvimento.
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '../src/styles/tokens.css';
import '../src/styles.css';
import '../src/redesign.css';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { NfTable } from '../src/components/nf/NfTable';
import { Card, PageHeader } from '../src/components/ui/system';
import type { NotaFiscal } from '../src/types';

const params = new URLSearchParams(location.search);
if (params.get('theme') === 'dark') document.documentElement.classList.add('dark');

const base = {
  data: '2026-11-03', chaveAcesso: '35261112345678000190550010000012341000012345', serie: '1',
  responsavel: 'Matheus', produtos: '2 x Caixa grande\n1 x Fita adesiva', obs: '', historico: [],
};
const nfs: NotaFiscal[] = [
  { ...base, id: '1', numero: '10231', fornecedor: 'Fornecedor Alfa Ltda', volumes: 4, peso: 320, valor: 5000, statusConferencia: 'conferida', status: 'recebido', filial: 'L1' },
  { ...base, id: '2', numero: '10232', fornecedor: 'Fornecedor Beta S.A.', volumes: 2, peso: 180, valor: 3000, statusConferencia: 'pendente', status: 'recebido', filial: 'L2' },
  { ...base, id: '3', numero: '10233', fornecedor: 'Comercial Gama', volumes: 1, peso: 95.5, valor: 2000, statusConferencia: 'divergente', status: 'expedido', filial: 'L3' },
];

const noop = () => undefined;
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <main className="min-h-screen bg-bg p-6 text-fg">
        <div className="space-y-5">
          <PageHeader title="Notas fiscais" description="Estoque de notas recebidas, conferidas e expedidas." />
          <Card title="Notas em estoque" description="3 notas de exemplo">
            <NfTable
              allowDelete nfs={nfs} selected={[]}
              onSelect={noop} onSelectAll={noop} onStatus={noop} onEdit={noop} onDelete={noop}
              onDispatch={noop} onUndo={noop} onPrint={noop}
              sort={{ key: 'data', direction: 'desc' }} onSort={noop}
            />
          </Card>
        </div>
      </main>
    </I18nProvider>
  </React.StrictMode>,
);
