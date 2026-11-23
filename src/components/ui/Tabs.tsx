import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

interface Props<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Nome acessível do grupo de abas. */
  label: string;
  variant?: 'segmented' | 'underline';
  className?: string;
}

/** Abas com padrão WAI-ARIA: setas trocam a aba, Home/End vão ao início/fim. */
export function Tabs<T extends string>({ items, value, onChange, label, variant = 'segmented', className = '' }: Props<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (index: number) => {
    const next = items[(index + items.length) % items.length];
    if (!next) return;
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(index + 1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); move(index - 1); }
    else if (event.key === 'Home') { event.preventDefault(); move(0); }
    else if (event.key === 'End') { event.preventDefault(); move(items.length - 1); }
  };

  const base = 'h-9 px-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const list = variant === 'segmented'
    ? 'inline-flex rounded-lg border border-border bg-bg p-1 dark:bg-raised'
    : 'flex gap-1 border-b border-border';
  const tab = (active: boolean) => variant === 'segmented'
    ? `${base} rounded-md ${active ? 'bg-primary text-white' : 'text-muted hover:text-fg'}`
    : `${base} -mb-px border-b-2 ${active ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg'}`;

  return (
    <div role="tablist" aria-label={label} className={`${list} ${className}`}>
      {items.map((item, index) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={el => { refs.current[item.id] = el; }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={active}
            aria-controls={`panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={event => onKeyDown(event, index)}
            className={tab(active)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
