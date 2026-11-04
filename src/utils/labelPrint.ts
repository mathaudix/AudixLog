import { getJsBarcode } from './barcodeLoader';
import { escapeHtml } from './escapeHtml';
import { fitFontSize } from './fitFontSize';
import { iconSvg, replaceLabelVariables } from '../features/labels/CanvasElementView';
import { LOGO_SVG_STRING, standardLabelMarkup, STANDARD_LABEL_CSS } from './labelPrintCore';
import type { CanvasElement, LabelData, LabelFormat, LabelNfContext } from '../features/labels/types';
import { logoHeaderHeight, normalizeLabelElements } from '../features/labels/geometry';
import { LABEL_DIMENSIONS } from '../features/labels/constants';
import { loadCalibration, dualColumnsX, type PrintCalibration } from './printCalibration';

const esc = (value: unknown): string => escapeHtml(value ?? '');
const polygonPoints = (type: 'triangle' | 'hexagon' | 'star'): string => type === 'triangle'
  ? '50,0 100,100 0,100'
  : type === 'hexagon' ? '50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25'
  : '50,5 61,35 95,35 68,55 78,85 50,70 22,85 32,55 5,35 39,35';

export function barcodeSvg(value: string, height: number): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  try {
    const JsBarcode = getJsBarcode(); if (!JsBarcode) return '';
    JsBarcode(svg, value || '1234', { format: 'CODE128', displayValue: true, margin: 0, width: 1.5, height: Math.max(18, height - 18) });
    return svg.outerHTML;
  } catch { return ''; }
}

function renderElement(element: CanvasElement, nf: LabelNfContext | undefined, volume: number, total: number): string {
  const turn = element.type === 'line' ? 0 : (((element.rotation ?? 0) % 360) + 360) % 360;
  const position = `position:absolute;left:${element.x}px;top:${element.y}px;z-index:${element.zIndex};${turn ? `transform:rotate(${turn}deg);transform-origin:center;` : ''}`;
  if (element.type === 'text') {
    const resolved = replaceLabelVariables(element.text, nf, volume, total);
    const text = resolved.split('\n').map(esc).join('<br>');
    const width = element.width ?? Math.max(65, ...resolved.split('\n').map(line => line.length * element.fontSize * 0.58));
    const height = element.height ?? element.fontSize * 1.5;
    const fontSize = fitFontSize(resolved, element.fontSize, width, height, element.fontFamily, element.fontWeight);
    const whiteSpace = resolved.includes('\n') ? 'pre-wrap' : 'nowrap';
    return `<div style="${position}width:${width}px;height:${height}px;font-family:${esc(element.fontFamily)};font-size:${fontSize}px;line-height:1.1;font-weight:${element.fontWeight};font-style:${element.fontStyle};text-decoration:${element.textDecoration};text-align:${element.textAlign};color:${esc(element.fill)};background:${esc(element.bgColor)};white-space:${whiteSpace};overflow:visible">${text}</div>`;
  }
  if (element.type === 'barcode') return `<div style="${position}width:${element.width}px;height:${element.height}px;overflow:hidden">${barcodeSvg(replaceLabelVariables(element.value, nf, volume, total), element.height)}</div>`;
  if (element.type === 'line') return `<div style="${position}width:${element.width}px;height:${Math.max(1, element.height)}px;background:${esc(element.fill)}"></div>`;
  if (element.type === 'icon') return `<div style="${position}width:${element.size}px;height:${element.size}px">${iconSvg(element.iconType, element.fill, element.size)}</div>`;
  if (element.type === 'rect' || element.type === 'circle') return `<div style="${position}width:${element.width}px;height:${element.height}px;background:${esc(element.fill)};border:${element.strokeWidth}px solid ${esc(element.stroke)};border-radius:${element.type === 'circle' ? '50%' : '0'}"></div>`;
  return `<div style="${position}width:${element.width}px;height:${element.height}px"><svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="${polygonPoints(element.type)}" fill="${esc(element.fill)}" stroke="${esc(element.stroke)}" stroke-width="${element.strokeWidth}" vector-effect="non-scaling-stroke"/></svg></div>`;
}

