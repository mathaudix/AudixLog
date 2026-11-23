import type { LabelFormat } from '../features/labels/types';
import logoMarkBlackSvg from '../assets/logo/logo-mark-black.svg?raw';

export const LABEL_MM: Record<LabelFormat, { width: number; height: number }> = {
  '100x150': { width: 100, height: 150 },
  '150x100': { width: 150, height: 100 },
  '100x50': { width: 100, height: 50 },
  '100x30 (2Col)': { width: 100, height: 30 },
};

export function abreviarFornecedor(value: string): string {
  const original = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!original) return original;

  // Prefixos comuns em razões sociais brasileiras (removidos do início)
  const prefixos = [
    'COMERCIO\\s+DE',
    'COMERCIAL\\s+DE\\s+HORTIFRUTIGRANJEIROS',
    'COMERCIAL',
    'INDUSTRIA\\s+E\\s+COMERCIO',
    'INDUSTRIA',
    'INDUSTRIAL',
    'TRANSPORTADORA',
    'DISTRIBUIDORA',
    'EMPREENDIMENTOS',
    'PARTICIPACOES',
    'PARTICIPAÇÕES',
    'HOLDING',
    'SERVICOS',
    'SERVIÇOS',
    'CONSTRUTORA',
    'INCORPORADORA',
    'AGROPECUARIA',
    'AGROPECUÁRIA',
    'AGROINDUSTRIAL',
    'AGRO\\s+INDUSTRIAL',
    'PRODUTOS',
    'COMERCIO',
    'ALIMENTOS',
    'NEGOCIOS',
    'NEGÓCIOS',
  ];

  let result = original.replace(new RegExp(`^(?:${prefixos.join('|')})\\s+`, 'i'), '').trim();

  // Sufixos jurídicos e societários (removidos do final, repetidamente)
  const sufixos = [
    '&\\s*CIA',
    'CIA',
    'EIRELI(?:-ME)?',
    'EIRELLI',
    'LTDA(?:\\s*[- ]?\\s*(?:ME|EPP))?',
    'LIMITADA',
    'ME',
    'EPP',
    'S\\s*\\/\\s*A',
    'S\\.?\\s*A\\.?',
    'SA',
    'SS',
    'COOPERATIVA',
    'COOP',
    'ASSOCIACAO',
    'ASSOCIAÇÃO',
    'FUNDACAO',
    'FUNDAÇÃO',
  ];

  const suffix = new RegExp(`(?:\\s|,)*(?:${sufixos.join('|')})$`, 'i');
  let previous = '';
  while (result && result !== previous) {
    previous = result;
    result = result.replace(suffix, '').replace(/[\s,.-]+$/, '').trim();
  }
  return result || original;
}

export function escapePrintText(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}

export const STANDARD_LABEL_CSS = `
.label{position:relative;box-sizing:border-box;width:var(--w);height:var(--h);padding:var(--pad);overflow:hidden;background:#fff;color:#000;display:grid;grid-template-rows:var(--grid-rows);font-family:Arial,Helvetica,sans-serif;break-after:page}
.label:last-child{break-after:auto}
.label .top{grid-row:1;position:relative;min-width:0;min-height:0;display:flex;align-items:center;justify-content:flex-end;overflow:hidden}
.label .brand{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;pointer-events:none}
.label .brand-logo{display:block;width:var(--logo);height:var(--logo)}
.label .volume{box-sizing:border-box;margin-left:auto;padding:.6mm 2mm;border-radius:999px;background:#000;color:#fff;display:flex;align-items:center;gap:1.2mm;white-space:nowrap;line-height:1;font-weight:900}
.label .volume small{font-weight:700;line-height:1}
.label .volume strong{font-weight:900;line-height:1}
.label .supplier{grid-row:2;min-width:0;min-height:0;display:flex;align-items:center;overflow:hidden}
.label .supplier strong{display:block;min-width:0;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:var(--supplier-size);line-height:1;font-weight:900;text-transform:uppercase}
.label .rule{grid-row:3;min-height:0;background:#000}
.label .branch{grid-row:4;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.label .branch-code{font-weight:900;line-height:1;white-space:nowrap;color:#000}
.label .invoice{grid-row:5;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.label .invoice strong{font-weight:900;line-height:1;white-space:nowrap;color:#000}
`;

export interface StandardLabelFields {
  format: LabelFormat;
  supplier: string;
  branch: string;
  nfNumber: string;
  volume: number;
  total: number;
  header: string;
  fontAdjust?: number;
  zoom?: number;
  barcodeMarkup?: string;
}

