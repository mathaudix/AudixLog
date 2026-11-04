// Stubs do Firebase usados só pelo harness do editor (fora do build de produção).
export const auth = { currentUser: { uid: 'harness-user' } } as const;
export const db = {} as const;
export const appId = 'harness';

const saved: unknown[] = [];

export async function saveLabel(name: string, labelData: unknown) {
  console.log('SAVE', JSON.stringify({ name, labelData }));
  return { ok: true as const, data: 'local-harness-1' };
}
export async function updateLabelTemplate(id: string, name: string, labelData: unknown) {
  console.log('SAVE', JSON.stringify({ id, name, labelData }));
  return { ok: true as const, data: id };
}
export async function renameLabel() { return { ok: true as const, data: undefined }; }
export async function duplicateLabelTemplate() { return { ok: true as const, data: 'local-copy' }; }
export async function removeLabel() { return { ok: true as const, data: undefined }; }
export function subscribeLabels(callback: (labels: unknown[]) => void) {
  callback(saved);
  return () => undefined;
}
