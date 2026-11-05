import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch, type DocumentData, type UpdateData } from 'firebase/firestore';
import { DEFAULT_WINDOW_DAYS, isInWindow, mergeNfsById, windowCutoff } from '../utils/nfWindow';
import { auth } from './firebase';
import { db, appId } from './firebase';
import { toNfUpdatePayload } from './nfPayload';
import { isValidAccessKey } from '../utils/accessKey';
import type { HistoryAction, HistoryChange, HistoryEntry, NotaFiscal, Result, StatusConferencia } from '../types';

type NfPayload = Omit<NotaFiscal, 'id'>;
type Actor = { uid: string; email: string };
const nfsCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'nfs');
const nfDocument = (id: string) => doc(db, 'artifacts', appId, 'public', 'data', 'nfs', id);
const asError = (cause: unknown): Error => cause instanceof Error ? cause : new Error('Operação Firestore não concluída');
function currentActor(): Actor {
  const user = auth.currentUser;
  return { uid: user?.uid ?? 'desconhecido', email: user?.email ?? 'usuário desconhecido' };
}
function entry(action: HistoryAction, changes?: HistoryChange[], actor = currentActor()): HistoryEntry {
  return { at: Timestamp.now(), uid: actor.uid, email: actor.email, action, ...(changes?.length ? { changes } : {}) };
}
function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return value.toLocaleString('pt-BR');
  if (typeof value === 'object') return '[dados]';
  return String(value);
}
const trackedFields = ['numero', 'fornecedor', 'data', 'volumes', 'peso', 'valor', 'produtos', 'obs', 'chaveAcesso', 'filial', 'responsavel', 'statusConferencia', 'status', 'dataExpedicao', 'foto', 'pesoConferido', 'volumesConferidos'] as const;
type TrackedField = typeof trackedFields[number];
function diff(before: Record<string, unknown>, after: Record<string, unknown>): HistoryChange[] {
  return trackedFields.flatMap((field: TrackedField) => {
    const from = before[field]; const to = after[field];
    if (from === to) return [];
    if (field === 'foto') return [{ field: 'foto', from: from ? 'anexada' : '—', to: to ? 'foto alterada' : 'removida' }];
    return [{ field, from: display(from), to: display(to) }];
  });
}
function actionForChanges(changes: HistoryChange[]): HistoryAction {
  if (changes.some(change => change.field === 'status' && change.to === 'expedido')) return 'expedida';
  if (changes.some(change => change.field === 'status' && change.from === 'expedido' && change.to === 'recebido')) return 'estorno_expedicao';
  if (changes.some(change => change.field === 'statusConferencia')) return 'status';
  if (changes.some(change => change.field === 'responsavel')) return 'responsavel';
  return 'editada';
}
function mapNf(id: string, data: DocumentData): NotaFiscal {
  return {
    id, numero: String(data.numero ?? ''), fornecedor: String(data.fornecedor ?? ''), data: String(data.data ?? ''),
    volumes: Number(data.volumes ?? 0), peso: Number(data.peso ?? 0), valor: Number(data.valor ?? 0),
    pesoConferido: typeof data.pesoConferido === 'number' ? data.pesoConferido : undefined,
    volumesConferidos: typeof data.volumesConferidos === 'number' ? data.volumesConferidos : undefined,
    produtos: typeof data.produtos === 'string' ? data.produtos : '', obs: typeof data.obs === 'string' ? data.obs : '',
    chaveAcesso: typeof data.chaveAcesso === 'string' ? data.chaveAcesso : '', serie: typeof data.serie === 'string' ? data.serie : '', cnpjEmitente: typeof data.cnpjEmitente === 'string' ? data.cnpjEmitente : '', filial: typeof data.filial === 'string' ? data.filial : '',
    responsavel: typeof data.responsavel === 'string' ? data.responsavel : '',
    statusConferencia: data.statusConferencia === 'conferida' || data.statusConferencia === 'divergente' ? data.statusConferencia : 'pendente',
    status: data.status === 'expedido' ? 'expedido' : 'recebido', foto: typeof data.foto === 'string' ? data.foto : null,
    createdAt: data.createdAt ?? null, dataExpedicao: data.dataExpedicao ?? null,
    historico: Array.isArray(data.historico) ? data.historico as HistoryEntry[] : [],
  };
}
/** Listener A: notas ainda não expedidas (sempre carregadas). Listener B: notas criadas desde o corte. */
export function subscribeNfs(next: (nfs: NotaFiscal[]) => void, fail: (error: Error) => void, windowDays = DEFAULT_WINDOW_DAYS): () => void {
  let openNfs: NotaFiscal[] = []; let recentNfs: NotaFiscal[] = [];
  const emit = () => next(mergeNfsById(openNfs, recentNfs));
  const cutoff = windowCutoff(windowDays);
  const failOnce = (error: Error) => fail(error);
  try {
    const unsubA = onSnapshot(query(nfsCollection(), where('status', '==', 'recebido')), snap => { openNfs = snap.docs.map(item => mapNf(item.id, item.data())); emit(); }, failOnce);
    const unsubB = onSnapshot(query(nfsCollection(), where('createdAt', '>=', Timestamp.fromDate(cutoff))), snap => { recentNfs = snap.docs.map(item => mapNf(item.id, item.data())).filter(nf => isInWindow(nf, cutoff)); emit(); }, failOnce);
    return () => { unsubA(); unsubB(); };
  }
  catch (cause) { fail(asError(cause)); return () => undefined; }
}
/** Consulta pontual de duplicidade por chave de acesso (independe da janela carregada). */
export async function findNfByChave(chave: string): Promise<NotaFiscal | null> {
  if (!isValidAccessKey(chave)) return null;
  const snap = await getDocs(query(nfsCollection(), where('chaveAcesso', '==', chave), limit(1)));
  return snap.docs[0] ? mapNf(snap.docs[0].id, snap.docs[0].data()) : null;
}

