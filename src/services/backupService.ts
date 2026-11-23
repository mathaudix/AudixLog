import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from './firebase';
import { toJsonSafe, formatBackupDate } from '../utils/nfWindow';

export const BACKUP_VERSION = 1;
export const LAST_BACKUP_KEY = 'audixlog:lastBackupAt';

const dataCollection = (name: string) => collection(db, 'artifacts', appId, 'public', 'data', name);

export interface BackupResult { filename: string; counts: Record<string, number>; total: number }

/** Lê todas as coleções de dados (sem usuários/allowed_users) e monta o JSON de backup. */
export async function buildFullBackup(onProgress: (done: number, total: number) => void = () => undefined, now = new Date()): Promise<{ json: string; result: BackupResult }> {
  const sources: Array<[string, string]> = [['nfs', 'notas'], ['history_nfs', 'notas_arquivadas'], ['savedLabelsAdvanced', 'modelos_avancados'], ['saved_labels', 'modelos_etiqueta'], ['settings', 'configuracoes']];
  const data: Record<string, unknown[]> = {}; const counts: Record<string, number> = {};
  let done = 0;
  for (const [name, key] of sources) {
    const snap = await getDocs(dataCollection(name));
    data[key] = snap.docs.map(item => toJsonSafe({ id: item.id, ...item.data() }));
    counts[key] = snap.size; done += 1; onProgress(done, sources.length);
  }
  const payload = { versao: BACKUP_VERSION, geradoEm: now.toISOString(), contagens: counts, ...data };
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const filename = `audixlog_backup_${formatBackupDate(now)}.json`;
  return { json: JSON.stringify(payload, null, 2), result: { filename, counts, total } };
}

export function downloadText(filename: string, content: string, mime = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readLastBackup(): string | null {
  try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
}

export function writeLastBackup(iso: string): void {
  try { localStorage.setItem(LAST_BACKUP_KEY, iso); } catch { /* armazenamento indisponível */ }
}
