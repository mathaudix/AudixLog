import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useState } from 'react';
import { loadJsBarcode } from '../../utils/barcodeLoader';
import type { NotaFiscal, Toast } from '../../types';
import { openStandardPrint } from '../../utils/labelPrint';
import { standardLabelMarkup, STANDARD_LABEL_CSS } from '../../utils/labelPrintCore';
import { barcodeSvg } from '../../utils/labelPrint';
import { FORMATS } from './constants';
import type { LabelFormat, LabelNfContext } from './types';
interface Props { open: boolean; onClose: () => void; nfs: NotaFiscal[]; onToast: (toast: Toast) => void; onAdvancedEditor: () => void }
const toContext = (nf: NotaFiscal): LabelNfContext => ({ numero: nf.numero, fornecedor: nf.fornecedor, filial: nf.filial, chaveAcesso: nf.chaveAcesso, volumes: nf.volumes, peso: nf.peso, valor: nf.valor });
export function StandardLabelPrintModal({ open, onClose, nfs, onToast, onAdvancedEditor }: Props) {
 useEffect(() => { if (open) void loadJsBarcode(); }, [open]);
  const { t } = useI18n();
 const [format, setFormat] = useState<LabelFormat>(() => (localStorage.getItem('audixlog:lastLabelFormat') as LabelFormat | null) || (localStorage.getItem('audixlog_nfe_format') as LabelFormat | null) || '100x30 (2Col)');
 const [zoom, setZoom] = useState(100);
 const [fontAdjust, setFontAdjust] = useState(() => Number(localStorage.getItem('audixlog_nfe_font_adjust')) || 0);
 if (!open || !nfs.length) return null;
 const first = nfs[0];
 const previewMarkup = `<style>${STANDARD_LABEL_CSS}</style>${standardLabelMarkup({ format, supplier: first?.fornecedor ?? '', branch: first?.filial || 'S/D', nfNumber: first?.numero ?? '', volume: 1, total: Math.max(1, first?.volumes ?? 1), header: '', fontAdjust, zoom: 100, barcodeMarkup: first?.chaveAcesso ? barcodeSvg(first.chaveAcesso, 70) : '' })}`;
 const print = () => { localStorage.setItem('audixlog:lastLabelFormat', format); localStorage.setItem('audixlog_nfe_format', format); const contexts = nfs.map(toContext);
  const labelCount = contexts.reduce((sum, nf) => sum + Math.max(1, Number(nf.volumes) || 1), 0);
  if (labelCount > 50 && !window.confirm(`Imprimir ${labelCount} etiquetas de ${contexts.length} notas?`)) return;
  try {
    const opened = openStandardPrint(contexts, { format, zoom, fontAdjust }, () => onToast({ type: 'error', text: t('labels.habilite_popups') }));
    if (!opened) return;
  } catch (error) {
    onToast({ type: 'error', text: error instanceof Error ? error.message : String(error) });
  }
};
 return <div className="fixed inset-0 z-[55] grid place-items-center bg-black/60 p-4"><section className="standard-print-dialog w-full max-w-lg rounded-2xl p-5"><header className="mb-4 flex items-center justify-between"><h2 className="font-bold">Imprimir etiquetas ({nfs.length})</h2><button type="button" onClick={onClose} aria-label={t('labels.fechar')}>×</button></header><div className="flex flex-wrap gap-2">{FORMATS.map(item => <button key={item} type="button" onClick={() => { setFormat(item); localStorage.setItem('audixlog:lastLabelFormat', item); localStorage.setItem('audixlog_nfe_format', item); }} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${format === item ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-600 dark:text-white' : 'border-slate-300 bg-white text-muted hover:bg-slate-100 dark:border-zinc-600 dark:bg-raised dark:text-zinc-100 dark:hover:bg-zinc-700'}`}>{item === '100x30 (2Col)' ? '100x30 Dupla' : item}</button>)}</div><div className="my-4 flex flex-wrap gap-3 text-xs text-muted dark:text-zinc-200"><label className="flex items-center gap-2">Zoom <input className="accent-emerald-600" type="range" min="50" max="150" value={zoom} onChange={event => setZoom(Number(event.target.value))}/></label><label className="flex items-center gap-2">{t('labels.ajuste_nf')}<input className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-fg placeholder:text-muted focus:border-emerald-500 focus:outline-none dark:border-zinc-600 dark:bg-raised dark:text-zinc-100 dark:placeholder:text-zinc-500" type="number" value={fontAdjust} onChange={event => { const value = Number(event.target.value); setFontAdjust(value); localStorage.setItem('audixlog_nfe_font_adjust', String(value)); }}/></label></div><div className="label-preview mx-auto my-5 flex max-h-[50vh] max-w-full items-center justify-center overflow-auto border border-dashed bg-zinc-100 p-3"><div className="origin-center" style={{ transform: `scale(${Math.min(1, zoom / 100)})` }} dangerouslySetInnerHTML={{ __html: previewMarkup }} /></div><div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => { onClose(); onAdvancedEditor(); }} className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">Abrir no editor avançado</button><div className="flex justify-end gap-2"><button type="button" onClick={onClose}>Cancelar</button><button type="button" onClick={print} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Imprimir selecionadas</button></div></div></section></div>;
}
