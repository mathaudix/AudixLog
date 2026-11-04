export interface BranchSeries { name: string; color: string }

/* Paleta de series: 12 tons, um indice fixo por filial (L1 -> 0, L2 -> 1, ...).
   Modo claro: contraste >= 3:1 contra #FFFFFF. Modo escuro: >= 3:1 contra #09283C (medido). */
export const SERIES_COUNT = 12;

const naturalCollator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

export function sortBranchesNaturally(branches: string[]): string[] {
  return [...new Set(branches.map(branch => branch.trim().toUpperCase()).filter(Boolean))].sort(naturalCollator.compare);
}

/* Indice estavel: L<n> -> (n-1) % 12. Outros nomes usam um hash simples. Mesma filial, mesma cor no sistema. */
export function branchIndex(name: string): number {
  const match = /^L(\d+)$/.exec(name);
  if (match) return (Number(match[1]) - 1) % SERIES_COUNT;
  let seed = 7;
  for (const char of name) seed = (seed * 31 + char.codePointAt(0)!) >>> 0;
  return seed % SERIES_COUNT;
}

/* Cor da serie via variavel CSS (--series-0..11), que troca com o tema. */
export function stableBranchColor(name: string): string {
  return `var(--series-${branchIndex(name)})`;
}

export function buildBranchSeries(branches: string[]): BranchSeries[] {
  return sortBranchesNaturally(branches).map(name => ({ name, color: stableBranchColor(name) }));
}
