export interface CnpjInfo { nome_fantasia?: string; razao_social?: string }
const cnpjCache = new Map<string, CnpjInfo>();
export async function lookupCnpj(cnpj: string, timeoutMs = 8000): Promise<CnpjInfo> {
  const cached = cnpjCache.get(cnpj); if (cached) return cached;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${encodeURIComponent(cnpj)}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Consulta CNPJ indisponível (${response.status})`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') throw new Error('Resposta CNPJ inválida');
    const record = payload as Record<string, unknown>;
    const info: CnpjInfo = { nome_fantasia: typeof record.nome_fantasia === 'string' ? record.nome_fantasia : undefined,
      razao_social: typeof record.razao_social === 'string' ? record.razao_social : undefined };
    cnpjCache.set(cnpj, info); return info;
  } finally { window.clearTimeout(timeout); }
}
