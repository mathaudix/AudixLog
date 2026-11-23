// Códigos de erro do Firebase Auth mapeados para chaves de tradução (pt-BR/en).
const entries: [string, string][] = [
  ['auth/email-already-in-use', 'access.errEmailInUse'],
  ['auth/weak-password', 'access.errWeakPassword'],
  ['auth/invalid-email', 'access.errInvalidEmail'],
  ['auth/too-many-requests', 'access.errTooMany'],
  ['auth/invalid-credential', 'access.errInvalidCredential'],
  ['auth/user-not-found', 'access.errInvalidCredential'],
  ['auth/network-request-failed', 'access.errNetwork'],
  ['auth/user-disabled', 'access.disabledTitle'],
];
const messages = new Map(entries);

export function authErrorKey(code: string | undefined): string {
  return messages.get(code ?? '') ?? 'access.errGeneric';
}
