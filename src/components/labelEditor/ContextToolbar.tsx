import { Copy, Trash2, ArrowUp, ArrowDown, Bold, Minus, Plus, AlignLeft, AlignCenter, AlignRight, SlidersHorizontal, RotateCw, Group, Ungroup, Lock, Unlock } from 'lucide-react';
import { NumericField } from '../../features/labels/NumericField';
import type { CanvasElement, CanvasElementPatch } from '../../features/labels/types';
import { useI18n } from '../../i18n/I18nProvider';

type Align = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';

interface Props {
  elements: CanvasElement[];
  onUpdate: (patch: CanvasElementPatch) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onLayer: (front: boolean) => void;
  onAlign?: (direction: Align) => void;
  onGroup?: (ungroup: boolean) => void;
  onToggleLock?: () => void;
  onMore: () => void;
  visible: boolean;
  placement: 'inline';
}

const btn = 'grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-[#CBD5E1] transition-colors hover:bg-[rgba(59,130,246,0.15)] disabled:opacity-40';
const sep = 'mx-1 h-5 w-px bg-[rgba(96,165,250,0.14)]';

export function ContextToolbar({ elements, onUpdate, onDuplicate, onRemove, onLayer, onAlign, onGroup, onToggleLock, onMore, visible, placement }: Props) {
  const { t } = useI18n();
  if (!visible || elements.length === 0) return null;
  const single = elements.length === 1 ? elements[0] : undefined;
  const rotation = single && single.type !== 'line' ? (((single.rotation ?? 0) % 360) + 360) % 360 : 0;
  const text = single?.type === 'text' ? single : undefined;
  const shape = single && ['rect', 'circle', 'triangle', 'hexagon', 'star'].includes(single.type)
    ? (single as Extract<CanvasElement, { stroke: string; fill: string }>)
    : undefined;

  return (
    <div
      data-testid="context-toolbar"
      data-placement={placement}
      role="toolbar"
      aria-label={t('labels.toolbar.barra_contexto')}
      onMouseDown={event => event.stopPropagation()}
      className="pointer-events-auto flex h-10 items-center gap-0.5 rounded-[10px] border border-[rgba(96,165,250,0.14)] bg-dock-bg px-2 shadow-[0_8px_24px_rgba(0,0,0,.35)]"
    >
      {elements.length > 1 && (
        <span data-testid="toolbar-count" className="px-2 text-xs font-medium text-primary">{t('labels.toolbar.itens_selecionados', { n: elements.length })}</span>
      )}

      {text && (
        <>
          <button type="button" data-testid="toolbar-font-minus" title={t('labels.toolbar.diminuir_fonte')} aria-label={t('labels.toolbar.diminuir_fonte')} className={btn} onClick={() => onUpdate({ fontSize: Math.max(4, text.fontSize - 1) } as CanvasElementPatch)}><Minus size={16} /></button>
          <span data-testid="toolbar-font-size" className="min-w-8 text-center text-xs tabular-nums text-[#CBD5E1]">{text.fontSize}</span>
          <button type="button" data-testid="toolbar-font-plus" title={t('labels.toolbar.aumentar_fonte')} aria-label={t('labels.toolbar.aumentar_fonte')} className={btn} onClick={() => onUpdate({ fontSize: Math.min(120, text.fontSize + 1) } as CanvasElementPatch)}><Plus size={16} /></button>
          <span className={sep} />
          <button type="button" data-testid="toolbar-bold" title={t('labels.toolbar.negrito')} aria-label={t('labels.toolbar.negrito')} aria-pressed={text.fontWeight === 'bold'} className={`${btn} ${text.fontWeight === 'bold' ? 'text-primary' : ''}`} onClick={() => onUpdate({ fontWeight: text.fontWeight === 'bold' ? 'normal' : 'bold' } as CanvasElementPatch)}><Bold size={16} /></button>
          <button type="button" title={t('labels.toolbar.alinhar_esquerda')} aria-label={t('labels.toolbar.alinhar_esquerda')} className={`${btn} ${text.textAlign === 'left' ? 'text-primary' : ''}`} onClick={() => onUpdate({ textAlign: 'left' } as CanvasElementPatch)}><AlignLeft size={16} /></button>
          <button type="button" title={t('labels.toolbar.alinhar_centro')} aria-label={t('labels.toolbar.alinhar_centro')} className={`${btn} ${text.textAlign === 'center' ? 'text-primary' : ''}`} onClick={() => onUpdate({ textAlign: 'center' } as CanvasElementPatch)}><AlignCenter size={16} /></button>
          <button type="button" title={t('labels.toolbar.alinhar_direita')} aria-label={t('labels.toolbar.alinhar_direita')} className={`${btn} ${text.textAlign === 'right' ? 'text-primary' : ''}`} onClick={() => onUpdate({ textAlign: 'right' } as CanvasElementPatch)}><AlignRight size={16} /></button>
          <span className={sep} />
          <label title={t('labels.toolbar.cor_texto')} className="grid h-8 w-8 cursor-pointer place-items-center">
            <span className="sr-only">{t('labels.toolbar.cor_texto')}</span>
            <input type="color" data-testid="toolbar-text-color" value={text.fill} onChange={event => onUpdate({ fill: event.target.value } as CanvasElementPatch)} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
          </label>
        </>
      )}

      {shape && (
        <>
          <label title={t('labels.toolbar.preenchimento')} className="grid h-8 w-8 cursor-pointer place-items-center">
            <span className="sr-only">{t('labels.toolbar.preenchimento')}</span>
            <input type="color" data-testid="toolbar-fill" value={shape.fill} onChange={event => onUpdate({ fill: event.target.value } as CanvasElementPatch)} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
          </label>
          <label title={t('labels.toolbar.borda')} className="grid h-8 w-8 cursor-pointer place-items-center">
            <span className="sr-only">{t('labels.toolbar.borda')}</span>
            <input type="color" data-testid="toolbar-stroke" value={shape.stroke} onChange={event => onUpdate({ stroke: event.target.value } as CanvasElementPatch)} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
          </label>
          <span className={sep} />
        </>
      )}

      {onAlign && elements.length > 1 && (
        <>
          <button type="button" title={t('labels.alinhar')} aria-label={t('labels.alinhar_esquerda')} className={btn} onClick={() => onAlign('left')}><AlignLeft size={16} /></button>
          <button type="button" title={t('labels.alinhar')} aria-label={t('labels.alinhar_centro_h')} className={btn} onClick={() => onAlign('centerX')}><AlignCenter size={16} /></button>
          <button type="button" title={t('labels.alinhar')} aria-label={t('labels.alinhar_direita')} className={btn} onClick={() => onAlign('right')}><AlignRight size={16} /></button>
          <span className={sep} />
        </>
      )}

      {single && single.type !== 'line' && (
        <>
          <button type="button" data-testid="toolbar-rotate90" title={t('labels.toolbar.girar_90')} aria-label={t('labels.toolbar.girar_90')} className={btn} onClick={() => onUpdate({ rotation: (rotation + 90) % 360 } as CanvasElementPatch)}><RotateCw size={16} /></button>
          <span data-testid="toolbar-rotation" className="w-14">
            <NumericField className="h-7 w-14 rounded border border-[rgba(96,165,250,0.14)] bg-transparent px-1 text-xs text-[#CBD5E1]" label={t('labels.toolbar.rotacao')} min={0} max={359} step={1} value={rotation} onCommit={next => onUpdate({ rotation: next } as CanvasElementPatch)} />
          </span>
          <span className={sep} />
        </>
      )}
      {onGroup && elements.length > 1 && <button type="button" data-testid="toolbar-group" title={t('labels.agrupar')} aria-label={t('labels.agrupar')} className={btn} onClick={() => onGroup(false)}><Group size={16} /></button>}
      {onGroup && elements.some(el => el.groupId) && <button type="button" data-testid="toolbar-ungroup" title={t('labels.desagrupar')} aria-label={t('labels.desagrupar')} className={btn} onClick={() => onGroup(true)}><Ungroup size={16} /></button>}
      {onToggleLock && elements.length > 0 && <button type="button" data-testid="toolbar-lock" title={elements.every(el => el.locked) ? t('labels.destravar') : t('labels.travar')} aria-label={elements.every(el => el.locked) ? t('labels.destravar') : t('labels.travar')} aria-pressed={elements.every(el => el.locked)} className={btn} onClick={onToggleLock}>{elements.every(el => el.locked) ? <Unlock size={16} /> : <Lock size={16} />}</button>}
      <button type="button" data-testid="toolbar-duplicate" title={t('labels.toolbar.duplicar')} aria-label={t('labels.toolbar.duplicar')} className={btn} onClick={onDuplicate}><Copy size={16} /></button>
      {single && (
        <>
          <button type="button" title={t('labels.toolbar.trazer_frente')} aria-label={t('labels.toolbar.trazer_frente')} className={btn} onClick={() => onLayer(true)}><ArrowUp size={16} /></button>
          <button type="button" title={t('labels.toolbar.enviar_tras')} aria-label={t('labels.toolbar.enviar_tras')} className={btn} onClick={() => onLayer(false)}><ArrowDown size={16} /></button>
        </>
      )}
      <button type="button" data-testid="toolbar-delete" title={t('labels.toolbar.excluir')} aria-label={t('labels.toolbar.excluir')} className={`${btn} hover:text-red-400`} onClick={onRemove}><Trash2 size={16} /></button>
      <span className={sep} />
      <button type="button" data-testid="toolbar-more" title={t('labels.toolbar.mais_opcoes')} aria-label={t('labels.toolbar.mais_opcoes')} className={btn} onClick={onMore}><SlidersHorizontal size={16} /></button>
    </div>
  );
}
