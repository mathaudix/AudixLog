import { useI18n } from './../../i18n/I18nProvider';
import { Modal } from './Modal';
import { Button } from './Button';
export function ConfirmDialog({ open, title, message, onCancel, onConfirm, danger = false }: { open: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void; danger?: boolean }) {
 const { t } = useI18n();
  return <Modal open={open} onClose={onCancel} title={title}><p className="mb-6 text-sm text-muted dark:text-fg">{message}</p><div className="flex justify-end gap-2"><Button onClick={onCancel}>{t("ui.cancelar")}</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{t("notes.confirmar")}</Button></div></Modal>;
}
