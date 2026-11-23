import { dualColumnsX, type PrintCalibration } from './printCalibration';

function ruler(): string {
  let marks = '';
  for (let mm = 0; mm <= 110; mm += 1) {
    const h = mm % 10 === 0 ? 3 : 1.5;
    marks += `<div style="position:absolute;left:${mm}mm;top:0;width:0.2mm;height:${h}mm;background:#000"></div>`;
    if (mm % 10 === 0) marks += `<div style="position:absolute;left:${mm + 0.6}mm;top:3.2mm;font-size:2mm">${mm}</div>`;
  }
  return marks;
}

function cell(x: number, colWidth: number, pageHeight: number, label: string): string {
  return `<div style="position:absolute;left:${x}mm;top:0;width:${colWidth}mm;height:${pageHeight}mm;box-sizing:border-box;border:0.3mm solid #000">
    <div style="position:absolute;left:50%;top:0;width:0.2mm;height:100%;background:#000"></div>
    <div style="position:absolute;top:50%;left:0;height:0.2mm;width:100%;background:#000"></div>
    <div style="position:absolute;left:2mm;bottom:1mm;font:bold 3mm Arial">${label}</div>
  </div>`;
}

/** Abre uma página 2 colunas com moldura, cruz e régua para conferir o alinhamento. */
export function openCalibrationTest(cal: PrintCalibration): void {
  const d = cal.dual;
  const off = cal.offsets['100x30 (2Col)'];
  const cols = dualColumnsX(d, off.x);
  const body = `<div style="position:absolute;left:0;top:0;width:${d.pageWidth}mm;height:${d.pageHeight}mm;transform:translateY(${off.y}mm)">
    <div style="position:absolute;left:0;top:0;width:${d.pageWidth}mm;height:5mm">${ruler()}</div>
    ${cell(cols.col1, d.columnWidth, d.pageHeight, 'ETQ 1')}
    ${cell(cols.col2, d.columnWidth, d.pageHeight, 'ETQ 2')}
  </div>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page{size:${d.pageWidth}mm ${d.pageHeight}mm;margin:0}
html,body{margin:0;padding:0;width:${d.pageWidth}mm;height:${d.pageHeight}mm;overflow:hidden;background:#fff}
</style></head><body>${body}<script>window.addEventListener('load',()=>{document.fonts.ready.then(()=>requestAnimationFrame(()=>window.print()))})</script></body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
