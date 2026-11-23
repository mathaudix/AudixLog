import type { Destino } from './destino';

export interface NotaRateio {
  chave: string;
  valor: number;
  peso: number;
  fornecedor: string;
  documento: string;
  ie: string;
  destino: Destino;
}

export interface NotaComFrete extends NotaRateio { frete: number }

export interface GrupoRateio {
  key: string;
  fornecedor: string;
  documento: string;
  ie: string;
  destino: Destino;
  valor: number;
  peso: number;
  notas: NotaComFrete[];
  frete: number;
  percentual: number;
  fixoFrete?: number;
  fixoPeso?: number;
}

/** Arredonda frete para reais inteiros (Math.round). */
export const roundFrete = (v: number): number => Math.round(v);

/** Distribui `total` (inteiro) em partes proporcionais a `pesos`, com sobra na parte de maior peso. */
export function ratearInteiro(total: number, pesos: number[]): number[] {
  const soma = pesos.reduce((a, b) => a + b, 0);
  if (!(total > 0) || pesos.length === 0) return pesos.map(() => 0);
  if (!(soma > 0)) return pesos.map((_, i) => (i === 0 ? total : 0));
  const partes = pesos.map(p => roundFrete((p / soma) * total));
  const diff = total - partes.reduce((a, b) => a + b, 0);
  if (diff !== 0) {
    let maior = 0;
    pesos.forEach((p, i) => { if (p > (pesos[maior] ?? 0)) maior = i; });
    partes[maior] = (partes[maior] ?? 0) + diff;
  }
  return partes;
}

/** Chave do grupo: documento (ou nome) | IE (ou SEM_IE) | destino. */
export function chaveGrupo(nota: Pick<NotaRateio, 'fornecedor' | 'documento' | 'ie' | 'destino'>): string {
  return `${nota.documento || nota.fornecedor}|${nota.ie || 'SEM_IE'}|${nota.destino}`;
}

/** Agrupa notas em CT-es, ordenados por valor de mercadoria (maior → menor). */
export function agruparNotas(notas: NotaRateio[]): GrupoRateio[] {
  const map = new Map<string, GrupoRateio>();
  for (const n of notas) {
    const key = chaveGrupo(n);
    let g = map.get(key);
    if (!g) {
      g = { key, fornecedor: n.fornecedor, documento: n.documento, ie: n.ie, destino: n.destino, valor: 0, peso: 0, notas: [], frete: 0, percentual: 0 };
      map.set(key, g);
    }
    g.valor += n.valor;
    g.peso += n.peso;
    g.notas.push({ ...n, frete: 0 });
  }
  return [...map.values()].sort((a, b) => b.valor - a.valor);
}

/**
 * Aplica o rateio: grupos com frete fixo ficam fora; o frete livre (max(0, total - fixos))
 * é dividido proporcional ao valor da mercadoria. Depois, cada grupo rateia o frete entre as notas.
 * Percentual = frete / total com 2 casas, sobra para o grupo de maior valor.
 */
export function ratearFrete(grupos: GrupoRateio[], freteTotal: number, fretesFixos: Record<string, number> = {}, pesosFixos: Record<string, number> = {}): GrupoRateio[] {
  const total = roundFrete(freteTotal > 0 ? freteTotal : 0);
  const comFixo = grupos.map(g => ({ ...g, fixoFrete: fretesFixos[g.key] !== undefined ? roundFrete(fretesFixos[g.key] ?? 0) : undefined, fixoPeso: pesosFixos[g.key] }));
  const fixosSoma = comFixo.reduce((s, g) => s + (g.fixoFrete ?? 0), 0);
  const livre = Math.max(0, total - fixosSoma);
  const livres = comFixo.filter(g => g.fixoFrete === undefined);
  const partesLivres = ratearInteiro(livre, livres.map(g => g.valor));
  let i = 0;
  const out = comFixo.map(g => {
    const frete = g.fixoFrete !== undefined ? g.fixoFrete : (partesLivres[i++] ?? 0);
    return { ...g, frete, notas: ratearNotas(g.notas, frete) };
  });
  const pct = out.map(g => (total > 0 ? Math.round((g.frete / total) * 10000) / 100 : 0));
  if (total > 0 && out.length) {
    const diffPct = Math.round((100 - pct.reduce((a, b) => a + b, 0)) * 100) / 100;
    if (diffPct !== 0) {
      let maior = 0;
      out.forEach((g, idx) => { if (g.valor > (out[maior]?.valor ?? 0)) maior = idx; });
      pct[maior] = Math.round(((pct[maior] ?? 0) + diffPct) * 100) / 100;
    }
  }
  return out.map((g, idx) => ({ ...g, percentual: pct[idx] ?? 0 }));
}

/** Rateia o frete de um grupo entre as notas, proporcional ao valor; sobra na nota de maior valor. */
export function ratearNotas(notas: NotaRateio[], frete: number): NotaComFrete[] {
  const partes = ratearInteiro(frete, notas.map(n => n.valor));
  return notas.map((n, i) => ({ ...n, frete: partes[i] ?? 0 }));
}

/** Peso efetivo do grupo: manual substitui a soma dos XMLs. */
export function pesoEfetivo(g: Pick<GrupoRateio, 'peso' | 'fixoPeso'>): number {
  return g.fixoPeso !== undefined ? g.fixoPeso : g.peso;
}

export function totais(grupos: GrupoRateio[]) {
  return {
    notas: grupos.reduce((s, g) => s + g.notas.length, 0),
    valor: grupos.reduce((s, g) => s + g.valor, 0),
    peso: grupos.reduce((s, g) => s + pesoEfetivo(g), 0),
    frete: grupos.reduce((s, g) => s + g.frete, 0),
    ctes: grupos.length,
  };
}
