import { useI18n } from '../../i18n/I18nProvider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../../hooks/useCurrentUserProfile';
import { auth } from '../../services/firebase';
import { createPortal } from 'react-dom';
import { fitZoom } from './fitZoom';
import { ChevronDown, Printer, Redo2, Save, Undo2, X, ZoomIn, ZoomOut, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Logo } from '../../components/ui/Logo';
import { LABEL_DIMENSIONS } from './constants';
import { elementBounds, logoHeaderHeight } from './geometry';
import { useLabelEditor } from './useLabelEditor';
import { LabelCanvas } from './LabelCanvas';
import { ContextToolbar } from '../../components/labelEditor/ContextToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { MultiSelectionPanel } from './MultiSelectionPanel';
import { LayersPanel } from './LayersPanel';
import { EditorDock, type DockSection } from '../../components/labelEditor/EditorDock';
import { ElementPalette } from './ElementPalette';
import { duplicateLabelTemplate, removeLabel, renameLabel, saveLabel, subscribeLabels, updateLabelTemplate } from '../../services/labelRepository';
import { openAdvancedPrint } from '../../utils/labelPrint';
import { loadJsBarcode } from '../../utils/barcodeLoader';
import type { CanvasElement, IconType, LabelFormat, LabelNfContext, SavedLabel } from './types';
import type { NotaFiscal, Toast } from '../../types';


interface Props { open: boolean; onClose: () => void; nfs?: NotaFiscal[]; onToast: (toast: Toast) => void }
const context = (nf: NotaFiscal): LabelNfContext => ({ numero: nf.numero, fornecedor: nf.fornecedor, filial: nf.filial, chaveAcesso: nf.chaveAcesso, volumes: nf.volumes, peso: nf.peso, valor: nf.valor });

