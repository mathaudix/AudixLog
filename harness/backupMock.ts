// Mock do harness para backup/arquivamento (so desenvolvimento). Nao toca o Firestore.
export const BACKUP_VERSION = 1;
export const LAST_BACKUP_KEY = 'audixlog:lastBackupAt';
export function downloadText(): void { /* no-op no harness */ }
export function readLastBackup(): string | null { return null; }
export function writeLastBackup(): void { /* no-op */ }
export async function buildFullBackup(onProgress: (done: number, total: number) => void = () => undefined) {
  onProgress(1, 1);
  return { filename: 'harness.json', counts: {}, total: 0 };
}
export function isArchiveEligible(): boolean { return false; }
export async function archiveOldNfs(onProgress: (completed: number, total: number) => void = () => undefined) {
  onProgress(0, 0);
  return { ok: 0, falhas: [] };
}
