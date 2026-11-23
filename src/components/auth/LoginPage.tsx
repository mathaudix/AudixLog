import { useState, type FormEvent, useEffect, useRef } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, Truck, Package, MapPin, Shield } from 'lucide-react';
import { resetPassword, signIn } from '../../services/auth';
import { LogoVertical } from '../ui/Logo';
import { useI18n } from '../../i18n/I18nProvider';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';

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

// Floating decorative shapes
const FloatingShapes = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-10 animate-blob" style={{ background: 'rgb(42 63 56)', animationDelay: '0s', animationDuration: '20s' }} />
    <div className="absolute top-1/3 right-1/5 w-36 h-36 rounded-full blur-3xl opacity-10 animate-blob" style={{ background: 'rgb(246 80 189)', animationDelay: '-5s', animationDuration: '25s' }} />
    <div className="absolute bottom-1/4 left-1/5 w-32 h-32 rounded-full blur-3xl opacity-10 animate-blob" style={{ background: 'rgb(86 47 84)', animationDelay: '-10s', animationDuration: '18s' }} />
    <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full blur-3xl opacity-10 animate-blob" style={{ background: 'rgb(42 63 56)', animationDelay: '-15s', animationDuration: '22s' }} />
  </div>
);

// Subtle geometric pattern overlay
const GeometricPattern = () => (
  <div
    className="pointer-events-none fixed inset-0 opacity-[0.02]"
    aria-hidden="true"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M30 30c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20zm0 2c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }}
  />
);

