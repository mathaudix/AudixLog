import { Button } from '../ui/Button';
import { Calculator, FileText, Settings, Tag, Truck, Users } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Tooltip } from '../ui/Tooltip';
import { useI18n } from '../../i18n/I18nProvider';

interface Props {
  tab: 'estoque' | 'expedidas' | 'rateio';
  expanded: boolean;
  onToggle: () => void;
  onTab: (value: 'estoque' | 'expedidas') => void;
  onRateio: () => void;
  onSettings: () => void;
  onLabelEditor: () => void;
  onUsers?: () => void;
  pendingUsers?: number;
}

export function Sidebar({
  tab,
  expanded,
  onToggle,
  onTab,
  onRateio,
  onSettings,
  onLabelEditor,
  onUsers,
  pendingUsers = 0,
}: Props) {
  const { t } = useI18n();

  const links = [
    { label: t('sidebar.stock'), icon: FileText, active: tab === 'estoque', action: () => onTab('estoque') },
    { label: t('sidebar.dispatched'), icon: Truck, active: tab === 'expedidas', action: () => onTab('expedidas') },
    { label: t('sidebar.labelEditor'), icon: Tag, active: false, action: onLabelEditor },
    { label: t('sidebar.rateio'), icon: Calculator, active: tab === 'rateio', action: onRateio },
    ...(onUsers
      ? [{ label: t('sidebar.users') + (pendingUsers ? ` (${pendingUsers})` : ''), icon: Users, active: false, action: onUsers }]
      : []),
  ];

  const NavButton = ({
    label,
    Icon,
    active,
    action,
  }: {
    label: string;
    Icon: typeof FileText;
    active: boolean;
    action: () => void;
  }) => (
    <Tooltip key={label} content={label}>
      <Button
        className={`nav-item ${active ? 'active' : ''}`}
        aria-label={label}
        title={expanded ? undefined : label}
        aria-current={active ? 'page' : undefined}
        onClick={action}
      >
        <Icon size={20} strokeWidth={1.8} />
        <span>{label}</span>
      </Button>
    </Tooltip>
  );

  return (
    <>
      <aside
        className={`app-sidebar ${expanded ? 'is-expanded' : 'is-collapsed'}`}
        aria-label={t('sidebar.mainMenu')}
      >
        <div className="sidebar-brand">
          <Button
            type="button"
            className="home-logo-button focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={onToggle}
            aria-label={expanded ? t('sidebar.collapse') : t('sidebar.expand')}
            aria-expanded={expanded}
            title={expanded ? t('sidebar.collapse') : t('sidebar.expand')}
          >
            <Logo variant="icon" size={32} />
          </Button>
        </div>

        <nav className="sidebar-nav" aria-label={t('sidebar.navigation')}>
          {links.map(({ label, icon: Icon, active, action }) => (
            <NavButton key={label} label={label} Icon={Icon} active={active} action={action} />
          ))}
          <div className="sidebar-settings">
            <div className="nav-separator" />
            <NavButton
              label={t('sidebar.settings')}
              Icon={Settings}
              active={false}
              action={onSettings}
            />
          </div>
        </nav>
      </aside>

      <nav className="mobile-bottom-nav" aria-label={t('sidebar.mobileNavigation')}>
        {links.map(({ label, icon: Icon, active, action }) => (
          <Button
            key={label}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={action}
          >
            <Icon size={21} />
            <span>
              {label === t('sidebar.labelEditor') ? t('sidebar.labels') : label}
            </span>
          </Button>
        ))}
        <Button
          className="mobile-nav-item"
          aria-label={t('sidebar.settings')}
          onClick={onSettings}
        >
          <Settings size={21} />
          <span>{t('sidebar.settingsShort')}</span>
        </Button>
      </nav>
    </>
  );
}