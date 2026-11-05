import { useI18n } from '../../i18n/I18nProvider';
import { ChevronDown, ChevronUp, Eye, EyeOff, Group, Lock, Unlock } from 'lucide-react';
import type { CanvasElement } from './types';
import { Section } from './Section';
import { groupMarkerColor } from './groupSelection';

interface Props {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (id: string | null, isolate?: boolean) => void;
  onUpdate: (id: string, patch: Partial<CanvasElement>) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
}

function elementName(element: CanvasElement, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const detail = element.type === 'text' ? element.text : element.type === 'barcode' ? element.value : element.type === 'icon' ? element.iconType : '';
  const names: Record<string,string> = {text:t('labels.texto'),barcode:t('labels.codigo_de_barras'),icon:t('labels.icone'),rect:t('labels.retangulo'),circle:t('labels.circulo'),triangle:t('labels.triangulo'),hexagon:t('labels.hexagono'),star:t('labels.estrela'),line:t('labels.linha')};
 return `${names[element.type] ?? t('labels.elemento')}${detail ? ` · ${detail.slice(0,22)}` : ''}`;
}

export function LayersPanel({ elements, selectedIds, onSelect, onUpdate, onReorder }: Props) {
  const { t } = useI18n();
  const ordered = [...elements].sort((a, b) => b.zIndex - a.zIndex);
  return <div className="min-w-0 shrink-0 bg-white p-1 dark:bg-surface" aria-label={t('labels.camadas')}><Section sectionKey="layers" title={t('labels.camadas')} count={elements.length}>
    {ordered.length === 0 && <p className="px-1.5 py-2 text-[10px] text-muted dark:text-muted">{t('labels.nenhum_elemento')}</p>}
    {ordered.map((element, index) => <div key={element.id} className={`flex items-center gap-0.5 rounded px-1 ${selectedIds.includes(element.id) ? 'bg-blue-100 text-blue-900 dark:bg-raised dark:text-blue-200' : 'text-zinc-600 hover:bg-zinc-100 dark:text-muted dark:hover:bg-zinc-800'}`}>
      <button type="button" onClick={event => onSelect(element.id, event.altKey)} className="min-w-0 flex-1 truncate py-1 text-left text-[10px]" title={elementName(element, t)}>{element.groupId && <span aria-hidden="true" data-testid="group-marker" className="mr-1 inline-block h-2.5 w-1 rounded-sm align-middle" style={{ backgroundColor: groupMarkerColor(element.groupId) }} />}{elementName(element, t)}{element.groupId && <Group data-testid="group-badge" aria-label={t('labels.agrupado')} role="img" className="ml-1 inline-block h-3 w-3 align-middle text-muted dark:text-muted"><title>{t('labels.agrupado')}</title></Group>}</button>
      <button type="button" aria-label={t('labels.mover_para_cima', { name: elementName(element, t) })} title={t('labels.mover_para_cima')} disabled={index === 0} onClick={() => onReorder(element.id, 1)} className="grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-white disabled:opacity-30 dark:hover:bg-zinc-700"><ChevronUp size={13}/></button>
      <button type="button" aria-label={t('labels.mover_para_baixo', { name: elementName(element, t) })} title={t('labels.mover_para_baixo')} disabled={index === ordered.length - 1} onClick={() => onReorder(element.id, -1)} className="grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-white disabled:opacity-30 dark:hover:bg-zinc-700"><ChevronDown size={13}/></button>
      <button type="button" aria-label={element.hidden ? t('labels.mostrar_item', { name: elementName(element, t) }) : t('labels.ocultar_item', { name: elementName(element, t) })} title={element.hidden ? t('labels.mostrar_camada') : t('labels.ocultar_camada')} onClick={() => onUpdate(element.id, { hidden: !element.hidden })} className="grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-white dark:hover:bg-zinc-700">{element.hidden ? <EyeOff size={13}/> : <Eye size={13}/>}</button>
      <button type="button" aria-label={element.locked ? t('labels.destravar_item', { name: elementName(element, t) }) : t('labels.travar_item', { name: elementName(element, t) })} title={element.locked ? t('labels.destravar_camada') : t('labels.travar_camada')} onClick={() => onUpdate(element.id, { locked: !element.locked })} className="grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-white dark:hover:bg-zinc-700">{element.locked ? <Lock size={13}/> : <Unlock size={13}/>}</button>
    </div>)}
    </Section></div>;
}