export function standardLabelMarkup(fields: StandardLabelFields): string {
  const dual = fields.format === '100x30 (2Col)';
  const dimensions = LABEL_MM[fields.format];
  const width = dual ? 48 : dimensions.width;
  const height = dimensions.height;
  const pad = 1.5;
  const innerHeight = height - (2 * pad);
  // Linhas: [topo (VOL + logo), fornecedor, regua, filial (codigo), NF].
  // Sem codigo de barras no layout padrao de NF.
  const rows = dual
    ? [8, 5, 0.6, 8.4, 5]
    : fields.format === '100x150'
      ? [26, 12, 0.8, 60, 48.2]
      : fields.format === '150x100'
        ? [18, 9, 0.8, 40, 29.2]
        : [9.5, 5.5, 0.8, 19, 12.2];
  const rowSum = rows.reduce((sum, value) => sum + value, 0);
  if (Math.abs(rowSum - innerHeight) > 0.001) {
    throw new Error(`Alturas da etiqueta ${fields.format} não somam a área útil.`);
  }
  const topH = rows[0] ?? 0;
  const branchH = rows[3] ?? 0;
  const nfH = rows[4] ?? 0;
  const contentWidth = width - (2 * pad);
  const scale = innerHeight / 47;
  const fitWidth = (text: string, em: number): number => contentWidth / (Math.max(1, [...text].length) * em);

  const supplier = escapePrintText(abreviarFornecedor(fields.supplier));
  // Filial: somente o código (ex.: "03"), sem o nome.
  const branchText = (String(fields.branch ?? 'S/D').split(' - ')[0] ?? '').trim() || 'S/D';
  const branch = escapePrintText(branchText);
  const nfText = String(fields.nfNumber ?? '');
  const nf = escapePrintText(nfText);
  const hasVolume = Number.isFinite(fields.total) && fields.total > 0 && Number.isFinite(fields.volume) && fields.volume > 0;
  const volumeText = `${fields.volume}/${fields.total}`;
  const volume = escapePrintText(volumeText);

  // Filial é o maior destaque. NF e volume têm o mesmo tamanho (médio).
  const branchFont = Math.max(0.8, Math.min(branchH * 0.92, fitWidth(branchText, 0.68)));
  const rawAdjust = Number(fields.fontAdjust ?? 0);
  const nfAdjustMm = Number.isFinite(rawAdjust) ? rawAdjust * (25.4 / 96) : 0;
  const logoMm = dual ? 4 : fields.format === '100x50' ? 6 : 10;
  // Pilula do volume fica a direita do logo centralizado: largura disponivel = metade da etiqueta menos o logo.
  const pillAvail = contentWidth / 2 - logoMm / 2 - 0.5 - 4;
  const pillFit = hasVolume ? (pillAvail - 1.2) / (1.005 + 0.62 * [...volumeText].length) : Infinity;
  const nfFont = Math.max(0.1, Math.min(8.5 * scale, topH * 0.9, nfH * 0.9, fitWidth(nfText, 0.62), pillFit) + nfAdjustMm);
  const volFont = nfFont;
  const volLabelFont = Math.max(1.6, volFont * 0.5);

  const supplierFont = dual ? 2.2 : fields.format === '100x50' ? 2.5 : 3;
  const logo = logoMm;
  const labelClass = dual ? 'label dual' : 'label page';
  const rowCss = rows.map(value => `${value}mm`).join(' ');
  const volumeBlock = hasVolume
    ? `<div class="volume"><small style="font-size:${volLabelFont}mm">VOL</small><strong style="font-size:${volFont}mm">${volume}</strong></div>`
    : '';
  return `<section class="${labelClass}" data-grid-rows="${rows.join(',')}" data-inner-height="${innerHeight}" data-branch-font-size="${branchFont}" data-nf-font-size="${nfFont}" data-vol-font-size="${hasVolume ? volFont : 0}" style="--w:${width}mm;--h:${height}mm;--pad:${pad}mm;--grid-rows:${rowCss};--logo:${logo}mm;--supplier-size:${supplierFont}mm"><header class="top">${volumeBlock}<div class="brand">${LOGO_SVG_STRING(32)}</div></header><div class="supplier"><strong>${supplier}</strong></div><div class="rule"></div><div class="branch"><div class="branch-code" style="font-size:${branchFont}mm">${branch}</div></div><div class="invoice"><strong style="font-size:${nfFont}mm">${nf}</strong></div></section>`;
}

export const LOGO_SVG_STRING = (size: number, _color = '#000000'): string => logoMarkBlackSvg.replace('<svg ', `<svg class="brand-logo" width="${size}" height="${size}" `);
