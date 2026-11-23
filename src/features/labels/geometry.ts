import type { CanvasElement } from './types';
import { LIMITS, clampLimit } from './limits';

export interface SnapGuide { axis: 'x' | 'y'; position: number }
export interface CanvasSize { width: number; height: number }
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function logoHeaderHeight(canvasHeight: number): number {
  return Math.max(15, Math.min(45, canvasHeight * 0.13)) + 4;
}

export function normalizeRotation(deg: number): number {
  const n = Number.isFinite(deg) ? Math.round(deg) : 0;
  return ((n % 360) + 360) % 360;
}

export function snapRotation(deg: number, fine: boolean): number {
  const n = normalizeRotation(deg);
  if (fine) return normalizeRotation(Math.round(n / 15) * 15);
  for (const target of [0, 90, 180, 270, 360]) if (Math.abs(n - target) < 4) return target % 360;
  return n;
}

export function rotatedBox(width: number, height: number, deg: number): { width: number; height: number } {
  const rad = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return { width: width * c + height * s, height: width * s + height * c };
}

export function normalizeLabelElements(elements: CanvasElement[], minimumY: number): CanvasElement[] {
  return elements.filter(element => (element as { type: string }).type !== 'logo')
    .map(element => element.y < minimumY ? { ...element, y: minimumY } as CanvasElement : element)
    .map(element => element.type === 'text' && element.fontSize > LIMITS.fontSize.max ? { ...element, fontSize: LIMITS.fontSize.max } as CanvasElement : element);
}

export function elementBounds(item: CanvasElement): { width: number; height: number } {
  if (item.type === 'text') return { width: item.width ?? Math.max(65, item.text.length * item.fontSize * 0.58), height: item.height ?? item.fontSize * 1.5 };
  if (item.type === 'icon') return { width: item.size, height: item.size };
  return { width: item.width, height: item.height };
}

export function moveElement(elements: CanvasElement[], id: string, dx: number, dy: number, zoom: number, canvas: CanvasSize): { elements: CanvasElement[]; guides: SnapGuide[] } {
  const origin = elements.find(item => item.id === id);
  if (!origin) return { elements, guides: [] };
  const scale = Math.max(0.01, zoom / 100);
  const box = elementBounds(origin);
  let x = clampLimit(origin.x + dx / scale, LIMITS.pos);
  let y = clampLimit(origin.y + dy / scale, LIMITS.pos);
  const targetsX = [0, canvas.width / 2, canvas.width];
  const targetsY = [0, canvas.height / 2, canvas.height];
  for (const item of elements) {
    if (item.id === id) continue;
    const bounds = elementBounds(item);
    targetsX.push(item.x, item.x + bounds.width / 2, item.x + bounds.width);
    targetsY.push(item.y, item.y + bounds.height / 2, item.y + bounds.height);
  }
  const align = (positions: number[], targets: number[]): { delta: number; guide: number | null } => {
    let best = Number.POSITIVE_INFINITY; let correction = 0; let guide: number | null = null;
    for (const position of positions) for (const target of targets) {
      const distance = Math.abs(position - target);
      if (distance <= 5.000001 && distance < best) { best = distance; correction = target - position; guide = target; }
    }
    return { delta: correction, guide };
  };
  const sx = align([x, x + box.width / 2, x + box.width], targetsX);
  const sy = align([y, y + box.height / 2, y + box.height], targetsY);
  x = clampLimit(x + sx.delta, LIMITS.pos);
  y = clampLimit(y + sy.delta, LIMITS.pos);
  const guides: SnapGuide[] = [];
  if (sx.guide !== null) guides.push({ axis: 'x', position: sx.guide });
  if (sy.guide !== null) guides.push({ axis: 'y', position: sy.guide });
  return { elements: elements.map(item => item.id === id ? { ...item, x, y } as CanvasElement : item), guides };
}

