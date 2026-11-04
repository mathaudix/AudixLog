import type { ReactNode } from 'react';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Interruptor on/off com role="switch" (Espaço/Enter alternam pelo botão nativo). */
export function Switch({ checked, onChange, label, disabled = false, id, className = '' }: Props) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-3 text-[14px] text-fg disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${checked ? 'border-primary bg-primary' : 'border-border bg-bg dark:bg-raised'}`}
      >
        <span className={`absolute size-3.5 rounded-full bg-surface shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
      </span>
      <span>{label}</span>
    </button>
  );
}
