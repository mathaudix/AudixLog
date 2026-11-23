import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from './firebase';
import type { Result, UserProfile, UserStatus } from '../types';

export type AccessChange = 'approve' | 'reactivate' | 'deactivate' | 'makeAdmin' | 'removeAdmin';

const userCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'allowed_users');
const userDocument = (uid: string) => doc(db, 'artifacts', appId, 'public', 'data', 'allowed_users', uid);

const toStatus = (value: unknown): UserStatus | undefined => value === 'pendente' || value === 'ativo' || value === 'desativado' ? value : undefined;
const toProfile = (uid: string, data: Record<string, unknown>): UserProfile => ({
  uid,
  email: String(data.email ?? ''),
  nome: String(data.nome ?? ''),
  role: data.role === 'admin' ? 'admin' : 'operador',
  ativo: data.ativo === true,
  status: toStatus(data.status),
  criadoEm: (data.criadoEm as { toDate?: () => Date } | undefined)?.toDate?.() ?? null,
});

export function subscribeProfile(uid: string, next: (profile: UserProfile | null) => void, fail: (error: Error) => void): () => void {
  return onSnapshot(userDocument(uid), snap => {
    if (!snap.exists()) { next(null); return; }
    next(toProfile(uid, snap.data()));
  }, fail);
}

export function subscribeUsers(next: (profiles: UserProfile[]) => void, fail: (error: Error) => void): () => void {
  return onSnapshot(userCollection(), snap => next(snap.docs.map(item => toProfile(item.id, item.data()))), fail);
}

export async function updateOwnProfileName(uid: string, nome: string): Promise<void> {
  const clean = nome.trim();
  if (clean.length < 1 || clean.length > 60) throw new Error('O nome deve ter entre 1 e 60 caracteres.');
  const { updateDoc: update, serverTimestamp: stamp } = await import('firebase/firestore');
  await update(userDocument(uid), { nome: clean, atualizadoEm: stamp() });
}

// Autocadastro: o próprio usuário cria o perfil pendente, sem acesso até o admin aprovar.
export async function createOwnProfile(uid: string, email: string, nome: string): Promise<void> {
  await setDoc(userDocument(uid), { email: email.trim(), nome: nome.trim(), role: 'operador', ativo: false, status: 'pendente', criadoEm: serverTimestamp() });
}

export async function saveUser(profile: UserProfile): Promise<Result<void>> {
  try {
    const payload: Record<string, unknown> = { email: profile.email.trim(), nome: profile.nome.trim(), role: profile.role, ativo: profile.ativo };
    if (profile.status) payload.status = profile.status;
    await setDoc(userDocument(profile.uid), payload, { merge: true });
    return { ok: true, data: undefined };
  } catch (cause) { return { ok: false, error: cause instanceof Error ? cause : new Error('Falha ao salvar usuário') }; }
}

// Perfis antigos (sem `status`) mudam só o flag `ativo`, para não exigir verificação de e-mail que eles nunca fizeram.
export async function setUserAccess(profile: UserProfile, change: AccessChange): Promise<Result<void>> {
  const patch: Record<string, unknown> = {};
  const hasStatus = profile.status !== undefined;
  if (change === 'approve' || change === 'reactivate') { patch.ativo = true; if (hasStatus) patch.status = 'ativo'; }
  if (change === 'deactivate') { patch.ativo = false; if (hasStatus) patch.status = 'desativado'; }
  if (change === 'makeAdmin') patch.role = 'admin';
  if (change === 'removeAdmin') patch.role = 'operador';
  try {
    await updateDoc(userDocument(profile.uid), { ...patch, atualizadoEm: serverTimestamp() });
    return { ok: true, data: undefined };
  } catch (cause) { return { ok: false, error: cause instanceof Error ? cause : new Error('Falha ao atualizar usuário') }; }
}
