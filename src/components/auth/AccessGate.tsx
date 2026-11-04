import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, LogOut, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { db, appId } from '../../services/firebase';
import { refreshVerification, resendVerification, signOut } from '../../services/auth';
import { accessState, type AccessState } from '../../services/accessState';
import { useI18n } from '../../i18n/I18nProvider';
import type { UserStatus } from '../../types';
import { AuthBackdrop } from './AuthBackdrop';

const COOLDOWN = 60;
type Snapshot = { ativo: boolean; status?: UserStatus } | null;

// Tela mostrada enquanto o acesso não está liberado (e-mail não verificado, aguardando aprovação ou desativado).
// Escuta o próprio perfil em tempo real e chama onChange quando o estado muda, para o App reavaliar o acesso.
export function AccessGate({ user, onChange }: { user: User; onChange: () => void }) {
  const { t } = useI18n();
  const [state, setState] = useState<AccessState>('naoVerificado');
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const profileRef = useRef<Snapshot>(null);

  const evaluate = () => setState(accessState({ emailVerified: user.emailVerified, profile: profileRef.current }));

  useEffect(() => onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'allowed_users', user.uid), snap => {
    const data = snap.data();
    profileRef.current = snap.exists() && data ? { ativo: data.ativo === true, status: data.status } : null;
    evaluate();
    if (accessState({ emailVerified: user.emailVerified, profile: profileRef.current }) === 'ativo') onChange();
  }, () => setState('desativado')), [user, onChange]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    setBusy(true); setMessage('');
    try { await resendVerification(user); setMessage(t('access.resent')); setCooldown(COOLDOWN); }
    catch (error) { setMessage(error instanceof Error ? error.message : t('access.errGeneric')); }
    setBusy(false);
  };
  const confirmed = async () => {
    setBusy(true); setMessage('');
    try {
      await refreshVerification(user);
      if (!user.emailVerified) { setMessage(t('access.stillNotVerified')); }
      evaluate();
      onChange();
    } catch { setMessage(t('access.errGeneric')); }
    setBusy(false);
  };

  const isVerify = state === 'naoVerificado';
  const isPending = state === 'pendente';
  const Icon = isVerify ? Mail : isPending ? Clock : ShieldAlert;
  const title = isVerify ? t('access.verifyTitle') : isPending ? t('access.pendingTitle') : t('access.disabledTitle');
  const text = isVerify ? t('access.verifyText', { email: user.email ?? '' }) : isPending ? t('access.pendingText') : t('access.disabledText');

  return <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden p-4 text-fg"><AuthBackdrop/><section className="relative z-10 w-full max-w-md space-y-5 rounded-3xl border border-primary/25 bg-surface/90 p-6 text-center text-fg shadow-2xl backdrop-blur-xl sm:p-8"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-500/15 text-sky-300"><Icon size={26}/></div><h1 className="text-xl font-bold">{title}</h1><p className="text-sm text-slate-600 dark:text-zinc-400">{text}</p>{message && <p role="status" className="text-sm font-medium text-sky-300">{message}</p>}{isPending && <Loader2 className="mx-auto animate-spin text-sky-400" size={20}/>}<div className="flex flex-col gap-2">{isVerify && <><button type="button" disabled={busy || cooldown > 0} onClick={() => void resend()} className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-white disabled:opacity-60">{cooldown > 0 ? t('access.resendWait', { s: cooldown }) : t('access.resend')}</button><button type="button" disabled={busy} onClick={() => void confirmed()} className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold dark:border-zinc-700">{t('access.confirmed')}</button></>}<button type="button" onClick={() => void signOut()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-slate-600 hover:underline dark:text-zinc-400"><LogOut size={16}/>{t('access.signOut')}</button></div></section></main>;
}
