import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { signUp } from '../../services/auth';
import { authErrorKey } from '../../services/authErrors';
import { useI18n } from '../../i18n/I18nProvider';
import { AuthBackdrop } from './AuthBackdrop';

const MIN_PASSWORD = 8;

// Formulário de criação de conta. Após criar, o fluxo pós-login mostra a tela de confirmação de e-mail.
export function SignUpForm({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) { setMessage(t('access.passwordMin')); return; }
    if (password !== confirm) { setMessage(t('access.passwordMismatch')); return; }
    setBusy(true); setMessage('');
    const result = await signUp(nome, email, password);
    if (!result.ok) { setMessage(t(authErrorKey((result.error as Error & { code?: string }).code))); setBusy(false); }
  };

  const field = 'w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-blue-500 border-white/15';
  return <main className="login-shell relative grid min-h-[100dvh] place-items-center overflow-hidden p-4 text-fg"><AuthBackdrop/><form onSubmit={event => void submit(event)} className="relative z-10 w-full max-w-sm space-y-4 rounded-3xl border border-primary/25 bg-surface/90 p-6 text-fg shadow-2xl backdrop-blur-xl sm:p-8"><h1 className="text-center text-xl font-bold">{t('access.signUpTitle')}</h1><label className="block text-sm font-semibold">{t('access.name')}<input required maxLength={60} value={nome} onChange={e => setNome(e.target.value)} className={`mt-1 ${field}`}/></label><label className="block text-sm font-semibold">{t('auth.email')}<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={`mt-1 ${field}`}/></label><label className="block text-sm font-semibold">{t('auth.credential')}<input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={password} onChange={e => setPassword(e.target.value)} className={`mt-1 ${field}`}/></label><label className="block text-sm font-semibold">{t('access.confirmPassword')}<input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={confirm} onChange={e => setConfirm(e.target.value)} className={`mt-1 ${field}`}/></label>{message && <p role="alert" className="text-sm font-medium text-red-600">{message}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={17}/>}{t('access.createAccount')}</button><button type="button" onClick={onBack} className="w-full text-sm font-semibold text-sky-300 hover:underline">{t('access.backToLogin')}</button></form></main>;
}