export function pageHtml(format: LabelFormat, content: string, calibration: PrintCalibration): string {
  const dual = format === '100x30 (2Col)';
  const pageWidth = dual ? `${calibration.dual.pageWidth}mm` : format === '150x100' ? '150mm' : '100mm';
  const pageHeight = dual ? `${calibration.dual.pageHeight}mm` : format === '100x150' ? '150mm' : format === '100x50' ? '50mm' : format === '150x100' ? '100mm' : '30mm';
  const pageSize = `${pageWidth} ${pageHeight}`;
  const off = calibration.offsets[format];
  const shift = dual ? '' : `transform:translate(${off.x}mm,${off.y}mm);`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@page{size:${pageSize};margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{width:${pageWidth};margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff}
.page{width:${pageWidth};height:${pageHeight};page-break-after:always;break-after:page;overflow:hidden;${shift}}.page:last-child{page-break-after:auto;break-after:auto}
${STANDARD_LABEL_CSS}
</style></head><body>${content}<script>
window.addEventListener('load',async()=>{try{await document.fonts.ready}catch{};requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()))})
</script></body></html>`;
}
function openPrintWindow(onBlocked: () => void): Window | null {
  const printWindow = window.open('', '_blank');
  if (!printWindow) onBlocked();
  return printWindow;
}
function fixedHeader(format: LabelFormat): string {
  const heightMm = format === '100x150' ? 150 : format === '150x100' ? 100 : format === '100x50' ? 50 : 30;
  const logoMm = Math.max(4, Math.min(12, heightMm * 0.13));
  const svg = LOGO_SVG_STRING(48).replace('width="48" height="48"', 'width="100%" height="100%"');
  return `<header aria-hidden="true" style="position:absolute;top:1mm;left:0;width:100%;height:${logoMm}mm;display:flex;align-items:center;justify-content:center;pointer-events:none"><span style="display:block;width:${logoMm}mm;height:${logoMm}mm">${svg}</span></header>`;
}

export function openAdvancedPrint(data: LabelData, nfs: LabelNfContext[], quantity: number, onBlocked: () => void): boolean {
  const printWindow = openPrintWindow(onBlocked);
  if (!printWindow) return false;
  const labels: { nf?: LabelNfContext; volume: number; total: number }[] = [];
  if (nfs.length) nfs.forEach(nf => { const total = Math.max(1, Number(nf.volumes) || 1); for (let volume = 1; volume <= total; volume += 1) labels.push({ nf, volume, total }); });
  else { const total = Math.max(1, quantity); for (let volume = 1; volume <= total; volume += 1) labels.push({ volume, total }); }
  const header = fixedHeader(data.formato);
  const printableElements = normalizeLabelElements(data.elements.filter(element => !element.hidden), logoHeaderHeight(LABEL_DIMENSIONS[data.formato].height));
  let content = '';
  if (data.formato === '100x30 (2Col)') {
    const cal = loadCalibration();
    const cols = dualColumnsX(cal.dual, cal.offsets['100x30 (2Col)'].x);
    const colY = cal.offsets['100x30 (2Col)'].y;
    const colWidth = cal.dual.columnWidth;
    const cell = (item: typeof labels[number] | undefined, x: number): string => item ? `<section style="position:absolute;left:${x}mm;top:${colY}mm;box-sizing:border-box;width:${colWidth}mm;height:${cal.dual.pageHeight}mm;overflow:hidden;background:white;padding:1mm 1.5mm">${header}${printableElements.map(element => renderElement(element, item.nf, item.volume, item.total)).join('')}</section>` : '';
    for (let index = 0; index < labels.length; index += 2) {
      content += `<div class="page" style="position:relative;width:${cal.dual.pageWidth}mm;height:${cal.dual.pageHeight}mm;overflow:hidden">${cell(labels[index], cols.col1)}${cell(labels[index + 1], cols.col2)}</div>`;
    }
  } else {
    const width = data.formato === '150x100' ? '150mm' : '100mm';
    const height = data.formato === '100x150' ? '150mm' : data.formato === '150x100' ? '100mm' : '50mm';
    content = labels.map(item => `<section class="page" style="position:relative;box-sizing:border-box;width:${width};height:${height};overflow:hidden;background:white">${header}${printableElements.map(element => renderElement(element, item.nf, item.volume, item.total)).join('')}</section>`).join('');
  }
  printWindow.document.write(pageHtml(data.formato, content, loadCalibration())); printWindow.document.close(); return true;
}

export function buildStandardPrintContent(nfs: LabelNfContext[], options: { format: LabelFormat; zoom: number; fontAdjust: number }): string {
  const format = options.format;
  const labels: { nf: LabelNfContext; volume: number; total: number }[] = [];
  nfs.forEach(nf => { const total = Math.max(1, Number(nf.volumes) || 1); for (let volume = 1; volume <= total; volume += 1) labels.push({ nf, volume, total }); });
  const render = (item: typeof labels[number]): string => standardLabelMarkup({
    format,
    supplier: item.nf.fornecedor,
    branch: item.nf.filial ?? 'S/D',
    nfNumber: item.nf.numero,
    volume: item.volume,
    total: item.total,
    header: '',
    fontAdjust: options.fontAdjust,
    zoom: options.zoom,
    barcodeMarkup: item.nf.chaveAcesso ? barcodeSvg(item.nf.chaveAcesso, 70) : '',
  });
  let content = '';
  if (format === '100x30 (2Col)') {
    const cal = loadCalibration();
    const cols = dualColumnsX(cal.dual, cal.offsets['100x30 (2Col)'].x);
    const colY = cal.offsets['100x30 (2Col)'].y;
    const colWidth = cal.dual.columnWidth;
    const cell = (item: typeof labels[number] | undefined, x: number): string => item ? `<section style="position:absolute;left:${x}mm;top:${colY}mm;box-sizing:border-box;width:${colWidth}mm;height:${cal.dual.pageHeight}mm;overflow:hidden;background:white;padding:0 1.5mm">${render(item)}</section>` : '';
    for (let i = 0; i < labels.length; i += 2) content += `<div class="page" style="position:relative;width:${cal.dual.pageWidth}mm;height:${cal.dual.pageHeight}mm;overflow:hidden">${cell(labels[i], cols.col1)}${cell(labels[i + 1], cols.col2)}</div>`;
  } else content = labels.map(render).join('');
  return content;
}

export function openStandardPrint(nfs: LabelNfContext[], options: { format: LabelFormat; zoom: number; fontAdjust: number }, onBlocked: () => void): boolean {
  const printWindow = openPrintWindow(onBlocked);
  if (!printWindow) return false;
  try {
    printWindow.document.write(pageHtml(options.format, buildStandardPrintContent(nfs, options), loadCalibration()));
    printWindow.document.close();
  } catch (error) {
    printWindow.close();
    throw error;
  }
  return true;
}
