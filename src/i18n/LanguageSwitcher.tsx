import { useI18n } from './I18nProvider';
export function LanguageSwitcher({ className = '', size = 'md' }: { className?: string; size?: 'md' | 'sm' }) {
  const { lang, setLang, t } = useI18n();
  return <label className={`inline-flex items-center gap-2 text-[14px] text-fg ${className}`}>
    <span>{t('lang.label')}</span>
    <select aria-label={t('lang.label')} value={lang} onChange={event => setLang(event.target.value === 'en-US' ? 'en-US' : 'pt-BR')} className={`ui-input ${size === 'sm' ? 'ui-input-sm' : ''} w-auto`}>
      <option value="pt-BR">{t('lang.pt')}</option><option value="en-US">{t('lang.en')}</option>
    </select>
  </label>;
}
