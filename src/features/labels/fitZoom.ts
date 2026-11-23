export interface FitInput {
  viewportWidth: number;
  viewportHeight: number;
  labelWidth: number;
  labelHeight: number;
  paddingX?: number;
  paddingY?: number;
}

export const ZOOM_MIN = 25;
export const ZOOM_MAX = 200;

/** Zoom (%) que faz a etiqueta caber inteira no viewport, com margem e limites. */
export function fitZoom({ viewportWidth, viewportHeight, labelWidth, labelHeight, paddingX = 96, paddingY = 160 }: FitInput): number {
  if (!(labelWidth > 0) || !(labelHeight > 0)) return 100;
  const availableWidth = Math.max(240, viewportWidth - paddingX);
  const availableHeight = Math.max(200, viewportHeight - paddingY);
  const raw = Math.min((availableWidth / labelWidth) * 100, (availableHeight / labelHeight) * 100);
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.floor(raw)));
}

/** Escala real (unidades do canvas -> px na tela) medida a partir do DOM renderizado. */
export function pxPerUnit(renderedWidthPx: number, labelWidthUnits: number): number {
  if (!(renderedWidthPx > 0) || !(labelWidthUnits > 0)) return 0;
  return renderedWidthPx / labelWidthUnits;
}
