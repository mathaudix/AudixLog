const digitsOf = (value: string): string => value.replace(/\D/g, '');

/** Filial cadastrada para o CNPJ do destinatário (loja), com ou sem máscara. */
export function branchFromDest(cnpjDest: string | undefined, branchMap: Record<string, string>): string | undefined {
  const target = digitsOf(cnpjDest ?? '');
  if (target.length !== 14) return undefined;
  const entry = Object.entries(branchMap).find(([cnpj]) => digitsOf(cnpj) === target);
  return entry?.[1] || undefined;
}

export function formatCnpj(value: string): string {
  const digits = digitsOf(value);
  return digits.length === 14 ? digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : value;
}
