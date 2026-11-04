import { browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, onAuthStateChanged, reload, sendEmailVerification, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile, type User } from 'firebase/auth';
import { auth } from './firebase';
import { createOwnProfile } from './profileRepository';
import type { Result } from '../types';
const asError = (value: unknown): Error => value instanceof Error ? value : new Error('Falha de autenticação');
export const subscribeAuth = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);
export async function signIn(email: string, secret: string, keepSignedIn = true): Promise<Result<void>> {
  try { await setPersistence(auth, keepSignedIn ? browserLocalPersistence : browserSessionPersistence); await signInWithEmailAndPassword(auth, email.trim(), secret); return { ok: true, data: undefined }; }
  catch (cause) { return { ok: false, error: asError(cause) }; }
}
// Cria a conta, o perfil pendente e envia o e-mail de confirmação.
export async function signUp(nome: string, email: string, secret: string): Promise<Result<void>> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), secret);
    await createOwnProfile(cred.user.uid, cred.user.email ?? email.trim(), nome);
    await updateProfile(cred.user, { displayName: nome.trim() });
    await sendEmailVerification(cred.user);
    return { ok: true, data: undefined };
  } catch (cause) { return { ok: false, error: asError(cause) }; }
}
export async function resendVerification(user: User): Promise<void> { await sendEmailVerification(user); }
// Recarrega o usuário e força novo token, para que email_verified chegue às regras.
export async function refreshVerification(user: User): Promise<void> { await reload(user); await user.getIdToken(true); }
export async function signOut(): Promise<void> { await firebaseSignOut(auth); }
export async function resetPassword(email: string): Promise<Result<void>> {
  try { await sendPasswordResetEmail(auth, email.trim()); return { ok: true, data: undefined }; }
  catch (cause) { return { ok: false, error: asError(cause) }; }
}
