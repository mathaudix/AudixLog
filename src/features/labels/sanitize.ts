import type { CanvasElement, LabelData, LabelFormat } from './types';

export function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => item === undefined ? null : stripUndefined(item));
  if (value && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return value;
    return Object.fromEntries(Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, stripUndefined(item)]));
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return 0;
  return value;
}

export function sanitizeLabelData(input: LabelData): LabelData {
  const safe = stripUndefined(input) as { formato?: LabelFormat; elements?: Array<CanvasElement | { type?: string }> };
  return {
    formato: safe.formato ?? '100x30 (2Col)',
    elements: (safe.elements ?? []).filter(item => item.type !== 'logo') as CanvasElement[],
  };
}
