import { useEffect, useRef, useState } from 'react';
import { Check, Download, FileCode2, LogOut, Moon, MoreVertical, Plus, Search, Sun, UserRound, Laptop, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { useI18n } from '../../i18n/I18nProvider';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform) || navigator.platform || navigator.userAgent);
const SEARCH_SHORTCUT = IS_MAC ? '⌘ K' : 'Ctrl K';

interface Props {
  userName: string;
  userEmail: string;
  onProfile: () => void;
  onSignOut: () => void;
  themeMode: 'light' | 'dark' | 'system';
  onThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  onNew: () => void;
  onImportXml: () => void;
  onExport: () => void;
}

export function Header({
  userName,
  userEmail,
  onProfile,
  onSignOut,
  themeMode,
  onThemeMode,
  onNew,
  onImportXml,
  onExport,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const el = desktopSearchRef.current;
        if (el) el.focus();
        else setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const initials = userName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || userEmail[0]?.toUpperCase() || 'U';

  const modes = [
    { id: 'light', label: t('header.light'), Icon: Sun },
    { id: 'dark', label: t('header.dark'), Icon: Moon },
    { id: 'system', label: t('header.system'), Icon: Laptop },
  ] as const;

  const importActions = [
    { label: t('header.importXml'), Icon: FileCode2, run: onImportXml },
    { label: t('header.export'), Icon: Download, run: onExport },
  ];

  return (
    <header className="topbar">
      <div className={`topbar-left ${searchOpen ? 'mobile-searching' : ''}`}>
        <h1 className="topbar-title">{t('header.title')}</h1>
        {searchOpen && (
          <label className="global-search mobile-search-expanded">
            <Search size={16} />
            <input ref={searchRef} aria-label={t('header.searchNotes')} placeholder={t('header.searchNotes')} className="form-input" />
            <button type="button" aria-label={t('header.closeSearch')} onClick={() => setSearchOpen(false)}>
              <X size={17} />
            </button>
          </label>
        )}
      </div>

      <div className={`topbar-actions ${searchOpen ? 'mobile-searching' : ''}`}>
        <button type="button" className="mobile-search-trigger" aria-label={t('header.openSearch')} title={t('common.search')} onClick={() => setSearchOpen(true)}>
          <Search size={19} />
        </button>

        <label className="global-search desktop-global-search">
          <Search size={16} />
          <input ref={desktopSearchRef} aria-label={t('header.searchNotes')} placeholder={t('header.searchNotes')} className="form-input" />
          <kbd>{SEARCH_SHORTCUT}</kbd>
        </label>

        <div className="topbar-service-actions">
          <div className="desktop-service-actions">
            {importActions.map(({ label, Icon, run }) => (
              <Tooltip key={label} content={label}>
                <Button variant="ghost" size="sm" iconOnly className="h-8 w-8 rounded-[9px]" onClick={run} aria-label={label} title={label}>
                  <Icon size={17} />
                </Button>
              </Tooltip>
            ))}
          </div>

          <div className="mobile-more-wrap">
            <Button
              type="button"
              variant="ghost"
              iconOnly
              className="h-8 w-8 rounded-[9px]"
              aria-label={t('header.moreActions')}
              title={t('header.moreActions')}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((value) => !value)}
            >
              <MoreVertical size={17} />
            </Button>
            {moreOpen && (
              <div className="mobile-more-menu">
                {importActions.map(({ label, Icon, run }) => (
                  <Button key={label} className="menu-item w-full justify-start gap-2 px-2 py-1.5" onClick={() => { run(); setMoreOpen(false); }}>
                    <Icon size={15} />
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Tooltip content={t('header.newEntry')}>
            <Button variant="primary" size="sm" iconOnly className="h-8 w-8 rounded-[9px]" onClick={onNew} aria-label={t('header.newEntry')} title={t('header.newEntry')}>
              <Plus size={17} />
            </Button>
          </Tooltip>
        </div>

        <span className="topbar-action-divider" aria-hidden="true" />

        <div className="relative" ref={ref}>
          <Tooltip content={userName || t('header.myAccount')}>
            <Button
              className="user-trigger h-8 w-8 justify-center rounded-[9px] p-0"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label={t('header.userMenu', { name: userName || t('header.myAccount') })}
            >
              <span className="user-avatar text-sm font-medium">{initials}</span>
            </Button>
          </Tooltip>
          {open && (
            <div className="profile-menu">
              <div className="menu-user flex items-center gap-2 px-3 py-2">
                <span className="user-avatar w-8 h-8 text-base font-medium">{initials}</span>
                <span className="min-w-0">
                  <b className="block truncate text-sm">{userName || t('header.myAccount')}</b>
                  <small className="block truncate text-xs text-muted">{userEmail}</small>
                </span>
              </div>

              <Button className="menu-item w-full justify-start gap-2 px-3 py-2" onClick={() => { onProfile(); setOpen(false); }}>
                <UserRound size={16} />
                {t('header.profile')}
              </Button>

              <div className="menu-divider my-1" />

              <p className="menu-caption px-3 py-1 text-xs font-medium text-muted">{t('header.appearance')}</p>

              {modes.map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  className="menu-item w-full justify-start gap-2 px-3 py-2"
                  onClick={() => onThemeMode(id)}
                >
                  <Icon size={15} />
                  {label}
                  {themeMode === id && <Check className="ml-auto text-primary" size={14} />}
                </Button>
              ))}

              <div className="menu-divider my-1" />

              <div className="menu-item px-3 py-1">
                <LanguageSwitcher size="sm" />
              </div>

              <div className="menu-divider my-1" />

              <Button
                className="menu-item danger-text w-full justify-start gap-2 px-3 py-2"
                onClick={onSignOut}
              >
                <LogOut size={16} />
                {t('header.signOut')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}