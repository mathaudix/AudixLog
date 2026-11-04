import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, MapPin, Package, Truck } from 'lucide-react';
import { resetPassword, signIn } from '../../services/auth';
import { Logo } from '../ui/Logo';
import { useI18n } from '../../i18n/I18nProvider';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
import { AuthBackdrop } from './AuthBackdrop';

const REMEMBER_KEY = 'audixlog.lastEmail';

function authMessage(error: Error, t: (key: string) => string): string {
  const code = (error as Error & { code?: string }).code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': t('auth.invalidCredentials'),
    'auth/invalid-email': t('auth.invalidEmail'),
    'auth/too-many-requests': t('auth.tooManyRequests'),
    'auth/network-request-failed': t('auth.networkError'),
    'auth/user-disabled': t('auth.disabledUser'),
  };
  return messages[code ?? ''] ?? t('auth.authError');
}

export function LoginPage({ onSignUp }: { onSignUp: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(''); setNotice('');
    const result = await signIn(email, password, keepSignedIn);
    if (result.ok) {
      if (keepSignedIn) localStorage.setItem(REMEMBER_KEY, email.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } else setMessage(authMessage(result.error, t));
    setBusy(false);
  };
  const forgot = async () => {
    if (!email.trim()) { setMessage(t('auth.resetEmailRequired')); return; }
    setBusy(true); setMessage('');
    const result = await resetPassword(email);
    if (result.ok) setNotice(t('access.resetNotice'));
    else setMessage(authMessage(result.error, t));
    setBusy(false);
  };

  const field = 'w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-3 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/30';
  return <main className="login-shell relative grid min-h-[100dvh] place-items-center overflow-hidden p-4 text-fg lg:grid-cols-2 lg:gap-10 lg:px-16">
    <AuthBackdrop/>
    <section className="relative z-10 hidden flex-col gap-6 text-white lg:flex">
      <Logo variant="mark" size={96}/>
      <div><h2 className="text-5xl font-extrabold tracking-tight">AudixLog</h2><p className="mt-2 text-lg text-sky-300">{t('auth.brandSubtitle')}</p></div>
      <ul className="space-y-3 text-slate-200">
        <li className="flex items-center gap-3"><Truck className="h-5 w-5 text-sky-300"/>{t('auth.featureReceiving')}</li>
        <li className="flex items-center gap-3"><Package className="h-5 w-5 text-sky-300"/>{t('auth.featureVolumes')}</li>
        <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-sky-300"/>{t('auth.featureBranches')}</li>
      </ul>
    </section>
    <div className="absolute right-4 top-4 z-10"><LanguageSwitcher/></div>
    <form onSubmit={event => void submit(event)} autoComplete="on" className="relative z-10 w-full max-w-sm lg:justify-self-end space-y-5 rounded-3xl border border-primary/25 bg-surface/90 p-6 text-fg shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex flex-col items-center text-center lg:hidden">
        <div className="mb-4 grid h-24 w-24 place-items-center rounded-2xl bg-blue-500/10 shadow-lg ring-1 ring-blue-400/20"><Logo variant="mark" size={72}/></div>
        <h1 className="text-2xl font-extrabold tracking-tight">AudixLog</h1>
        <p className="mt-1 text-sm text-sky-300">{t('auth.brandSubtitle')}</p>
        <p className="mt-3 text-sm text-slate-400">{t('auth.continue')}</p>
      </div>
      <label className="block text-sm font-semibold">{t('auth.email')}
        <span className="relative mt-1 block"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"/>
          <input type="email" name="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className={field}/></span>
      </label>
      <label className="block text-sm font-semibold">{t('auth.credential')}
        <span className="relative mt-1 block"><Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"/>
          <input type={visible ? 'text' : 'password'} name="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={`${field} pr-10`}/>
          <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')} className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 hover:text-white">{visible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button></span>
      </label>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-slate-300"><input type="checkbox" checked={keepSignedIn} onChange={e => setKeepSignedIn(e.target.checked)} className="h-4 w-4 accent-blue-600"/>{t('auth.keepSignedIn')}</label>
        <button type="button" onClick={() => void forgot()} disabled={busy} className="font-semibold text-sky-300 hover:underline disabled:opacity-50">{t('auth.forgotCredential')}</button>
      </div>
      {message && <p role="alert" className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">{message}</p>}
      {notice && <p role="status" className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm text-sky-200">{notice}</p>}
      <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin"/>}{t('auth.signIn')}</button>
      <p className="text-center text-sm text-slate-400"><button type="button" onClick={onSignUp} className="font-semibold text-sky-300 hover:underline">{t('auth.noAccount')}</button></p>
    </form>
    <p className="absolute bottom-3 left-0 right-0 z-10 text-center text-xs text-slate-500">AudixLog · {t('auth.brandSubtitle')}</p>
  </main>;
}
