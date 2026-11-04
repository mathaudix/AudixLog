import type { GrupoRateio } from './rateio';
import { pesoEfetivo, totais } from './rateio';
import { escapeHtml } from '../../../utils/escapeHtml';

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const kg = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Monta o HTML do relatório. `logoSrc` deve ser a URL/data-URL do logo já existente no projeto. */
export function buildReportHtml(grupos: GrupoRateio[], freteTotal: number, logoSrc: string, now = new Date()): string {
  const t = totais(grupos);
  const rows = grupos.map(g => `<tr><td>${escapeHtml(g.fornecedor)}<br/><small>${escapeHtml(g.documento)} · IE ${escapeHtml(g.ie)}</small></td><td>${escapeHtml(g.destino)}</td><td class="r">${g.notas.length}</td><td class="r">${money(g.valor)}</td><td class="r">${kg(pesoEfetivo(g))}</td><td class="r">${g.percentual.toFixed(2)}%</td><td class="r">R$ ${g.frete.toLocaleString('pt-BR')}</td></tr>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><title>Relatório de Rateio</title>
<style>body{font-family:Arial,sans-serif;color:#0f172a;margin:24px}header{display:flex;align-items:center;gap:12px;border-bottom:2px solid #2563eb;padding-bottom:8px}img{height:40px}h1{font-size:20px;margin:0}.cards{display:flex;gap:10px;margin:14px 0}.card{flex:1;border:1px solid #e2e8f0;border-radius:10px;padding:10px}.card b{display:block;font-size:16px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #e2e8f0;padding:6px;text-align:left}th{background:#f1f5f9}.r{text-align:right}tfoot td{font-weight:bold}</style></head>
<body><header><img src="${escapeHtml(logoSrc)}" alt=""/><div><h1>Relatório de Rateio</h1><small>${now.toLocaleString('pt-BR')}</small></div></header>
<div class="cards"><div class="card">Notas<b>${t.notas}</b></div><div class="card">Carga total<b>${money(t.valor)}</b></div><div class="card">CT-es<b>${t.ctes}</b></div><div class="card">Frete total<b>R$ ${freteTotal.toLocaleString('pt-BR')}</b></div><div class="card">Peso bruto<b>${kg(t.peso)} KG</b></div></div>
<table><thead><tr><th>Emitente/Fornecedor</th><th>Destino</th><th class="r">NF-e</th><th class="r">Mercadoria</th><th class="r">Peso (KG)</th><th class="r">% Frete</th><th class="r">Valor CT-e</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td>SOMA TOTAL (${t.ctes} conhecimentos)</td><td></td><td class="r">${t.notas}</td><td class="r">${money(t.valor)}</td><td class="r">${kg(t.peso)}</td><td class="r">100,00%</td><td class="r">R$ ${t.frete.toLocaleString('pt-BR')}</td></tr></tfoot></table>
<p class="total-frete">Frete total informado: R$ ${freteTotal.toLocaleString('pt-BR')}</p></body></html>`;
}

/** Abre a janela de impressão. Retorna false se o navegador bloquear. */
export function printReport(grupos: GrupoRateio[], freteTotal: number, logoSrc: string): boolean {
  if (grupos.length === 0) return false;
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(buildReportHtml(grupos, freteTotal, logoSrc));
  w.document.close();
  w.onload = () => w.print();
  return true;
}
