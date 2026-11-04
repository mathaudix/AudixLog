// Stub do profileRepository para o harness (sem Firebase real).
import type { UserProfile } from '../src/types';

export function subscribeProfile(uid: string, next: (profile: UserProfile | null) => void) {
  next({ uid, email: 'harness@local', nome: 'Harness', role: 'admin', ativo: true } as unknown as UserProfile);
  return () => undefined;
}
export function subscribeUsers() { return () => undefined; }
export async function updateOwnProfileName() { return undefined; }
export async function createOwnProfile() { return undefined; }
export async function saveUser() { return { ok: true as const, data: undefined }; }
export async function setUserAccess() { return { ok: true as const, data: undefined }; }
