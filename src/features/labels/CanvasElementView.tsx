import { logisticsIconMarkup } from './logisticsIcons';
import { memo, useEffect, useRef, useState, type PointerEvent } from 'react';
import { getJsBarcode, loadJsBarcode } from '../../utils/barcodeLoader';
import type { CanvasElement, IconElement, LabelNfContext } from './types';
import type { ResizeHandle } from './geometry';
import { escapeHtml } from '../../utils/escapeHtml';
import { Lock, RotateCw } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { fitFontSize } from '../../utils/fitFontSize';
import { abreviarFornecedor } from '../../utils/labelPrintCore';

export function replaceLabelVariables(value: string, nf?: LabelNfContext, volume = 1, total = 1): string {
  const variables: Record<string, string> = {
    NUMERO: nf?.numero ?? '', FILIAL: nf?.filial ?? '', FORNECEDOR: nf?.fornecedor ? abreviarFornecedor(nf.fornecedor) : '', REMETENTE: nf?.fornecedor ? abreviarFornecedor(nf.fornecedor) : '', CHAVE: nf?.chaveAcesso ?? '',
    VOL: String(volume), TOTAL_VOL: String(total), VOLUMES: String(nf?.volumes ?? total), PESO: String(nf?.peso ?? ''),
    VALOR: nf ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nf.valor || 0) : '',
  };
  return value.replace(/\{(NUMERO|FILIAL|FORNECEDOR|CHAVE|VOL|TOTAL_VOL|VOLUMES|PESO|VALOR)\}/g, (_match, key: string) => variables[key] ?? '');
}
const paths: Partial<Record<IconElement['iconType'], string>> = {
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  truck: '<path d="M10 17h4V5H2v12h3m9 0h2m6 0h-2v-3.3a4 4 0 0 0-1.2-2.8L19 9h-5m-6 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/>',
  fragile: '<path d="M8 22h8m-4-7v7m0-7a7 7 0 0 0 7-7c0-2-1-5-1-5H6S5 6 5 8a7 7 0 0 0 7 7Z"/>', up: '<path d="M12 19V5m-7 7 7-7 7 7"/>',
  umbrella: '<path d="M12 2v20M4 10a8 8 0 0 1 16 0H4Zm8 12a2 2 0 0 0 2-2"/>', thermometer: '<path d="M14 14.8V3.5a2.5 2.5 0 0 0-5 0v11.3a4.5 4.5 0 1 0 5 0ZM11.5 7v4"/>',
  recycle: '<path d="m7 19-3-3 3-3m-3 3h8a3 3 0 0 0 2.6-1.5M17 5l3 3-3 3m3-3h-8a3 3 0 0 0-2.6 1.5M9 4l-3-2 2-3m-2 3v7"/>', pallet: '<path d="M2 17h20v2H2zm4 0v3m6-3v3m6-3v3M4 17V8h5v9m2-9h5v9m2-9h2v9"/>',
  warning: '<path d="m21 18-8-14a2 2 0 0 0-3 0L3 18a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3ZM12 9v4m0 4h.01"/>', forklift: '<path d="M12 12H5a2 2 0 0 0-2 2v5h18v-2h-3M8 12V8a2 2 0 0 1 2-2h2m2 6v7m8-2v-6h-3V7a1 1 0 0 0-1-1h-2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
  filial: '<path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 8h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/>', cidade: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  perecivel: '<path d="M11 20A7 7 0 0 1 10 6c5-1 7-2 9-4 1 2 2 4 2 8a10 10 0 0 1-10 10ZM2 21c0-3 2-5 5-6m2 3 6-6"/>', flammable: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1-2-.2-4 2-6 .5 2.5 2 5 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>',
  glass: '<path d="M5 5c0 4 3 7 7 7s7-3 7-7H5Zm7 7v9m-4 0h8"/>', heavy: '<circle cx="12" cy="5" r="3"/><path d="m6.5 8-3 11a2 2 0 0 0 2 3h13a2 2 0 0 0 2-3l-3-11Z"/>',
};
export function iconSvg(type: IconElement['iconType'], color: string, size: number): string {
  const logistics = logisticsIconMarkup(type, color, size); if (logistics) return logistics;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${escapeHtml(color)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[type] ?? paths.box}</svg>`;
}
function polygon(type: 'triangle' | 'hexagon' | 'star'): string {
  return type === 'triangle' ? '50,0 100,100 0,100' : type === 'hexagon' ? '50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25' : '50,5 61,35 95,35 68,55 78,85 50,70 22,85 32,55 5,35 39,35';
}
interface Props {
  element: CanvasElement; scale?: number; preview?: boolean; selected?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLElement>, element: CanvasElement, mode: 'drag' | 'resize' | 'rotate', handle?: ResizeHandle) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void; onPointerUp?: () => void; onSelect?: (event: MouseEvent) => void; onDoubleSelect?: () => boolean;
  onEdit?: (element: CanvasElement, value: string) => void; nf?: LabelNfContext; volume?: number; total?: number;
}
const HANDLE_POSITIONS: { key: ResizeHandle; x: string; y: string; cursor: string }[] = [
  { key: 'nw', x: '0%', y: '0%', cursor: 'nwse-resize' }, { key: 'n', x: '50%', y: '0%', cursor: 'ns-resize' }, { key: 'ne', x: '100%', y: '0%', cursor: 'nesw-resize' },
  { key: 'e', x: '100%', y: '50%', cursor: 'ew-resize' }, { key: 'se', x: '100%', y: '100%', cursor: 'nwse-resize' }, { key: 's', x: '50%', y: '100%', cursor: 'ns-resize' },
  { key: 'sw', x: '0%', y: '100%', cursor: 'nesw-resize' }, { key: 'w', x: '0%', y: '50%', cursor: 'ew-resize' },
];
function CanvasElementViewComponent({ element, scale = 1, preview = false, selected = false, onPointerDown, onPointerMove, onPointerUp, onSelect, onDoubleSelect, onEdit, nf, volume = 1, total = 1 }: Props) {
  const { t } = useI18n();
  const barcodeRef = useRef<SVGSVGElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const barcode = element.type === 'barcode' ? replaceLabelVariables(element.value, nf, volume, total) : '';
  const [barcodeReady, setBarcodeReady] = useState(() => getJsBarcode() !== null);
  useEffect(() => { if (element.type !== 'barcode' || barcodeReady) return; let alive = true; void loadJsBarcode().then(() => { if (alive) setBarcodeReady(true); }); return () => { alive = false; }; }, [element.type, barcodeReady]);
  useEffect(() => {
    const JsBarcode = getJsBarcode();
    if (!barcodeRef.current || element.type !== 'barcode' || !JsBarcode) return;
    try { JsBarcode(barcodeRef.current, barcode || '1234', { format: 'CODE128', displayValue: true, margin: 0, background: 'transparent', lineColor: '#111827', width: 1.5, height: Math.max(12, element.height - 20), fontSize: 10 }); barcodeRef.current.setAttribute('preserveAspectRatio', 'none'); }
    catch { barcodeRef.current.innerHTML = ''; }
  }, [barcode, element, barcodeReady]);
  useEffect(() => { if (editing) editRef.current?.focus(); }, [editing]);
  const textValue = element.type === 'text' ? replaceLabelVariables(element.text, nf, volume, total) : '';
  const width = element.type === 'text' ? element.width ?? Math.max(65, textValue.length * element.fontSize * 0.58) : element.type === 'icon' ? element.size : element.width;
  const height = element.type === 'text' ? element.height ?? element.fontSize * 1.5 : element.type === 'icon' ? element.size : element.height;
  const begin = (event: PointerEvent<HTMLElement>) => {
    if (preview || editing || element.locked) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-rotate]')) { onPointerDown?.(event, element, 'rotate', 'se'); return; }
    const handle = target.closest<HTMLElement>('[data-resize]')?.dataset.resize as ResizeHandle | undefined;
    onPointerDown?.(event, element, handle ? 'resize' : 'drag', handle ?? 'se');
  };
  const fittedFont = element.type === 'text' ? fitFontSize(textValue, element.fontSize, width, height, element.fontFamily, element.fontWeight) : 0;
  const contentStyle = element.type === 'text' ? { color: element.fill, fontFamily: element.fontFamily, fontSize: fittedFont * scale, fontWeight: element.fontWeight, fontStyle: element.fontStyle, textDecoration: element.textDecoration, textAlign: element.textAlign as 'left' | 'center' | 'right', backgroundColor: element.bgColor, whiteSpace: textValue.includes('\n') ? 'pre-wrap' as const : 'nowrap' as const, lineHeight: 1.1, overflow: 'visible' as const } : undefined;
  const turn = element.type === 'line' ? 0 : (((element.rotation ?? 0) % 360) + 360) % 360;
  return <div data-element-id={element.id} data-element-type={element.type} data-rotation={turn} className={`absolute select-none ${selected && !preview ? 'z-[60]' : ''} `} style={{ left: element.x * scale, top: element.y * scale, width: width * scale, height: height * scale, zIndex: element.zIndex, transform: turn ? `rotate(${turn}deg)` : undefined, transformOrigin: 'center' }} onPointerDown={begin} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onLostPointerCapture={onPointerUp} onClick={event => onSelect?.(event.nativeEvent)} onDoubleClick={() => { if (!preview && onDoubleSelect?.()) return; if (element.type === 'text' && !preview) { setDraft(element.text); setEditing(true); } }}>
    {element.type === 'text' && <div className="h-full w-full" style={contentStyle}>{textValue}</div>}
    {element.type === 'barcode' && <div className="h-full w-full overflow-hidden"><svg ref={barcodeRef} className="block h-full w-full" width="100%" height="100%" preserveAspectRatio="none" /></div>}
    {element.type === 'icon' && <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: iconSvg(element.iconType, element.fill, element.size * scale) }} />}
    {element.type === 'line' && <div className="h-full w-full origin-left" style={{ height: Math.max(2, element.height * scale), backgroundColor: element.fill, transform: `rotate(${element.rotation}deg)` }} />}
    {['rect', 'circle', 'triangle', 'hexagon', 'star'].includes(element.type) && <div className="h-full w-full" style={{ backgroundColor: element.type === 'triangle' || element.type === 'hexagon' || element.type === 'star' || !('fill' in element) ? 'transparent' : element.fill, border: ['triangle', 'hexagon', 'star'].includes(element.type) ? 'none' : `${Math.max(0.5, 'strokeWidth' in element ? element.strokeWidth * scale : 1)}px solid ${'stroke' in element ? element.stroke : '#111'}`, borderRadius: element.type === 'circle' ? '50%' : undefined, boxSizing: 'border-box' }}>{['triangle', 'hexagon', 'star'].includes(element.type) && <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points={polygon(element.type as 'triangle' | 'hexagon' | 'star')} fill={'fill' in element ? element.fill : 'transparent'} stroke={'stroke' in element ? element.stroke : '#111'} strokeWidth={'strokeWidth' in element ? element.strokeWidth : 1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></svg>}</div>}
    {!preview && !editing && element.locked && <span data-testid="lock-badge" className="pointer-events-none absolute -right-1 -top-1 z-[71] grid h-3.5 w-3.5 place-items-center rounded-full bg-zinc-700 text-white"><Lock size={9} /></span>}
    {!preview && !editing && selected && <><div className="pointer-events-none absolute -inset-px border border-blue-500" />{element.type !== 'line' && !element.locked && <button type="button" aria-label={t('labels.toolbar.alca_girar')} title={t('labels.toolbar.alca_girar')} data-rotate="1" tabIndex={-1} className="absolute left-1/2 z-[72] flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-white bg-blue-500 text-white shadow-sm" style={{ top: -26, cursor: 'grab', touchAction: 'none' }}><RotateCw size={12} /></button>}{!element.locked && HANDLE_POSITIONS.map(handle => <button key={handle.key} type="button" aria-label={`Redimensionar ${handle.key}`} className="absolute z-[70] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-blue-500 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" style={{ left: handle.x, top: handle.y, cursor: handle.cursor, touchAction: 'none' }} data-resize={handle.key} tabIndex={-1} />)}</>}
    {editing && element.type === 'text' && <textarea ref={editRef} className="absolute inset-0 z-[80] h-full w-full resize-none border border-blue-500 bg-white/95 p-0 text-black outline-none" style={{ fontFamily: element.fontFamily, fontSize: element.fontSize * scale, fontWeight: element.fontWeight, fontStyle: element.fontStyle }} value={draft} onChange={event => setDraft(event.target.value)} onPointerDown={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.currentTarget.blur(); } }} onBlur={() => { onEdit?.(element, draft); setEditing(false); }} />}
  </div>;
}
export const CanvasElementView = memo(CanvasElementViewComponent);
