import { Button } from '../ui/Button';
import { useState } from 'react';
import type { User } from 'firebase/auth';
import { LogOut, ShieldAlert } from 'lucide-react';
import { signOut } from '../../services/auth';
import { Logo } from '../ui/Logo';
import { useI18n } from '../../i18n/I18nProvider';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
export function UnauthorizedPage({ user }: { user: User }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(`UID: ${user.uid}\n${t('auth.email')}: ${user.email ?? ''}`); setCopied(true); };
  return <main className="grid min-h-[100dvh] place-items-center bg-bg p-5"><div className="absolute right-4 top-4"><LanguageSwitcher/></div><section className="w-full max-w-lg space-y-4 rounded-3xl border border-amber-300 bg-white p-8 dark:border-amber-900 dark:bg-zinc-900"><Logo variant="mark" tone="auto" size={42}/><ShieldAlert className="h-10 w-10 text-amber-500"/><h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('auth.unauthorized')}</h1><p className="text-sm text-slate-600 dark:text-zinc-300">{t('auth.inactive')}</p><pre className="overflow-auto rounded-xl bg-slate-100 p-3 text-xs dark:bg-zinc-800">{t('auth.uid')}: {user.uid}{'\n'}{t('auth.email')}: {user.email ?? '—'}</pre><div className="flex gap-2"><Button onClick={() => void copy()} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white">{copied ? t('auth.copied') : t('auth.copyData')}</Button><Button onClick={() => void signOut()} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold dark:border-zinc-700"><LogOut size={16}/> {t('auth.signOut')}</Button></div></section></main>;
}