/** Busca em notas antigas (fora da janela): consulta pontual por número exato, limit 50. */
export async function findOldNfsByNumero(numero: string): Promise<NotaFiscal[]> {
  const clean = numero.trim();
  if (!clean) return [];
  const snap = await getDocs(query(nfsCollection(), where('numero', '==', clean), limit(50)));
  return snap.docs.map(item => mapNf(item.id, item.data()));
}

export type OldNfSource = 'antiga' | 'arquivada';
export interface OldNfMatch { nf: NotaFiscal; source: OldNfSource }

/** Busca pontual em notas antigas e arquivadas (history_nfs), por chave (44 dígitos) ou número exato. Texto livre não é suportado. */
export async function findOldNfsByTerm(term: string): Promise<OldNfMatch[]> {
  const clean = term.replace(/\s/g, '');
  const isKey = /^\d{44}$/.test(clean);
  const isNumber = /^\d+$/.test(clean);
  if (!isKey && !isNumber) return [];
  const archiveRef = collection(db, 'artifacts', appId, 'public', 'data', 'history_nfs');
  const fetch = async (ref: ReturnType<typeof collection>, source: OldNfSource): Promise<OldNfMatch[]> => {
    const constraint = isKey ? where('chaveAcesso', '==', clean) : where('numero', '==', clean.replace(/^0+(?=\d)/, ''));
    const snap = await getDocs(query(ref, constraint, limit(isKey ? 1 : 50)));
    return snap.docs.map(item => ({ nf: mapNf(item.id, item.data()), source }));
  };
  const [old, archived] = await Promise.all([fetch(nfsCollection(), 'antiga'), fetch(archiveRef, 'arquivada')]);
  return [...old, ...archived];
}

/** Campos que o operador pode alterar (espelha firestore.rules). */
export const OPERATOR_NF_FIELDS = ['statusConferencia', 'volumes', 'peso', 'volumesConferidos', 'pesoConferido', 'responsavel', 'status', 'dataExpedicao', 'dataExpedicaoISO'] as const;
function pick(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(source).filter(([key]) => keys.includes(key)));
}
export async function createNf(data: NfPayload, action: 'criada' | 'importada' = 'criada'): Promise<Result<string>> {
  try {
    const audit = entry(action);
    const ref = await addDoc(nfsCollection(), { ...data, historico: [audit], createdAt: serverTimestamp() });
    return { ok: true, data: ref.id };
  } catch (cause) { return { ok: false, error: asError(cause) }; }
}
export async function updateNf(id: string, data: Partial<NotaFiscal>, canEditFiscal = true): Promise<Result<void>> {
  try {
    const snapshot = await getDoc(nfDocument(id));
    if (!snapshot.exists()) throw new Error('A nota não existe mais no Firestore.');
    const current = snapshot.data();
    // Operador só grava campos de conferência/expedição; o restante vem do documento atual e não é regravado.
    const source = canEditFiscal ? data as Record<string, unknown> : pick(data as Record<string, unknown>, OPERATOR_NF_FIELDS);
    const payload = toNfUpdatePayload(source);
    const changes = diff(current, payload);
    if (!changes.length) return { ok: true, data: undefined };
    await updateDoc(nfDocument(id), { ...payload, historico: arrayUnion(entry(actionForChanges(changes), changes)) } as UpdateData<DocumentData>);
    return { ok: true, data: undefined };
  } catch (cause) { return { ok: false, error: asError(cause) }; }
}
export async function removeNf(id: string): Promise<Result<void>> {
  try { await deleteDoc(nfDocument(id)); return { ok: true, data: undefined }; }
  catch (cause) { return { ok: false, error: asError(cause) }; }
}
export async function bulkUpdate(ids: string[], payload: UpdateData<DocumentData>, currentNfs: NotaFiscal[] = [], canEditFiscal = true): Promise<Result<void>> {
  try {
    const scoped = (canEditFiscal ? payload : pick(payload as Record<string, unknown>, OPERATOR_NF_FIELDS)) as UpdateData<DocumentData>;
    const indexed = new Map(currentNfs.map(nf => [nf.id, nf]));
    for (let start = 0; start < ids.length; start += 450) {
      const batch = writeBatch(db);
      ids.slice(start, start + 450).forEach(id => {
        const previous = indexed.get(id) as unknown as Record<string, unknown> | undefined;
        const changes = previous ? diff(previous, scoped as Record<string, unknown>) : Object.entries(scoped).map(([field, value]) => ({ field, from: '—', to: display(value) }));
        batch.update(nfDocument(id), { ...scoped, historico: arrayUnion(entry(actionForChanges(changes), changes)) });
      });
      await batch.commit();
    }
    return { ok: true, data: undefined };
  } catch (cause) { return { ok: false, error: asError(cause) }; }
}
export async function setStatus(id: string, statusConferencia: StatusConferencia): Promise<Result<void>> { return updateNf(id, { statusConferencia }); }
export async function dispatch(id: string): Promise<Result<void>> { return updateNf(id, { status: 'expedido', dataExpedicao: new Date() }); }
export async function undoDispatch(id: string): Promise<Result<void>> { return updateNf(id, { status: 'recebido', dataExpedicao: null }); }
