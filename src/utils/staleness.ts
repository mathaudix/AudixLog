import type { NotaFiscal } from '../types';

/** Conferência já concluída (com ou sem divergência): a nota não fica parada. */
export const FINAL_CONFERENCE_STATUSES: ReadonlySet<string> = new Set(['conferida', 'divergente']);
/** Movimentação logística já encerrada (expedida): a nota não fica parada. */
export const FINAL_LOGISTIC_STATUSES: ReadonlySet<string> = new Set(['expedido']);

export interface StaleInfo { stale: boolean; ms: number }
type StaleSource = Pick<NotaFiscal, 'createdAt' | 'status' | 'statusConferencia'>;

const NONE: StaleInfo = { stale: false, ms: 0 };

/** Converte Timestamp do Firestore, Date, string ISO ou número em milissegundos. */
export function toMillis(value: unknown): number | null {
  if (value && typeof value === 'object' && typeof (value as { getTime?: unknown }).getTime === 'function') {
    const time = (value as { getTime: () => number }).getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'string') { const parsed = Date.parse(value); return Number.isNaN(parsed) ? null : parsed; }
  if (value && typeof value === 'object') {
    if ('toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate().getTime();
    if ('seconds' in value && typeof (value as { seconds: unknown }).seconds === 'number') return (value as { seconds: number }).seconds * 1000;
  }
  return null;
}

/** Nota parada = ainda não conferida há mais de `hours` horas desde a entrada. `hours <= 0` desliga. */
export function getStaleInfo(nf: StaleSource, nowMs: number, hours: number): StaleInfo {
  if (!(hours > 0)) return NONE;
  if (FINAL_LOGISTIC_STATUSES.has(nf.status) || FINAL_CONFERENCE_STATUSES.has(nf.statusConferencia)) return NONE;
  const start = toMillis(nf.createdAt);
  if (start === null) return NONE;
  const ms = nowMs - start;
  if (ms <= 0) return NONE;
  return { stale: ms > hours * 3_600_000, ms };
}

/** Decompõe uma duração em dias, horas e minutos. */
export function formatStaleDuration(ms: number): { d: number; h: number; m: number } {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  return { d: Math.floor(totalMinutes / 1440), h: Math.floor((totalMinutes % 1440) / 60), m: totalMinutes % 60 };
}
