export interface DualCalibration {
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  columnWidth: number;
  columnGap: number;
}

export interface PrintCalibration {
  dual: DualCalibration;
  offsets: Record<'100x50' | '150x100' | '100x150' | '100x30 (2Col)', { x: number; y: number }>;
}

export const CALIBRATION_STORAGE_KEY = 'audixlog:print_calibration';

export const DEFAULT_CALIBRATION: PrintCalibration = {
  dual: { pageWidth: 106, pageHeight: 30, leftMargin: 3, columnWidth: 50, columnGap: 3.5 },
  offsets: {
    '100x50': { x: 0, y: 0 },
    '150x100': { x: 0, y: 0 },
    '100x150': { x: 0, y: 0 },
    '100x30 (2Col)': { x: 0, y: 0 },
  },
};

export const OFFSET_RANGE_MM = 10;
export const OFFSET_STEP_MM = 0.5;

const num = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, parsed));
};

export function normalizeCalibration(raw: unknown): PrintCalibration {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<PrintCalibration>;
  const dual = (source.dual ?? {}) as Partial<DualCalibration>;
  const d = DEFAULT_CALIBRATION.dual;
  const offsets = { ...DEFAULT_CALIBRATION.offsets };
  (Object.keys(offsets) as (keyof typeof offsets)[]).forEach(key => {
    const o = source.offsets?.[key];
    offsets[key] = {
      x: num(o?.x, 0, -OFFSET_RANGE_MM, OFFSET_RANGE_MM),
      y: num(o?.y, 0, -OFFSET_RANGE_MM, OFFSET_RANGE_MM),
    };
  });
  return {
    dual: {
      pageWidth: num(dual.pageWidth, d.pageWidth, 40, 300),
      pageHeight: num(dual.pageHeight, d.pageHeight, 10, 300),
      leftMargin: num(dual.leftMargin, d.leftMargin, 0, 30),
      columnWidth: num(dual.columnWidth, d.columnWidth, 20, 150),
      columnGap: num(dual.columnGap, d.columnGap, 0, 30),
    },
    offsets,
  };
}

export function loadCalibration(): PrintCalibration {
  try {
    const stored = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    return normalizeCalibration(stored ? JSON.parse(stored) : null);
  } catch {
    return normalizeCalibration(null);
  }
}

export function saveCalibration(value: PrintCalibration): void {
  localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(normalizeCalibration(value)));
}

export function resetCalibration(): PrintCalibration {
  localStorage.removeItem(CALIBRATION_STORAGE_KEY);
  return normalizeCalibration(null);
}

/** Posição em mm de cada coluna do 2Col, já com o ajuste fino aplicado. */
export function dualColumnsX(c: DualCalibration, offsetX: number): { col1: number; col2: number } {
  return {
    col1: c.leftMargin + offsetX,
    col2: c.leftMargin + c.columnWidth + c.columnGap + offsetX,
  };
}
