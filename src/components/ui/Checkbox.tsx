import type { InputHTMLAttributes, ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

/** Caixa de seleção acessível: label associado, foco visível e tokens de tema. */
export function Checkbox({ label, className = '', ...props }: Props) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-[14px] text-fg ${props.disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}>
      <input
        {...props}
        type="checkbox"
        className="size-4 cursor-pointer rounded border-border accent-[rgb(var(--color-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <span>{label}</span>
    </label>
  );
}
