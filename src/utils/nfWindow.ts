import type { NotaFiscal } from '../types';

export const WINDOW_OPTIONS = [30, 60, 90, 180] as const;
export const DEFAULT_WINDOW_DAYS = 90;
export const BACKUP_STALE_DAYS = 7;

/** Data de corte: notas com createdAt >= corte entram na janela. */
export function windowCutoff(days: number, now = Date.now()): Date {
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

/** Mescla listas por id; o primeiro ocorrência prevalece (ordem: abertas, depois janela). */
export function mergeNfsById(...lists: NotaFiscal[][]): NotaFiscal[] {
  const map = new Map<string, NotaFiscal>();
  for (const list of lists) for (const nf of list) if (!map.has(nf.id)) map.set(nf.id, nf);
  return [...map.values()];
}

/** Extrai data de createdAt (Timestamp do Firestore, Date ou null). Null = documento sem data. */
export function createdDateOf(nf: Pick<NotaFiscal, 'createdAt'>): Date | null {
  const value = nf.createdAt as unknown;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return null;
}

/** Notas com createdAt ausente ficam fora da janela; as abertas entram pela consulta de status. */
export function isInWindow(nf: Pick<NotaFiscal, 'createdAt'>, cutoff: Date): boolean {
  const date = createdDateOf(nf);
  return Boolean(date && date.getTime() >= cutoff.getTime());
}

export function formatBackupDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isBackupStale(lastIso: string | null, now = Date.now()): boolean {
  if (!lastIso) return true;
  const last = Date.parse(lastIso);
  return Number.isNaN(last) || now - last > BACKUP_STALE_DAYS * 24 * 60 * 60 * 1000;
}

/** Converte Timestamps (com toDate) em ISO, recursivamente, para o JSON de backup. */
export function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJsonSafe(v)]));
  return value;
}
