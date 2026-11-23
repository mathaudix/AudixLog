export const LIMITS = { fontSize: { min: 1, max: 200 }, dim: { min: 0.5, max: 1000 }, pos: { min: -1000, max: 1000 }, stroke: { min: 0, max: 50 }, qty: { min: 1, max: 9999 }, radius: { min: 0, max: 500 } } as const;
export function clampLimit(value: number, range: { min: number; max: number }): number { return Number.isFinite(value) ? Math.min(range.max, Math.max(range.min, value)) : range.min; }
