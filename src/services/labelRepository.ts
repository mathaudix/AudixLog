import {
  addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc,
  type DocumentData, type UpdateData,
} from 'firebase/firestore';
import { db, appId, auth } from './firebase';
import type { Result } from '../types';
import type { LabelData, SavedLabel } from '../features/labels/types';
import { sanitizeLabelData, stripUndefined } from '../features/labels/sanitize';

const collectionRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'savedLabelsAdvanced');
const documentRef = (id: string) => doc(db, 'artifacts', appId, 'public', 'data', 'savedLabelsAdvanced', id);
const localKey = 'audix.labelTemplates';
type StoredLabel = SavedLabel & { updatedAt?: unknown; createdBy?: string };
const readLocal = (): StoredLabel[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(localKey) ?? '[]');
    return Array.isArray(parsed) ? parsed as StoredLabel[] : [];
  } catch { return []; }
};
const writeLocal = (items: StoredLabel[]): void => localStorage.setItem(localKey, JSON.stringify(items));
const toError = (cause: unknown, fallback: string): Error => {
  if (cause instanceof Error) {
    const code = 'code' in cause && typeof cause.code === 'string' ? `${cause.code}: ` : '';
    return new Error(`${code}${cause.message}`);
  }
  return new Error(fallback);
};
const sortNewest = (items: StoredLabel[]): StoredLabel[] => [...items].sort(
  (a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base', numeric: true }),
);
const mergeLabels = (remote: StoredLabel[], local: StoredLabel[]): SavedLabel[] => sortNewest([
  ...remote,
  ...local.filter(item => !remote.some(saved => saved.id === item.id)),
]);
const newLocalId = (): string => `local-${globalThis.crypto.randomUUID()}`;
const currentUid = (): string | null => auth.currentUser?.uid ?? null;

export function subscribeLabels(
  next: (labels: SavedLabel[]) => void,
  fail: (error: Error) => void,
): () => void {
  let remote: StoredLabel[] = [];
  let active = true;
  let unsubscribe: (() => void) | undefined;
  const emit = () => { if (active) next(mergeLabels(remote, readLocal())); };
  emit();
  try {
    unsubscribe = onSnapshot(collectionRef(), snapshot => {
      remote = snapshot.docs.map(item => {
        const value = item.data();
        return {
          id: item.id,
          name: String(value.name ?? ''),
          labelData: sanitizeLabelData((value.labelData ?? {}) as LabelData),
          createdAt: value.createdAt,
          updatedAt: value.updatedAt,
          createdBy: typeof value.createdBy === 'string' ? value.createdBy : undefined,
        };
      });
      emit();
    }, cause => {
      fail(toError(cause, 'Falha ao carregar modelos salvos.'));
      emit();
    });
  } catch (cause) {
    fail(toError(cause, 'Falha ao carregar modelos salvos.'));
  }
  return () => { active = false; unsubscribe?.(); };
}

export async function saveLabel(name: string, labelData: LabelData): Promise<Result<string>> {
  const uid = currentUid();
  if (!uid) return { ok: false, error: new Error('Entre no sistema para salvar modelos de etiqueta.') };
  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: new Error('Informe um nome para o modelo.') };
  const safeData = sanitizeLabelData(labelData);
  const now = new Date().toISOString();
  try {
    const payload = stripUndefined({ name: trimmedName, labelData: safeData, createdBy: uid }) as Record<string, unknown>;
    const created = await addDoc(collectionRef(), {
      ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return { ok: true, data: created.id };
  } catch (cause) {
    try {
      const id = newLocalId();
      writeLocal([...readLocal(), { id, name: trimmedName, labelData: safeData, createdBy: uid, createdAt: now, updatedAt: now }]);
      return { ok: true, data: id };
    } catch (localCause) {
      return { ok: false, error: toError(localCause, toError(cause, 'Falha ao salvar modelo.').message) };
    }
  }
}

export async function updateLabelTemplate(
  id: string, name: string, labelData: LabelData,
): Promise<Result<string>> {
  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: new Error('Informe um nome para o modelo.') };
  const safeData = sanitizeLabelData(labelData);
  const now = new Date().toISOString();
  try {
    if (id.startsWith('local-')) {
      writeLocal(readLocal().map(item => item.id === id
        ? { ...item, name: trimmedName, labelData: safeData, updatedAt: now } : item));
      return { ok: true, data: id };
    }
    const fields = stripUndefined({ name: trimmedName, labelData: safeData }) as UpdateData<DocumentData>;
    await updateDoc(documentRef(id), { ...fields, updatedAt: serverTimestamp() });
    return { ok: true, data: id };
  } catch (cause) {
    const uid = currentUid();
    if (!uid) return { ok: false, error: toError(cause, 'Falha ao atualizar modelo.') };
    try {
      const idLocal = newLocalId();
      writeLocal([...readLocal(), {
        id: idLocal, name: trimmedName, labelData: safeData, createdBy: uid,
        createdAt: now, updatedAt: now,
      }]);
      return { ok: true, data: idLocal };
    } catch (localCause) {
      return { ok: false, error: toError(localCause, toError(cause, 'Falha ao atualizar modelo.').message) };
    }
  }
}

export async function renameLabel(id: string, name: string): Promise<Result<void>> {
  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: new Error('Informe um nome para o modelo.') };
  try {
    if (id.startsWith('local-')) {
      writeLocal(readLocal().map(item => item.id === id
        ? { ...item, name: trimmedName, updatedAt: new Date().toISOString() } : item));
    } else {
      await updateDoc(documentRef(id), { name: trimmedName, updatedAt: serverTimestamp() });
    }
    return { ok: true, data: undefined };
  } catch (cause) { return { ok: false, error: toError(cause, 'Falha ao renomear modelo salvo.') }; }
}

export async function duplicateLabelTemplate(label: SavedLabel): Promise<Result<string>> {
  return saveLabel(`${label.name} (cópia)`, label.labelData);
}

export async function removeLabel(id: string): Promise<Result<void>> {
  try {
    if (id.startsWith('local-')) writeLocal(readLocal().filter(item => item.id !== id));
    else await deleteDoc(documentRef(id));
    return { ok: true, data: undefined };
  } catch (cause) { return { ok: false, error: toError(cause, 'Falha ao excluir modelo salvo.') }; }
}
