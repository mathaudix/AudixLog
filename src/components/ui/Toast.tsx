import { useI18n } from './../../i18n/I18nProvider';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { Toast as ToastType } from '../../types';
export function ToastView({ toast, onClose }: { toast: ToastType | null; onClose: () => void }) {
 const { t } = useI18n();
  if (!toast) return null; const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;
  return <div role="status" className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-xl dark:border-border dark:bg-surface"><Icon className={`h-5 w-5 ${toast.type === 'error' ? 'text-red-500' : toast.type === 'success' ? 'text-emerald-500' : 'text-primary'}`} />{toast.text}<button className="ml-2 text-muted dark:text-tertiary dark:text-tertiary" onClick={onClose} aria-label={t("ui.fechar_notificacao")}>{t("ui.text")}</button></div>;
}
