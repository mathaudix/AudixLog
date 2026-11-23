import { useI18n } from './../../i18n/I18nProvider';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
interface Props { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }
export function Modal({ open, onClose, title, children, className = '' }: Props) {
 const { t } = useI18n();
  const dialog = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => { if (!open) return; const previous = document.activeElement; const focusable = () => dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); if (event.key === 'Tab') { const items = Array.from(focusable() ?? []); if (!items.length) return; const first = items[0]; const last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } } };
    document.addEventListener('keydown', key); focusable()?.[0]?.focus(); return () => { document.removeEventListener('keydown', key); if (previous instanceof HTMLElement) previous.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialog} role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl sm:max-h-[90dvh] sm:rounded-2xl border border-border bg-surface shadow-2xl dark:border-border dark:bg-surface ${className}`}><header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-surface/95 p-5 dark:border-border dark:bg-surface/95"><h2 className="font-bold">{title}</h2><IconButton aria-label={t("ui.fechar")} onClick={onClose}><X size={18} aria-hidden="true"/></IconButton></header><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-5">{children}</div></section></div>;
}
