export interface DivergenceInput { pesoEsperado: number; pesoConferido?: number; volEsperado: number; volConferido?: number }
export interface DivergenceTolerance { weightTolerancePct: number; volumeTolerance: number }
export interface DivergenceResult { hasCheck: boolean; weightDiffKg: number; weightDiffPct: number | null; weightOk: boolean; volumeDiff: number; volumeOk: boolean; divergent: boolean }

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const round = (value: number, digits: number): number => { const factor = 10 ** digits; return Math.round(value * factor) / factor; };

export function calcDivergence(input: DivergenceInput, tolerance: DivergenceTolerance): DivergenceResult {
  const hasWeight = isNumber(input.pesoConferido);
  const hasVolume = isNumber(input.volConferido);
  const conferidoKg = input.pesoConferido ?? 0;
  const conferidoVol = input.volConferido ?? 0;
  const hasCheck = hasWeight || hasVolume;
  const weightDiffKg = hasWeight ? round(conferidoKg - input.pesoEsperado, 3) : 0;
  const weightDiffPct = hasWeight && input.pesoEsperado > 0 ? round((weightDiffKg / input.pesoEsperado) * 100, 2) : null;
  const weightOk = !hasWeight || (input.pesoEsperado > 0 ? Math.abs(weightDiffPct ?? 0) <= tolerance.weightTolerancePct : conferidoKg === 0);
  const volumeDiff = hasVolume ? conferidoVol - input.volEsperado : 0;
  const volumeOk = !hasVolume || Math.abs(volumeDiff) <= tolerance.volumeTolerance;
  return { hasCheck, weightDiffKg, weightDiffPct, weightOk, volumeDiff, volumeOk, divergent: hasCheck && (!weightOk || !volumeOk) };
}

export function signed(value: number, digits: number): string {
  const text = value.toFixed(digits);
  return value > 0 ? `+${text}` : text;
}
