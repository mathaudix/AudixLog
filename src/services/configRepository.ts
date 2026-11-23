import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, appId, auth } from './firebase';
import { DEFAULT_CONFIG } from '../constants';
import type { AppConfig, Result } from '../types';
import { DEFAULT_WINDOW_DAYS, WINDOW_OPTIONS } from '../utils/nfWindow';
const configRef = () => doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
const toError = (cause: unknown) => cause instanceof Error ? cause : new Error('Falha ao salvar configurações');
export function subscribeConfig(next: (config: AppConfig) => void, fail: (error: Error) => void): () => void {
  try { return onSnapshot(configRef(), snap => {
    const data = snap.data();
    next(data ? { teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers.filter((x): x is string => typeof x === 'string') : DEFAULT_CONFIG.teamMembers,
      branchMap: data.branchMap && typeof data.branchMap === 'object' ? data.branchMap as Record<string, string> : DEFAULT_CONFIG.branchMap,
      staleHours: typeof data.staleHours === 'number' && data.staleHours >= 0 ? data.staleHours : DEFAULT_CONFIG.staleHours,
      weightTolerancePct: typeof data.weightTolerancePct === 'number' && data.weightTolerancePct >= 0 ? data.weightTolerancePct : DEFAULT_CONFIG.weightTolerancePct,
      volumeTolerance: typeof data.volumeTolerance === 'number' && data.volumeTolerance >= 0 ? data.volumeTolerance : DEFAULT_CONFIG.volumeTolerance,
      windowDays: (WINDOW_OPTIONS as readonly number[]).includes(data.windowDays) ? data.windowDays : DEFAULT_WINDOW_DAYS } : DEFAULT_CONFIG);
    if (!snap.exists() && auth.currentUser) void saveConfig(DEFAULT_CONFIG);
  }, fail); } catch (cause) { fail(toError(cause)); return () => undefined; }
}
export async function saveConfig(config: Partial<AppConfig>): Promise<Result<void>> {
  try { await setDoc(configRef(), config, { merge: true }); return { ok: true, data: undefined }; }
  catch (cause) { return { ok: false, error: toError(cause) }; }
}
