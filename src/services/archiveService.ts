import { collection, doc, getDocs, runTransaction, Timestamp } from 'firebase/firestore';
import { auth, db, appId } from './firebase';
import type { HistoryEntry, NotaFiscal } from '../types';
const DAYS = 40;
const nfsCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'nfs');
const archiveCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'history_nfs');
export interface ArchiveFailure { id: string; erro: string }
export interface ArchiveResult { ok: number; falhas: ArchiveFailure[] }
function createdDate(data: Record<string, unknown>): Date | null {
  // Sempre usa createdAt como base para arquivamento (40 dias a partir da criação),
  // independente do status da nota (recebido ou expedido).
  const value = data.createdAt;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  const raw = typeof value === 'string' ? value : typeof data.data === 'string' ? data.data : null;
  if (!raw) return null;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00.000Z` : raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
export function isArchiveEligible(nf: NotaFiscal, now = Date.now()): boolean {
  const date = createdDate(nf as unknown as Record<string, unknown>);
  return Boolean(date && date.getTime() <= now - DAYS * 24 * 60 * 60 * 1000);
}
export async function archiveOldNfs(onProgress: (completed: number, total: number) => void = () => undefined): Promise<ArchiveResult> {
  const snapshot = await getDocs(nfsCollection());
  const eligible = snapshot.docs.filter(item => isArchiveEligible({ id: item.id, ...item.data() } as NotaFiscal));
  const actor = auth.currentUser;
  const result: ArchiveResult = { ok: 0, falhas: [] };
  for (const item of eligible) {
    const sourceRef = doc(nfsCollection(), item.id);
    const destinationRef = doc(archiveCollection(), item.id);
    try {
      const moved = await runTransaction(db, async transaction => {
        const [source, destination] = await Promise.all([transaction.get(sourceRef), transaction.get(destinationRef)]);
        if (!source.exists()) return false;
        const data = source.data();
        const date = createdDate(data);
        if (!date || date.getTime() > Date.now() - DAYS * 24 * 60 * 60 * 1000) return false;
        if (!destination.exists()) {
          const audit: HistoryEntry = { at: Timestamp.now(), uid: actor?.uid ?? 'sistema', email: actor?.email ?? 'sistema', action: 'arquivada' };
          const history = Array.isArray(data.historico) ? data.historico : [];
          transaction.set(destinationRef, { ...data, mesAno: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, dataOriginal: data.data ?? null, archivedAt: Timestamp.now(), sourceId: item.id, historico: [...history, audit] });
        }
        transaction.delete(sourceRef);
        return true;
      });
      if (moved) result.ok += 1;
    } catch (cause) { result.falhas.push({ id: item.id, erro: cause instanceof Error ? cause.message : 'Falha ao arquivar a nota.' }); }
    onProgress(result.ok + result.falhas.length, eligible.length);
  }
  return result;
}
