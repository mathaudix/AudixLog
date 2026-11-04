import { Bookmark, Layers, Shapes, type LucideIcon } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export type DockSection = 'elementos' | 'salvos' | 'camadas';

interface Props {
  active: DockSection | null;
  onSelect: (section: DockSection) => void;
}

export function EditorDock({ active, onSelect }: Props) {
  const { t } = useI18n();
  const items: { id: DockSection; icon: LucideIcon; label: string }[] = [
    { id: 'elementos', icon: Shapes, label: t('labels.dock.elementos') },
    { id: 'salvos', icon: Bookmark, label: t('labels.dock.salvos') },
    { id: 'camadas', icon: Layers, label: t('labels.dock.camadas') },
  ];
  return (
    <nav aria-label={t('labels.dock.navegacao')} className="flex shrink-0 flex-col gap-1 border-r border-[rgba(96,165,250,0.14)] bg-[#0B1730] py-2 lg:w-16 max-lg:order-last max-lg:w-full max-lg:flex-row max-lg:justify-around max-lg:border-r-0 max-lg:border-t max-lg:py-1">
      {items.map(item => {
        const on = active === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(item.id)}
            className={`relative flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium transition-colors ${on ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400 hover:bg-blue-500/10 hover:text-slate-200'}`}
          >
            {on && <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r bg-[#3B82F6] max-lg:hidden" />}
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