// Feature icon background colors (light mode values, dark mode handled by CSS)
const featureStyles = {
  primary: { bg: 'rgba(42, 63, 56, 0.15)', color: 'rgb(42, 63, 56)' },
  accent: { bg: 'rgba(246, 80, 189, 0.15)', color: 'rgb(246, 80, 189)' },
  secondary: { bg: 'rgba(86, 47, 84, 0.15)', color: 'rgb(86, 47, 84)' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', color: 'rgb(59, 130, 246)' },
} as const;

export function LoginPage({ onSignUp }: { onSignUp: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');

  // Animation state
  const [showLogo, setShowLogo] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  // Trigger animations on mount
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowLogo(true), 100),
      setTimeout(() => setShowTitle(true), 200),
      setTimeout(() => setShowForm(true), 320),
      setTimeout(() => setShowFeatures(true), 440),
      setTimeout(() => setShowFooter(true), 520),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setNotice('');
    const result = await signIn(email, password, keepSignedIn);
    if (result.ok) {
      if (keepSignedIn) localStorage.setItem(REMEMBER_KEY, email.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } else setMessage(authMessage(result.error, t));
    setBusy(false);
  };

  const forgot = async () => {
    if (!email.trim()) { setMessage(t('auth.resetEmailRequired')); return; }
    setBusy(true);
    setMessage('');
    const result = await resetPassword(email);
    if (result.ok) setNotice(t('access.resetNotice'));
    else setMessage(authMessage(result.error, t));
    setBusy(false);
  };

  // Focus email input on mount
  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => { emailRef.current?.focus(); }, []);

  const features = [
    { icon: Truck, label: t('auth.featureReceiving'), styleKey: 'primary' as const },
    { icon: Package, label: t('auth.featureVolumes'), styleKey: 'accent' as const },
    { icon: MapPin, label: t('auth.featureBranches'), styleKey: 'secondary' as const },
    { icon: Shield, label: t('auth.featureSecurity') ?? 'Segurança e conformidade', styleKey: 'info' as const },
  ];

  // Animation style helpers
  const fadeSlideUp = (delay: number, duration = 600) => ({
    opacity: 1,
    transform: 'translateY(0)',
    transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
  });

  const fadeSlideUpHidden = (delay: number, duration = 600) => ({
    opacity: 0,
    transform: `translateY(${duration > 400 ? -20 : -12}px)`,
    transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
  });

  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center p-4 bg-bg overflow-hidden">
      {/* Animated background blobs */}
      <FloatingShapes />

      {/* Base gradient background */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 15%, rgba(42, 63, 56, 0.08), transparent 65%),
            radial-gradient(ellipse 50% 40% at 85% 85%, rgba(246, 80, 189, 0.05), transparent 55%),
            radial-gradient(ellipse 40% 30% at 10% 90%, rgba(86, 47, 84, 0.05), transparent 50%),
            rgb(250, 250, 250)
          `,
        }}
      />

      {/* Geometric pattern */}
      <GeometricPattern />

      {/* Language switcher */}
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Centered Login Card */}
      <div
        className={`
          card w-full max-w-md relative z-10
          transition-all duration-600 ease-out
          ${showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        {/* Logo */}
        <div
          className="flex justify-center mb-6"
          style={showLogo ? fadeSlideUp(0, 600) : fadeSlideUpHidden(0, 600)}
        >
          <LogoVertical size="xl" animated />
        </div>

        {/* Title */}
        <div
          className="text-center mb-8"
          style={showTitle ? fadeSlideUp(100, 500) : fadeSlideUpHidden(100, 500)}
        >
          <h1 className="text-h1 text-fg font-bold tracking-tight">AudixLog</h1>
          <p className="mt-2 text-sm text-muted">{t('auth.brandSubtitle')}</p>
        </div>

        {/* Feature highlights */}
        <div
          className="mb-6 grid grid-cols-2 gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
          style={showFeatures ? fadeSlideUp(220, 500) : fadeSlideUpHidden(220, 500)}
          role="list"
          aria-label={t('auth.featuresLabel') ?? 'Funcionalidades'}
        >
          {features.map((feature, i) => {
            const style = featureStyles[feature.styleKey];
            const itemDelay = 220 + i * 80;
            return (
              <div
                key={feature.label}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors"
                role="listitem"
                style={showFeatures ? fadeSlideUp(itemDelay, 400) : fadeSlideUpHidden(itemDelay, 400)}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: style.bg, color: style.color }}
                  aria-hidden="true"
                >
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-fg text-center">{feature.label}</span>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <form
          onSubmit={event => void submit(event)}
          autoComplete="on"
          className="space-y-5"
          style={showForm ? fadeSlideUp(300, 500) : fadeSlideUpHidden(300, 500)}
        >
          {/* Email Field */}
          <div className="form-field">
            <label htmlFor="email" className="form-label">{t('auth.email')}</label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle"
                aria-hidden="true"
              />
              <input
                ref={emailRef}
                id="email"
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input pl-10"
                placeholder={t('auth.emailPlaceholder') ?? 'seu@email.com'}
                disabled={busy}
                aria-describedby={message ? 'email-error' : undefined}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-field">
            <label htmlFor="password" className="form-label">{t('auth.credential')}</label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle"
                aria-hidden="true"
              />
              <input
                id="password"
                type={visible ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input pl-10 pr-12"
                placeholder={t('auth.passwordPlaceholder') ?? '••••••••'}
                disabled={busy}
                aria-describedby={message ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setVisible(v => !v)}
                aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-fg transition-colors"
                disabled={busy}
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={e => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface accent-primary focus:ring-2 focus:ring-primary/20"
                disabled={busy}
              />
              <span className="select-none">{t('auth.keepSignedIn')}</span>
            </label>
            <button
              type="button"
              onClick={() => void forgot()}
              disabled={busy}
              className="font-medium text-primary hover:underline disabled:opacity-50 transition-colors"
            >
              {t('auth.forgotCredential')}
            </button>
          </div>

          {/* Error / Success Messages */}
          {message && (
            <div
              id="email-error"
              role="alert"
              className="form-error flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 animate-in slide-in-from-top-2 duration-300"
            >
              <svg className="h-4 w-4 flex-shrink-0 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-sm text-danger">{message}</span>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="form-success flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 animate-in slide-in-from-top-2 duration-300"
            >
              <svg className="h-4 w-4 flex-shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-sm text-success">{notice}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy || !email.trim() || !password.trim()}
            className="btn btn-primary btn-lg w-full justify-center gap-2 relative overflow-hidden"
            style={{ marginTop: '4px' }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className={busy ? 'opacity-0' : 'opacity-100'}>
              {t('auth.signIn')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
            {busy && (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('auth.signingIn') ?? 'Entrando...'}
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          className="mt-6 text-center"
          style={showFooter ? fadeSlideUp(400, 500) : fadeSlideUpHidden(400, 500)}
        >
          <p className="text-sm text-muted">
            <button
              type="button"
              onClick={onSignUp}
              className="font-medium text-primary hover:underline transition-colors"
            >
              {t('auth.noAccount')}
            </button>
          </p>
        </div>
      </div>

      {/* Version footer */}
      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-subtle">
        AudixLog · {t('auth.brandSubtitle')}
      </p>
    </main>
  );
}