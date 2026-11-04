// Monta o payload de atualização de uma nota. O Firestore rejeita valores `undefined`,
// então campos vazios viram `null`. Campos de controle (id, histórico, data de criação) não são regravados.
const readOnlyFields = ['id', 'historico', 'createdAt'] as const;

export function toNfUpdatePayload(data: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if ((readOnlyFields as readonly string[]).includes(key)) continue;
    payload[key] = value === undefined ? null : value;
  }
  return payload;
}
