import type { GrupoRateio } from './rateio';
import { pesoEfetivo } from './rateio';

const dec = (v: number) => v.toFixed(2).replace('.', ',');

/** CSV: separador ';', BOM UTF-8, vírgula decimal. */
export function buildCsv(grupos: GrupoRateio[]): string {
  const head = ['Fornecedor', 'CNPJ/CPF', 'IE', 'Destino', 'Qtd Notas', 'Chaves', 'Valor Mercadoria', 'Peso Bruto (KG)', '% do Frete', 'Valor do Conhecimento'];
  const rows = grupos.map(g => [
    g.fornecedor, g.documento, g.ie, g.destino, String(g.notas.length),
    g.notas.map(n => n.chave).join(' '), dec(g.valor), dec(pesoEfetivo(g)), dec(g.percentual), String(g.frete),
  ]);
  const esc = (c: string) => (/[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);
  return '\uFEFF' + [head, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
}

export function downloadCsv(grupos: GrupoRateio[], now = new Date()): void {
  const ts = now.toISOString().replace(/[:.]/g, '-');
  const blob = new Blob([buildCsv(grupos)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rateio_frete_transportadora_${ts}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
