import { useI18n } from './../../i18n/I18nProvider';
import markWhite from '../../assets/logo/logo-mark-white.svg';
interface Props { variant?: 'mark'; tone?: 'auto' | 'black' | 'color'; size?: number; className?: string }
export function Logo({ size = 36, className = '' }: Props) {
 const { t } = useI18n();
  return <span role="img" aria-label={t("ui.audixlog")} title={t("ui.audixlog")} className={`inline-flex shrink-0 items-center gap-3 ${className}`}>
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <img src={markWhite} alt="" style={{ width: size * .68, height: size * .68 }} />
    </span>
  </span>;
}
