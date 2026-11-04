import type { CanvasElement } from './types';
import { elementBounds, rotatedBox, type CanvasSize, type SnapGuide } from './geometry';

export interface Box { x: number; y: number; width: number; height: number }
export interface SnapResult { dx: number; dy: number; guides: SnapGuide[] }

export function rotationOf(item: CanvasElement): number {
  return (item as { rotation?: number }).rotation ?? 0;
}

/** Caixa do item no canvas; para itens girados, usa o retangulo envolvente do giro (mesmo centro). */
export function boxOf(item: CanvasElement): Box {
  const size = elementBounds(item);
  const rotated = rotatedBox(size.width, size.height, rotationOf(item));
  return {
    x: item.x + size.width / 2 - rotated.width / 2,
    y: item.y + size.height / 2 - rotated.height / 2,
    width: rotated.width,
    height: rotated.height,
  };
}

/** Para itens girados, empurra o item para dentro da etiqueta usando a caixa rotacionada (centro preservado). Itens sem giro nao mudam. */
export function keepInside(item: CanvasElement, canvas: CanvasSize): CanvasElement {
  if (rotationOf(item) === 0) return item;
  const box = boxOf(item);
  let dx = 0, dy = 0;
  if (box.width > canvas.width) dx = (canvas.width - box.width) / 2 - box.x;
  else if (box.x < 0) dx = -box.x;
  else if (box.x + box.width > canvas.width) dx = canvas.width - (box.x + box.width);
  if (box.height > canvas.height) dy = (canvas.height - box.height) / 2 - box.y;
  else if (box.y < 0) dy = -box.y;
  else if (box.y + box.height > canvas.height) dy = canvas.height - (box.y + box.height);
  return dx || dy ? { ...item, x: item.x + dx, y: item.y + dy } as CanvasElement : item;
}

/** Encaixa a caixa em movimento nas bordas e centros da etiqueta e das outras caixas. Limiar em unidades do canvas. */
export function computeSnap(moving: Box, others: Box[], canvas: CanvasSize, threshold: number): SnapResult {
  const targetsX = [0, canvas.width / 2, canvas.width];
  const targetsY = [0, canvas.height / 2, canvas.height];
  for (const other of others) {
    targetsX.push(other.x, other.x + other.width / 2, other.x + other.width);
    targetsY.push(other.y, other.y + other.height / 2, other.y + other.height);
  }
  const pick = (positions: number[], targets: number[]): { delta: number; line: number | null } => {
    let bestDistance = Number.POSITIVE_INFINITY;
    let delta = 0;
    let line: number | null = null;
    for (const position of positions) for (const target of targets) {
      const distance = Math.abs(target - position);
      if (distance <= threshold && distance < bestDistance) { bestDistance = distance; delta = target - position; line = target; }
    }
    return { delta, line };
  };
  const sx = pick([moving.x, moving.x + moving.width / 2, moving.x + moving.width], targetsX);
  const sy = pick([moving.y, moving.y + moving.height / 2, moving.y + moving.height], targetsY);
  const guides: SnapGuide[] = [];
  if (sx.line !== null) guides.push({ axis: 'x', position: sx.line });
  if (sy.line !== null) guides.push({ axis: 'y', position: sy.line });
  return { dx: sx.delta, dy: sy.delta, guides };
}
