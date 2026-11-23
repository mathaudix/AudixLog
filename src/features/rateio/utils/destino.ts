export const DESTINOS = ['Lojas', 'Vó Graça', 'RP Martins', 'Netos', 'Sorriso', 'Filial 5'] as const;
export type Destino = typeof DESTINOS[number];

/** CNPJs (somente dígitos) cadastrados por destino. Manter aqui para facilitar a manutenção. */
export const CNPJ_LOJAS = ['03790896000148', '03790896000490', '03790896001039', '03790896000300', '03790896000571', '03790896001110'];
export const CNPJ_VO_GRACA = ['03790896000652'];
export const CNPJ_RP_MARTINS = ['12454986000159'];
export const CNPJ_NETOS = ['13338773000205', '13338773000396', '13338773000477', '13338773000124'];

/** Identifica o destino: primeiro pelo CNPJ do destinatário, depois por texto (xNome + xFant + xMun), fallback Lojas. */
export function identificarDestino(cnpjDest: string, textoDest: string): Destino {
  const cnpj = (cnpjDest || '').replace(/\D/g, '');
  if (CNPJ_LOJAS.includes(cnpj)) return 'Lojas';
  if (CNPJ_VO_GRACA.includes(cnpj)) return 'Vó Graça';
  if (CNPJ_RP_MARTINS.includes(cnpj)) return 'RP Martins';
  if (CNPJ_NETOS.includes(cnpj)) return 'Netos';
  const t = (textoDest || '').toUpperCase();
  if (t.includes('NETO')) return 'Netos';
  if (t.includes('SORRISO')) return 'Sorriso';
  if (t.includes('FILIAL 5') || t.includes('FILIAL V')) return 'Filial 5';
  if (t.includes('GRAÇA') || t.includes('GRACA')) return 'Vó Graça';
  return 'Lojas';
}
