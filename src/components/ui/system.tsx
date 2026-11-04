import type { ReactNode, HTMLAttributes } from 'react';

/* Sistema de componentes do AudixLog. Use estes blocos em vez de classes soltas.
   Ver docs/design-system.md. */

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-bg text-muted border-border',
  primary: 'bg-primary/10 text-primary border-primary/25',
  info: 'bg-subtle text-brand border-primary/25',
  success: 'bg-success/20 text-brand border-success/40',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
};

/** Badge / StatusPill: estados das NF-e, destinos do rateio, avisos. */
export function StatusPill({ tone = 'neutral', children, dot = false, className = '' }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-semibold ${TONE_CLASS[tone]} ${className}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Card: superfície padrão. Cabeçalho opcional com título e ações. */
export function Card({ title, description, actions, children, className = '', ...rest }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <section {...rest} className={`rounded-card border border-border bg-surface shadow-surface ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h3 className="text-h3 text-fg">{title}</h3>}
            {description && <p className="mt-1 text-small text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** PageHeader: título, descrição e ações de cada tela. */
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-display text-fg">{title}</h1>
        {description && <p className="mt-1.5 text-small text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** EmptyState: tela sem dados. */
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border px-6 py-12 text-center">
      {icon && <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">{icon}</div>}
      <p className="text-h3 text-fg">{title}</p>
      {description && <p className="max-w-sm text-small text-muted">{description}</p>}
      {action}
    </div>
  );
}

/** Skeleton: carregamento. */
export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-border/70 ${className}`} />;
}

/** Table: cabeçalho e linhas padronizados. */
export function DataTable({ head, children, empty }: { head: ReactNode[]; children?: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left text-small">
        <thead className="bg-bg text-caption font-semibold uppercase tracking-wide text-tertiary">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="h-10 px-4 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

/** Texto mono para chaves de NF-e e códigos. */
export function Mono({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <code className={`font-mono text-caption text-muted ${className}`}>{children}</code>;
}
