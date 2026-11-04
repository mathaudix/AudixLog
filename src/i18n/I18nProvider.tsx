import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { pt } from './pt';

export type Language = 'pt-BR' | 'en-US';
type Vars = Record<string, string | number>;
type I18nValue = { lang: Language; setLang: (lang: Language) => void; t: (path: string, vars?: Vars) => string };
const I18nContext = createContext<I18nValue | null>(null);
function lookup(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, source);
}
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try { return localStorage.getItem('audix.lang') === 'en-US' ? 'en-US' : 'pt-BR'; } catch { return 'pt-BR'; }
  });
  const setLang = (value: Language) => setLangState(value);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('audix.lang', lang); } catch { /* storage may be unavailable */ }
  }, [lang]);
  const value = useMemo<I18nValue>(() => ({ lang, setLang, t: (path, vars = {}) => {
    const translated = lookup(lang === 'en-US' ? en : pt, path);
    const fallback = lookup(pt, path);
    const text = typeof translated === 'string' ? translated : typeof fallback === 'string' ? fallback : path;
    return text.replace(/\{(\w+)\}/g, (match, key: string) => String(vars[key] ?? match));
  } }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
