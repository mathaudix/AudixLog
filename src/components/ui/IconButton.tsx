import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Size = 'md' | 'sm';
type Tone = 'neutral' | 'danger';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Obrigatório: botão só com ícone precisa de nome acessível. */
  'aria-label': string;
  /** md = 36px (controles de página); sm = 32px (dentro de cards). */
  size?: Size;
  tone?: Tone;
  children: ReactNode;
}

const SIZE: Record<Size, string> = {
  md: 'h-9 w-9',
  sm: 'h-8 w-8',
};

const TONE: Record<Tone, string> = {
  neutral: 'text-muted hover:bg-bg hover:text-fg dark:hover:bg-raised',
  danger: 'text-danger hover:bg-danger/10',
};

/**
 * Botão quadrado só com ícone. O tooltip nativo (`title`) mostra o mesmo texto do aria-label,
 * salvo se o chamador passar outro `title`.
 */
export function IconButton({ size = 'md', tone = 'neutral', className = '', title, children, type = 'button', ...props }: Props) {
  return (
    <button
      {...props}
      type={type}
      title={title ?? props['aria-label']}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${SIZE[size]} ${TONE[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