export default function LabelEditorModal({ open, onClose, nfs = [], onToast }: Props) {
 const { t } = useI18n();
 const [format, setFormat] = useState<LabelFormat>('100x30 (2Col)');
 const dim = LABEL_DIMENSIONS[format];
 const editor = useLabelEditor(logoHeaderHeight(dim.height), dim);
 const [qty, setQty] = useState(2);
 const [showSaved, setShowSaved] = useState(false);
 const profile = useProfile();
 const canManageLabel = (label: SavedLabel): boolean => profile.role === 'admin' || label.id.startsWith('local-') || (!!label.createdBy && label.createdBy === auth.currentUser?.uid);
  const [leftCollapsed, setLeftCollapsed] = useState(() => { try { return JSON.parse(localStorage.getItem('audix.editor.panels') ?? '{}').leftCollapsed === true; } catch { return false; } });
 const [rightCollapsed, setRightCollapsed] = useState(() => { try { return JSON.parse(localStorage.getItem('audix.editor.panels') ?? '{}').rightCollapsed === true; } catch { return false; } });
 useEffect(() => { try { localStorage.setItem('audix.editor.panels', JSON.stringify({ leftCollapsed: leftCollapsed, rightCollapsed: rightCollapsed })); } catch { /* Storage may be unavailable. */ } }, [leftCollapsed, rightCollapsed]);
 const [dockSection, setDockSection] = useState<DockSection | null>('elementos');
 const [labels, setLabels] = useState<SavedLabel[]>([]);
 const [search, setSearch] = useState('');
 const [name, setName] = useState(t('labels.sem_titulo'));
 const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
 const currentLocked = !!currentTemplateId && (() => { const current = labels.find(item => item.id === currentTemplateId); return !!current && !canManageLabel(current); })();
 const [previewIndex, setPreviewIndex] = useState(0);
 const [confirmDelete, setConfirmDelete] = useState<SavedLabel | null>(null);
 const [saving, setSaving] = useState(false);
 const [mobilePanel, setMobilePanel] = useState<'elements' | 'layers' | 'properties'>('properties');
 const stageRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, [open]);
  useEffect(() => { if (inspectorRef.current) inspectorRef.current.scrollTop = 0; }, [editor.selectedId, editor.selectedIds.join('|')]);
 const currentNf = nfs.length ? nfs[((previewIndex % nfs.length) + nfs.length) % nfs.length] : undefined;
 const filtered = useMemo(() => labels.filter(label => label.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) || label.labelData.formato.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [labels, search]);
 useEffect(() => { if (open) void loadJsBarcode(); }, [open]);
 useEffect(() => { if (!open) return; return subscribeLabels(setLabels, error => onToast({ type: 'error', text: error.message })); }, [open, onToast]);
 const fitCanvas = useCallback(() => {
  editor.setZoom(fitZoom({ viewportWidth: stageRef.current?.clientWidth ?? window.innerWidth - 450, viewportHeight: stageRef.current?.clientHeight ?? window.innerHeight - 104, labelWidth: dim.width, labelHeight: dim.height }));
 }, [dim.height, dim.width, editor.setZoom]);
 useEffect(() => { if (!open) return; let inner = 0; const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(fitCanvas); }); return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); }; }, [open, format, fitCanvas]);
 useEffect(() => { if (!open) return; const onResize = () => fitCanvas(); window.addEventListener('resize', onResize); const observer = stageRef.current ? new ResizeObserver(onResize) : null; if (stageRef.current) observer?.observe(stageRef.current); return () => { window.removeEventListener('resize', onResize); observer?.disconnect(); }; }, [open, fitCanvas]);
 const changeFormat = useCallback((nextFormat: LabelFormat) => { setFormat(nextFormat); const nextSize = LABEL_DIMENSIONS[nextFormat]; const adjusted = editor.elements.map(item => { const box = elementBounds(item); const width = Math.min(box.width, nextSize.width); const height = Math.min(box.height, nextSize.height); return { ...item, x: Math.max(0, Math.min(item.x, nextSize.width - width)), y: Math.max(logoHeaderHeight(nextSize.height), Math.min(item.y, nextSize.height - height)), ...('width' in item ? { width } : {}), ...('height' in item ? { height } : {}) } as CanvasElement; }); editor.reset(adjusted, logoHeaderHeight(nextSize.height)); }, [editor.elements, editor.reset]);
 const centered = useCallback((element: Parameters<typeof editor.add>[0]) => editor.add(element, dim), [dim, editor.add]);
 const addText = useCallback(() => centered({ type: 'text', x: 20, y: 20, text: t('labels.duplo_clique_editar'), fontSize: 16, fill: '#18181b', fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', bgColor: 'transparent' }), [centered]);
 const addBarcode = useCallback(() => centered({ type: 'barcode', x: 20, y: 20, value: '{CHAVE}', width: Math.min(200, dim.width - 30), height: 48 }), [centered, dim.width]);
 const addShape = useCallback((type: 'rect' | 'circle' | 'triangle' | 'hexagon' | 'star' | 'line') => {
  if (type === 'line') centered({ type: 'line', x: 20, y: 20, width: 100, height: 2, fill: '#18181b', rotation: 0 });
  else centered({ type, x: 20, y: 20, width: 70, height: 45, fill: 'transparent', stroke: '#18181b', strokeWidth: 2 } as Parameters<typeof editor.add>[0]);
 }, [centered]);
 const addIcon = useCallback((type: IconType) => { centered({ type: 'icon', x: 20, y: 20, iconType: type, size: 44, fill: '#18181b' }); }, [centered]);
 const addTemplate = useCallback((template: string) => { const sx=Math.min(dim.width/100,dim.height/70), ox=(dim.width-96*sx)/2, oy=(dim.height-64*sx)/2; const text=(x:number,y:number,value:string,w=88,fs=5)=>({type:'text' as const,x:ox+x*sx,y:oy+y*sx,text:value,fontSize:fs*sx,fill:'#18181b',fontFamily:'Arial',fontWeight:'bold' as const,fontStyle:'normal' as const,textDecoration:'none' as const,textAlign:'left' as const,bgColor:'transparent',width:w*sx,height:fs*sx*1.7}); const icon=(x:number,y:number,id:IconType)=>({type:'icon' as const,x:ox+x*sx,y:oy+y*sx,iconType:id,size:12*sx,fill:'#18181b'}); const items: import('./types').NewCanvasElement[]=[]; if(template==='sender') items.push(text(4,4,'{FORNECEDOR}',88,6),text(4,18,'ORIGEM: __________________',88,4),text(4,29,'CNPJ: ____________________',88,4)); if(template==='recipient') items.push(text(4,8,'DESTINATARIO / LOJA',88,5),text(4,24,'{FILIAL}',88,8)); if(template==='volume') items.push(text(8,20,'VOL {VOL}/{TOTAL_VOL}',80,9)); if(template==='weight') items.push(text(8,20,'PESO: ___ kg',80,9)); if(template==='invoice') items.push(text(4,5,'NF {NUMERO}',88,7),{type:'barcode',x:ox+4*sx,y:oy+24*sx,value:'{CHAVE}',width:88*sx,height:24*sx}); if(template==='handling') items.push(icon(18,20,'fragile' as IconType),icon(42,20,'this-side-up' as IconType),icon(66,20,'keep-dry' as IconType)); if(template==='shipDate') items.push(text(4,20,'EXPEDICAO: ____/____/______',88,7)); editor.addMany(items,dim); },[dim,editor.addMany]);
 const addVariable = useCallback((variable: string) => {
  if (editor.selected?.type === 'text') editor.update({ text: editor.selected.text + variable });
  else { centered({ type: 'text', x: 20, y: 20, text: variable, fontSize: 16, fill: '#18181b', fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', bgColor: 'transparent' }); }
 }, [centered, editor.selected, editor.update]);
 const saveAs = useCallback(async () => {
  if (!name.trim()) { onToast({ type: 'error', text: t('labels.informe_nome_modelo') }); return; }
  setSaving(true);
  try {
   const result = await saveLabel(name.trim(), { formato: format, elements: editor.elements });
   if (!result.ok) onToast({ type: 'error', text: result.error.message });
   else {
    setCurrentTemplateId(result.data);
    onToast({ type: 'success', text: result.data.startsWith('local-') ? t('labels.modelo_salvo_local') : t('labels.modelo_salvo') });
   }
  } catch (error) {
   const detail = error instanceof Error ? error.message : String(error);
   onToast({ type: 'error', text: `Falha ao salvar modelo: ${detail}` });
  } finally { setSaving(false); }
 }, [editor.elements, format, name, onToast]);
 const save = useCallback(async () => {
  if (!currentTemplateId) { await saveAs(); return; }
  if (!name.trim()) { onToast({ type: 'error', text: t('labels.informe_nome_modelo') }); return; }
  setSaving(true);
  try {
   const result = await updateLabelTemplate(currentTemplateId, name.trim(), { formato: format, elements: editor.elements });
   if (!result.ok) onToast({ type: 'error', text: result.error.message });
   else {
    setCurrentTemplateId(result.data);
    onToast({ type: 'success', text: result.data.startsWith('local-') && result.data !== currentTemplateId
      ? t('labels.firestore_copia_local') : t('labels.modelo_atualizado') });
   }
  } catch (error) {
   const detail = error instanceof Error ? error.message : String(error);
   onToast({ type: 'error', text: `Falha ao atualizar modelo: ${detail}` });
  } finally { setSaving(false); }
 }, [currentTemplateId, editor.elements, format, name, onToast, saveAs]);
 const load = useCallback((label: SavedLabel) => {
  setCurrentTemplateId(label.id);
  setName(label.name);
  setFormat(label.labelData.formato);
  editor.reset(label.labelData.elements.map(item => {
   const size = LABEL_DIMENSIONS[label.labelData.formato];
   const bounds = elementBounds(item);
   const width = Math.min(bounds.width, size.width);
   const height = Math.min(bounds.height, size.height);
   return {
    ...item,
    x: Math.max(0, Math.min(item.x, size.width - width)),
    y: Math.max(logoHeaderHeight(size.height), Math.min(item.y, size.height - height)),
    ...('width' in item ? { width } : {}),
    ...('height' in item ? { height } : {}),
   } as CanvasElement;
  }), logoHeaderHeight(LABEL_DIMENSIONS[label.labelData.formato].height));
  onToast({ type: 'success', text: t('labels.modelo_carregado', { name: label.name }) });
 }, [editor.reset, onToast]);
 const renameSaved = useCallback(async (label: SavedLabel) => {
  const nextName = window.prompt('Novo nome do modelo:', label.name);
  if (nextName === null || !nextName.trim()) return;
  try {
   const result = await renameLabel(label.id, nextName);
   if (!result.ok) onToast({ type: 'error', text: result.error.message });
   else {
    if (currentTemplateId === label.id) setName(nextName.trim());
    onToast({ type: 'success', text: t('labels.modelo_renomeado') });
   }
  } catch (error) {
   onToast({ type: 'error', text: t('labels.erro_renomear', { error: error instanceof Error ? error.message : String(error) }) });
  }
 }, [currentTemplateId, onToast]);
 const duplicateSaved = useCallback(async (label: SavedLabel) => {
  try {
   const result = await duplicateLabelTemplate(label);
   if (!result.ok) onToast({ type: 'error', text: result.error.message });
   else onToast({ type: 'success', text: result.data.startsWith('local-') ? t('labels.copia_local_salva') : t('labels.modelo_duplicado') });
  } catch (error) {
   onToast({ type: 'error', text: t('labels.erro_duplicar', { error: error instanceof Error ? error.message : String(error) }) });
  }
 }, [onToast]);
 const removeSaved = useCallback(async () => {
  if (!confirmDelete) return;
  try {
   const result = await removeLabel(confirmDelete.id);
   if (!result.ok) onToast({ type: 'error', text: result.error.message });
   else {
    if (currentTemplateId === confirmDelete.id) setCurrentTemplateId(null);
    onToast({ type: 'success', text: t('labels.modelo_excluido') });
   }
  } catch (error) {
   onToast({ type: 'error', text: t('labels.erro_excluir', { error: error instanceof Error ? error.message : String(error) }) });
  } finally { setConfirmDelete(null); }
 }, [confirmDelete, currentTemplateId, onToast]);
 const print = useCallback(() => openAdvancedPrint({ formato: format, elements: editor.elements }, nfs.map(context), qty, () => onToast({ type: 'error', text: t('labels.habilite_popups') })), [editor.elements, format, nfs, onToast, qty]);
 const updateText = useCallback((element: CanvasElement, text: string) => { if (element.type === 'text') editor.updateElement(element.id, { text }); }, [editor.updateElement]);
 const insertVariable = useCallback((variable: string, input: HTMLTextAreaElement | null) => {
  if (editor.selected?.type !== 'text') return;
  const value = editor.selected.text; const start = input?.selectionStart ?? value.length; const end = input?.selectionEnd ?? start;
  editor.update({ text: `${value.slice(0, start)}${variable}${value.slice(end)}` });
  requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + variable.length, start + variable.length); });
 }, [editor.selected, editor.update]);
 const onStageWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => { if (!event.ctrlKey) return; event.preventDefault(); editor.setZoom(editor.zoom + (event.deltaY < 0 ? 10 : -10)); }, [editor.setZoom, editor.zoom]);
 const onCanvasMove = useCallback((event: React.PointerEvent<HTMLElement>) => editor.moveGesture(event, dim), [dim, editor.moveGesture]);
 const formats: LabelFormat[] = ['100x150','150x100','100x50','100x30 (2Col)'];
 if (!open) return null;
 return createPortal(<><div className={`editor-redesign fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden font-sans text-[13px] text-zinc-900 transition-colors duration-200 dark:text-zinc-100 bg-black/45`} onPointerDown={event => { if (event.target === event.currentTarget) { setShowSaved(false); editor.select(null); } }}>
  <div className="editor-window flex h-[100dvh] min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-none bg-[#050B1A] text-slate-100 shadow-2xl">
  <header className="editor-topbar z-20 flex h-13 shrink-0 items-center gap-2 border-b border-blue-400/15 bg-[#0B1730] px-3">
   <div className="flex min-w-0 flex-1 items-center gap-2"><Logo variant="mark" size={28} /><input aria-label={t('labels.nome_do_modelo')} value={name} onChange={event => setName(event.target.value)} className="min-w-0 w-36 truncate rounded border border-transparent bg-transparent px-2 py-1 text-[12px] font-semibold outline-none hover:border-zinc-200 focus:border-blue-500 dark:hover:border-zinc-700 lg:w-56"/><ChevronDown size={13} className="-ml-2 text-zinc-500 dark:text-zinc-400"/><span className="hidden h-5 border-l border-zinc-200 dark:border-zinc-700 sm:block"/>
    <div role="group" aria-label={t('labels.formato_da_etiqueta')} className="flex items-center rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800">{formats.map(item => <button key={item} type="button" onClick={() => changeFormat(item)} className={`rounded px-2 py-1 text-[11px] transition-colors ${format === item ? 'bg-[#0E7490] font-semibold text-white shadow-sm' : 'text-slate-600 hover:text-[#0E7490] dark:text-slate-300 dark:hover:text-[#7DD3FC]'}`}>{item}</button>)}</div>
   </div>
   <div className="flex items-center gap-0.5"><button type="button" title={t('labels.desfazer_ctrl_z')} disabled={!editor.canUndo} onClick={editor.undo} className="grid h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"><Undo2 size={15}/></button><button type="button" title={t('labels.refazer_ctrl_y')} disabled={!editor.canRedo} onClick={editor.redo} className="grid h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"><Redo2 size={15}/></button><span className="mx-1 h-5 border-l border-zinc-200 dark:border-zinc-700"/><button type="button" title={t('labels.diminuir_zoom')} onClick={() => editor.setZoom(editor.zoom - 10)} className="grid h-8 w-7 place-items-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"><ZoomOut size={14}/></button><span className="w-10 text-center text-[10px] tabular-nums text-zinc-500">{editor.zoom}%</span><button type="button" title={t('labels.aumentar_zoom')} onClick={() => editor.setZoom(editor.zoom + 10)} className="grid h-8 w-7 place-items-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"><ZoomIn size={14}/></button><button type="button" onClick={fitCanvas} className="rounded px-2 py-1 text-[10px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">{t('labels.ajustar')}</button></div>
   <div className="ml-1 flex items-center gap-1.5"><button type="button" onClick={() => void save()} disabled={saving || currentLocked} title={currentLocked ? t('labels.modelo_de_outro_usuario') : undefined} className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-[11px] font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"><Save size={13}/>{saving ? 'Salvando…' : 'Salvar'}</button><button type="button" onClick={() => void saveAs()} disabled={saving} title={t('labels.salvar_como_novo_modelo')} className="flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2 text-[11px] hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800">{t('labels.salvar_como')}</button><button type="button" onClick={print} className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"><Printer size={13}/>{t('labels.imprimir')}</button><button type="button" title={leftCollapsed ? 'Expandir elementos' : 'Recolher elementos'} aria-label={leftCollapsed ? 'Expandir elementos' : 'Recolher elementos'} aria-pressed={leftCollapsed} onClick={() => setLeftCollapsed(v => !v)} className="hidden h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:grid">{leftCollapsed ? <PanelLeftOpen size={15}/> : <PanelLeftClose size={15}/>}</button><button type="button" title={rightCollapsed ? 'Expandir propriedades' : 'Recolher propriedades'} aria-label={rightCollapsed ? 'Expandir propriedades' : 'Recolher propriedades'} aria-pressed={rightCollapsed} onClick={() => setRightCollapsed(v => !v)} className="hidden h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:grid">{rightCollapsed ? <PanelRightOpen size={15}/> : <PanelRightClose size={15}/>}</button><button type="button" aria-label="Fechar editor" onClick={onClose} className="ml-1 grid h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={16}/></button></div>
  </header>
  <div className="editor-body relative flex min-h-0 flex-1 overflow-hidden max-lg:flex-col">
   <EditorDock active={dockSection} onSelect={section => setDockSection(current => current === section ? null : section)} />
   <aside className={`editor-dock-panel editor-sidebar relative z-10 flex h-full min-h-0 flex-col border-blue-400/15 bg-[#0B1730] text-slate-200 ${dockSection ? 'is-open border-r' : ''} ${leftCollapsed ? 'palette-collapsed' : ''} ${mobilePanel === 'layers' ? 'mobile-layer-active' : ''}`}>
    {dockSection && <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA]">{t(`labels.dock.${dockSection}`)}</h2>}
    <div className={dockSection === 'elementos' ? '' : 'hidden'}><ElementPalette compact={leftCollapsed} onText={addText} onVariable={addVariable} onBarcode={addBarcode} onShape={addShape} onIcon={addIcon} onTemplate={addTemplate}/></div>
    <section className={`editor-saved-section mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-800 ${dockSection === 'salvos' ? '' : 'hidden'}`}><button type="button" aria-expanded={showSaved} onClick={() => setShowSaved(v => !v)} className="w-full truncate px-1 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">Modelos salvos {showSaved ? '−' : '+'}</button>{showSaved && <div className="space-y-2"><input aria-label={t('labels.buscar_modelo_salvo')} placeholder={t('labels.buscar_modelo')} value={search} onChange={event => setSearch(event.target.value)} className="h-8 w-full rounded border border-zinc-200 bg-transparent px-2 text-xs dark:border-zinc-700"/>{filtered.map(label => <div key={label.id} className="min-w-0 rounded border border-zinc-200 p-2 dark:border-zinc-700"><b className="block truncate text-xs">{label.name}</b><span className="text-[10px] text-zinc-500">{label.labelData.formato}</span><div className="flex flex-wrap gap-2 text-xs"><button type="button" onClick={() => load(label)}>{t('labels.abrir')}</button><button type="button" disabled={!canManageLabel(label)} title={canManageLabel(label) ? undefined : t('labels.modelo_de_outro_usuario')} onClick={() => void renameSaved(label)} className="disabled:opacity-40">{t('labels.renomear')}</button><button type="button" onClick={() => void duplicateSaved(label)}>{t('labels.duplicar')}</button><button type="button" disabled={!canManageLabel(label)} title={canManageLabel(label) ? undefined : t('labels.modelo_de_outro_usuario')} onClick={() => setConfirmDelete(label)} className="disabled:opacity-40">{t('labels.excluir')}</button></div></div>)}</div>}</section>
    <section className={`editor-layers-section mt-3 min-h-0 border-t border-zinc-200 pt-3 dark:border-zinc-800 ${dockSection === 'camadas' ? '' : 'hidden'}`}><LayersPanel elements={editor.elements} selectedIds={editor.selectedIds} onSelect={editor.selectFromLayers} onUpdate={editor.updateElement} onReorder={editor.reorderLayer}/></section>
</aside>
   <div ref={stageRef} onWheel={onStageWheel} className="editor-stage flex min-h-0 min-w-0 flex-1 flex-col"><div className="editor-workspace flex min-h-0 flex-1 flex-col">
    <div className="editor-stage-row flex min-h-0 flex-1 overflow-hidden"><div className="relative flex min-h-0 min-w-0 flex-1 flex-col"><div className="relative z-[130] flex h-12 shrink-0 items-start justify-center pt-1"><ContextToolbar visible={editor.selectedIds.length > 0} elements={editor.selectedElements} placement="inline" onUpdate={editor.update} onDuplicate={editor.duplicate} onRemove={() => editor.remove()} onLayer={editor.layer} onAlign={editor.selectedElements.length > 1 ? editor.align : undefined} onGroup={editor.group} onToggleLock={() => editor.toggleLock()} onMore={() => setMobilePanel('properties')}/></div><div className="relative flex min-h-0 min-w-0 flex-1"><LabelCanvas format={format} elements={editor.elements} zoom={editor.zoom} selectedIds={editor.selectedIds} guides={editor.guides} onSelect={editor.selectFromLayers} onSelectMany={editor.selectMany} onPointerDown={editor.beginGesture} onPointerMove={onCanvasMove} onPointerUp={editor.endGesture} onDoubleSelect={editor.isolateMember} onEdit={updateText} nf={currentNf ? context(currentNf) : undefined} volume={1} total={currentNf?.volumes ?? qty}/></div></div><div className={`editor-inspector flex h-full min-h-0 min-w-0 w-72 shrink-0 flex-col overflow-hidden ${rightCollapsed ? 'inspector-collapsed' : ''} transition-[width] duration-200 ${mobilePanel === 'layers' ? 'mobile-layer-panel-hidden' : ''}`}><div className="editor-mobile-tabs" role="tablist" aria-label={t('labels.paineis_do_editor')}><button type="button" role="tab" aria-selected={mobilePanel === 'elements'} onClick={() => setMobilePanel('elements')}>{t('labels.elementos')}</button><button type="button" role="tab" aria-selected={mobilePanel === 'layers'} onClick={() => setMobilePanel('layers')}>{t('labels.camadas')}</button><button type="button" role="tab" aria-selected={mobilePanel === 'properties'} onClick={() => setMobilePanel('properties')}>{t('labels.propriedades')}</button></div><div className="editor-mobile-elements" hidden={mobilePanel !== 'elements'}><ElementPalette onText={addText} onVariable={addVariable} onBarcode={addBarcode} onShape={addShape} onIcon={addIcon} onTemplate={addTemplate}/></div><div ref={inspectorRef} className="editor-properties-panel min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-8" hidden={mobilePanel !== 'properties'}>{editor.selectedIds.length > 1 ? <MultiSelectionPanel elements={editor.selectedElements} align={editor.align} distribute={editor.distribute} onRemove={() => editor.remove()}/> : <PropertiesPanel element={editor.selected} format={format} quantity={qty} onQuantity={setQty} onFormat={changeFormat} onUpdate={editor.update} onDuplicate={editor.duplicate} onRemove={() => editor.remove()} onLayer={editor.layer} onVariable={insertVariable} nf={currentNf ? context(currentNf) : undefined} previewIndex={previewIndex} previewCount={nfs.length} onPreviewChange={delta => setPreviewIndex(value => nfs.length ? (value + delta + nfs.length) % nfs.length : 0)}/>}</div></div></div>
    <footer className="editor-footer flex h-7 shrink-0 items-center justify-between border-t border-blue-400/15 bg-[#0B1730] px-3 font-mono text-[10px] uppercase tracking-wider text-slate-400"><span>{dim.width} × {dim.height} px · {format}</span><span className="hidden sm:block">{t('labels.duplo_clique_edita_texto_del_exclui_ctrl_z_desfaz')}</span><span>{editor.zoom}%</span></footer>
   </div>
  </div>
  </div>
  </div>
  <ConfirmDialog open={confirmDelete !== null} title={t('labels.excluir_modelo_salvo')} message={confirmDelete ? t('labels.confirmar_exclusao_modelo', { name: confirmDelete.name }) : ''} danger onCancel={() => setConfirmDelete(null)} onConfirm={() => { void removeSaved(); }}/>
 </div></>, document.body);
}
