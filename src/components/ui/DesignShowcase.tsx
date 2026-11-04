import { Button } from './Button';
import { Card, DataTable, EmptyState, Mono, PageHeader, Skeleton, StatusPill } from './system';
import { Input, Select, Textarea } from './Controls';
import { Inbox } from 'lucide-react';

/** Vitrine dos componentes. Não aparece no menu; acessível pela rota #vitrine em desenvolvimento. */
export function DesignShowcase() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader title="Design system" description="Botões, textos, campos, status e tabelas do AudixLog." />
      <Card title="Botões" description="Primário: ação principal da tela. Secundário: ações comuns. Danger: só para excluir ou zerar.">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Salvar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="link">Link</Button>
          <Button variant="danger">Excluir</Button>
          <Button variant="primary" loading>Salvando</Button>
          <Button variant="primary" disabled>Desabilitado</Button>
        </div>
      </Card>
      <Card title="Textos">
        <p className="text-display text-fg">Display 24</p>
        <p className="text-h1 text-fg">Título de página 20</p>
        <p className="text-h2 text-fg">Título de seção 16</p>
        <p className="text-h3 text-fg">Título de card 14</p>
        <p className="text-body text-fg">Corpo de texto 14, usado na maior parte das telas.</p>
        <p className="text-small text-muted">Texto auxiliar 13, para descrições.</p>
        <p className="text-caption text-tertiary">Legenda 11, para rótulos e metadados.</p>
        <p className="mt-2">Chave NF-e: <Mono>35261112345678000190550010000012341000012345</Mono></p>
      </Card>
      <Card title="Campos">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Fornecedor" placeholder="Nome" />
          <Select label="Destino"><option>Lojas</option></Select>
          <Input label="Valor" error="Informe um valor maior que zero" />
          <div className="md:col-span-3"><Textarea label="Observação" hint="Opcional" /></div>
        </div>
      </Card>
      <Card title="Status">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="success" dot>Expedida</StatusPill>
          <StatusPill tone="primary">Conferida</StatusPill>
          <StatusPill tone="info">Em trânsito</StatusPill>
          <StatusPill tone="warning">Pendente</StatusPill>
          <StatusPill tone="danger">Erro</StatusPill>
          <StatusPill tone="neutral">Sem status</StatusPill>
        </div>
      </Card>
      <Card title="Tabela">
        <DataTable head={['Fornecedor', 'Chave', 'Valor']}>
          <tr><td className="px-4 py-3">Fornecedor exemplo</td><td className="px-4 py-3"><Mono>3526…2345</Mono></td><td className="px-4 py-3">R$ 1.234,56</td></tr>
        </DataTable>
      </Card>
      <Card title="Estados">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState icon={<Inbox size={22} />} title="Nenhuma nota encontrada" description="Importe XMLs ou ajuste os filtros." />
          <div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
        </div>
      </Card>
    </div>
  );
}
