import { useState } from 'react';
const seed = {
  notas: [
    { chave: '35260911222333000144550010000000011000000011', valor: 5000, peso: 320, fornecedor: 'FORNECEDOR ALFA LTDA', documento: '11222333000144', ie: '123456', destino: 'Lojas' },
    { chave: '35260911222333000144550010000000021000000021', valor: 3000, peso: 180, fornecedor: 'FORNECEDOR BETA SA', documento: '22333444000155', ie: '', destino: 'Netos' },
    { chave: '35260911222333000144550010000000031000000031', valor: 2000, peso: 95.5, fornecedor: 'COMERCIAL GAMA', documento: '33444555000166', ie: '778899', destino: 'Sorriso' },
  ],
  frete: 1000, fretesManuais: {}, pesosManuais: {},
};
export function useRateioDraft() {
  const [draft, setDraft] = useState<typeof seed>(seed);
  return { draft, update: (p: Partial<typeof seed>) => setDraft(c => ({ ...c, ...p })), status: 'saved' as const, loaded: true };
}
