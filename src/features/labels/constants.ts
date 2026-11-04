import type { CanvasElement, LabelFormat } from './types';
export const FORMATS: LabelFormat[] = ['100x150', '150x100', '100x50', '100x30 (2Col)'];
export const LABEL_DIMENSIONS: Record<LabelFormat, { width: number; height: number }> = { '100x150': { width: 378, height: 567 }, '150x100': { width: 567, height: 378 }, '100x50': { width: 378, height: 189 }, '100x30 (2Col)': { width: 181, height: 113 } };
export const DEFAULT_ELEMENTS: CanvasElement[] = [
 { id: 'text-number', type: 'text', x: 20, y: 20, zIndex: 1, text: 'Nº NF: {NUMERO}', fontSize: 16, fill: '#000000', fontFamily: 'Arial', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', bgColor: 'transparent' },
 { id: 'text-branch', type: 'text', x: 20, y: 50, zIndex: 2, text: 'Filial: {FILIAL}', fontSize: 14, fill: '#000000', fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', bgColor: 'transparent' },
 { id: 'barcode-key', type: 'barcode', x: 12, y: 74, zIndex: 3, value: '{CHAVE}', width: 150, height: 34 }
];
export const VARIABLES = ['{NUMERO}', '{FILIAL}', '{FORNECEDOR}', '{REMETENTE}', '{CHAVE}', '{VOL}', '{TOTAL_VOL}', '{VOLUMES}', '{PESO}', '{VALOR}'] as const;