// Redimensiona em eixos locais do item girado. Ancora o canto/lado oposto no espaco global.
// rotation 0 delega ao resizeElement (comportamento identico ao atual).
export function resizeRotated(origin: CanvasElement, dx: number, dy: number, zoom: number, handle: ResizeHandle, minimumY = 0, sizeOverride?: { width: number; height: number }, pxPerUnit?: number): CanvasElement {
  const turn = origin.type === 'line' ? 0 : normalizeRotation(origin.rotation ?? 0);
  if (!turn) return resizeElement(origin, dx, dy, zoom, handle, minimumY, pxPerUnit, sizeOverride);
  const scale = pxPerUnit && pxPerUnit > 0 ? pxPerUnit : Math.max(0.01, zoom / 100);
  const gx = dx / scale, gy = dy / scale;
  const rad = (turn * Math.PI) / 180;
  // delta do ponteiro no eixo local do item (rotacao inversa)
  const lx = gx * Math.cos(rad) + gy * Math.sin(rad);
  const ly = -gx * Math.sin(rad) + gy * Math.cos(rad);
  const box = sizeOverride ?? elementBounds(origin);
  const west = handle.includes('w'); const north = handle.includes('n');
  const east = handle.includes('e'); const south = handle.includes('s');
  const width = clampLimit(box.width + (east ? lx : west ? -lx : 0), LIMITS.dim);
  const height = clampLimit(box.height + (south ? ly : north ? -ly : 0), LIMITS.dim);
  // Ancora: ponto local oposto a alca (em relacao ao centro do item). Fica fixo no espaco global.
  const anchorLocal = { x: west ? box.width / 2 : east ? -box.width / 2 : 0, y: north ? box.height / 2 : south ? -box.height / 2 : 0 };
  const cxOld = origin.x + box.width / 2, cyOld = origin.y + box.height / 2;
  const toGlobal = (p: { x: number; y: number }, cx: number, cy: number) => ({ x: cx + p.x * Math.cos(rad) - p.y * Math.sin(rad), y: cy + p.x * Math.sin(rad) + p.y * Math.cos(rad) });
  const anchorGlobal = toGlobal(anchorLocal, cxOld, cyOld);
  // novo centro: ancora local no novo tamanho, posicionada para coincidir com a ancora global antiga
  const newAnchorLocal = { x: west ? width / 2 : east ? -width / 2 : 0, y: north ? height / 2 : south ? -height / 2 : 0 };
  const dxRot = newAnchorLocal.x * Math.cos(rad) - newAnchorLocal.y * Math.sin(rad);
  const dyRot = newAnchorLocal.x * Math.sin(rad) + newAnchorLocal.y * Math.cos(rad);
  const newCx = anchorGlobal.x - dxRot, newCy = anchorGlobal.y - dyRot;
  const x = clampLimit(newCx - width / 2, LIMITS.pos);
  const y = clampLimit(Math.max(minimumY, newCy - height / 2), LIMITS.pos);
  if (origin.type === 'text') return { ...origin, x, y, width, height, fontSize: clampLimit(Math.round(origin.fontSize * Math.min(width / Math.max(LIMITS.dim.min, box.width), height / Math.max(LIMITS.dim.min, box.height))), LIMITS.fontSize) };
  if (origin.type === 'icon') return { ...origin, x, y, size: clampLimit(Math.min(width, height), LIMITS.dim) };
  return { ...origin, x, y, width, height } as CanvasElement;
}

// Texto: alca de canto escala a fonte com a caixa (proporcional); alca lateral so muda a largura.
// Fonte limitada a LIMITS.fontSize (200).
function textResult(origin: Extract<CanvasElement, { type: 'text' }>, x: number, y: number, width: number, height: number, box: { width: number; height: number }, handle: ResizeHandle): CanvasElement {
  const corner = handle.length === 2;
  const ratio = Math.min(width / Math.max(LIMITS.dim.min, box.width), height / Math.max(LIMITS.dim.min, box.height));
  const fontSize = corner ? clampLimit(Math.round(origin.fontSize * ratio), LIMITS.fontSize) : origin.fontSize;
  const vertical = handle === 'n' || handle === 's';
  return { ...origin, x, y, width: vertical ? box.width : width, height: corner || vertical ? height : box.height, fontSize } as CanvasElement;
}

export function resizeElement(origin: CanvasElement, dx: number, dy: number, zoom: number, handle: ResizeHandle, minimumY = 0, pxPerUnit?: number, sizeOverride?: { width: number; height: number }): CanvasElement {
  const scale = pxPerUnit && pxPerUnit > 0 ? pxPerUnit : Math.max(0.01, zoom / 100);
  const deltaX = dx / scale; const deltaY = dy / scale;
  const box = sizeOverride ?? elementBounds(origin);
  const west = handle.includes('w'); const north = handle.includes('n');
  const east = handle.includes('e'); const south = handle.includes('s');
  const width = clampLimit(box.width + (east ? deltaX : west ? -deltaX : 0), LIMITS.dim);
  const height = clampLimit(box.height + (south ? deltaY : north ? -deltaY : 0), LIMITS.dim);
  const x = clampLimit(west ? origin.x + box.width - width : origin.x, LIMITS.pos);
  const y = clampLimit(north ? origin.y + box.height - height : origin.y, LIMITS.pos);
  if (origin.type === 'text') return textResult(origin, x, y, width, height, box, handle);
  if (origin.type === 'icon') return { ...origin, x, y, size: clampLimit(Math.min(width, height), LIMITS.dim) };
  return { ...origin, x, y, width, height } as CanvasElement;
}

// Redimensiona