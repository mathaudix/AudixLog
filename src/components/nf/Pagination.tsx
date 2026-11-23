import { useI18n } from './../../i18n/I18nProvider';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
 const { t } = useI18n();
 return <div className="flex items-center justify-between text-sm text-muted dark:text-tertiary"><span>{t("notes.pagina")} {pages ? page : 0}  {t("notes.de")} {pages}</span><div className="flex gap-2"><Button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border p-2 disabled:opacity-40 dark:border-border"><ChevronLeft size={16}/></Button><Button disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border p-2 disabled:opacity-40 dark:border-border"><ChevronRight size={16}/></Button></div></div>; }
