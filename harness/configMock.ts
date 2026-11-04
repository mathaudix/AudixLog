// Stub do configRepository para o harness de Configuracoes (sem Firebase real).
import type { AppConfig } from '../src/types';

export const harnessConfig = {
  teamMembers: ['Matheus', 'Ana'],
  branchMap: { '35261112345678000190550010000012341000012345': 'L1', '12345678000199': 'L2' },
  windowDays: 30,
} as unknown as AppConfig;

export async function saveConfig() { return { ok: true as const, data: undefined }; }
export function subscribeConfig(next: (config: AppConfig) => void) { next(harnessConfig); return () => undefined; }
