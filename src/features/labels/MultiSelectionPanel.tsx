import { useI18n } from '../../i18n/I18nProvider';
import { Trash2 } from 'lucide-react';
import { elementBounds } from './geometry';
import type { CanvasElement } from './types';

interface Props {
  elements: CanvasElement[];
  align: (value: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom') => void;
  distribute: (axis: 'x' | 'y') => void;
  onRemove: () => void;
}
const button = 'min-h-9 rounded-md border border-zinc-200 px-2 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800';
export function MultiSelectionPanel({ elements, align, distribute, onRemove }: Props) {
  const { t } = useI18n();
  const bounds = elements.map(item => ({ item, box: elementBounds(item) }));
  const x = bounds.length ? Math.min(...bounds.map(entry => entry.item.x)) : 0;
  const y = bounds.length ? Math.min(...bounds.map(entry => entry.item.y)) : 0;
  const right = bounds.length ? Math.max(...bounds.map(entry => entry.item.x + entry.box.width)) : 0;
  const bottom = bounds.length ? Math.max(...bounds.map(entry => entry.item.y + entry.box.height)) : 0;
  return <div className="min-w-0 overflow-x-hidden bg-white px-3 dark:bg-zinc-900"><header className="sticky top-0 z-20 border-b border-zinc-200 bg-white py-3 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-900">{elements.length} elementos</header><div className="space-y-4 py-4">
    <section className="space-y-2"><h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{t('labels.alinhar')}</h3><div className="grid grid-cols-2 gap-2">{([['left', 'Esquerda'], ['centerX', 'Centro horizontal'], ['right', 'Direita'], ['top', 'Topo'], ['centerY', 'Centro vertical'], ['bottom', 'Base']] as const).map(([key, title]) => <button type="button" className={button} key={key} onClick={() => align(key)}>{title}</button>)}</div></section>
    <section className="space-y-2"><h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{t('labels.distribuir')}</h3><div className="grid grid-cols-2 gap-2"><button type="button" className={button} disabled={elements.length < 3} onClick={() => distribute('x')}>{t('labels.horizontal')}</button><button type="button" className={button} disabled={elements.length < 3} onClick={() => distribute('y')}>{t('labels.vertical')}</button></div></section>
    <section className="space-y-2"><h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{t('labels.posicao_relativa')}</h3><div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded bg-zinc-50 p-2 dark:bg-zinc-800">X <b>{x.toFixed(1)} mm</b></div><div className="rounded bg-zinc-50 p-2 dark:bg-zinc-800">Y <b>{y.toFixed(1)} mm</b></div><div className="rounded bg-zinc-50 p-2 dark:bg-zinc-800">Largura <b>{(right - x).toFixed(1)} mm</b></div><div className="rounded bg-zinc-50 p-2 dark:bg-zinc-800">Altura <b>{(bottom - y).toFixed(1)} mm</b></div></div></section>
    <button type="button" onClick={onRemove} className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-red-200 text-sm text-red-600 dark:border-red-900"><Trash2 size={15} />{t('labels.excluir_selecao')}</button>
  </div></div>;
}
