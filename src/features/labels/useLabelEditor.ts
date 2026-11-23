import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { DEFAULT_ELEMENTS } from './constants';
import { useCanvasHistory } from './useCanvasHistory';
import { useEditorShortcuts } from './useEditorShortcuts';
import { elementBounds, normalizeLabelElements, resizeRotated, snapRotation, type CanvasSize, type ResizeHandle, type SnapGuide } from './geometry';
import { copyWithNewGroups, expandToGroups, makeGroupId } from './groupLock';
import { isolateOnDoubleClick, selectOnClick } from './groupSelection';
import { boxOf, computeSnap, keepInside, rotationOf } from './snapGuides';
import { LIMITS, clampLimit } from './limits';
import { pxPerUnit } from './fitZoom';
import type { CanvasElement, CanvasElementPatch, NewCanvasElement } from './types';

type Gesture = { id: string; ids: string[]; mode: 'drag' | 'resize' | 'rotate'; handle: ResizeHandle; pointerId: number; startX: number; startY: number; origin: CanvasElement[]; originElements: CanvasElement[] };
const makeId = (): string => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useLabelEditor(minimumY = 15, canvasSize?: CanvasSize) {
  const minimumYRef = useRef(minimumY); minimumYRef.current = minimumY;
  const history = useCanvasHistory(normalizeLabelElements(DEFAULT_ELEMENTS, minimumYRef.current));
  const commitElements = useCallback((items: CanvasElement[]) => {
    // Itens cuja rotacao mudou nesta acao sao reempurrados para dentro da etiqueta (caixa rotacionada).
    const prev = historyElementsRef.current;
    const fixed = canvasSize ? items.map(item => { const old = prev.find(p => p.id === item.id); return old && rotationOf(old) !== rotationOf(item) ? keepInside(item, canvasSize) : item; }) : items;
    history.commit(normalizeLabelElements(fixed, minimumYRef.current));
  }, [history.commit, canvasSize?.width, canvasSize?.height]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedIdsRef = useRef(selectedIds); selectedIdsRef.current = selectedIds;
  const historyElementsRef = useRef(history.elements); historyElementsRef.current = history.elements;
  const [zoomValue, setZoomValue] = useState(80);
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const [transient, setTransient] = useState<CanvasElement[] | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const snapSizesRef = useRef<Record<string, { width: number; height: number }>>({});
  const unitPxRef = useRef(0);
  const elements = transient ?? history.elements;
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const selectedElements = useMemo(() => history.elements.filter(item => selectedIds.includes(item.id)), [history.elements, selectedIds]);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] ?? null : null;
  const selected = selectedId ? history.elements.find(item => item.id === selectedId) ?? null : null;
  const select = useCallback((id: string | null) => setSelectedIds(id ? [id] : []), []);
  // Painel de Camadas: clique seleciona o grupo inteiro; Alt-clique isola o item.
  const selectFromLayers = useCallback((id: string | null, isolate = false) => {
    if (!id) { setSelectedIds([]); return; }
    setSelectedIds(selectOnClick(historyElementsRef.current, id, isolate));
  }, []);
  // Duplo clique num membro com o grupo inteiro selecionado isola esse membro. Retorna true se aplicou.
  const isolateMember = useCallback((id: string): boolean => {
    const next = isolateOnDoubleClick(historyElementsRef.current, selectedIdsRef.current, id);
    if (!next) return false;
    setSelectedIds(next);
    return true;
  }, []);
  const selectMany = useCallback((ids: string[], additive = false) => setSelectedIds(current => additive ? [...new Set([...current, ...ids])] : [...new Set(ids)]), []);

  const add = useCallback((element: NewCanvasElement, center?: CanvasSize) => {
    const id = makeId();
    const placed = { ...element, id, zIndex: Math.max(0, ...history.elements.map(item => item.zIndex)) + 1, y: Math.max(minimumYRef.current, element.y) } as CanvasElement;
    if (center) {
      placed.x = (center.width - (('width' in placed ? placed.width ?? 80 : 'size' in placed ? placed.size : placed.type === 'text' ? placed.fontSize * 4 : 80))) / 2;
      placed.y = (center.height - (('height' in placed ? placed.height ?? 30 : 'size' in placed ? placed.size : placed.type === 'text' ? placed.fontSize * 1.5 : 30))) / 2;
    }
    commitElements([...history.elements, placed]); setSelectedIds([id]);
  }, [commitElements, history.elements]);
  const addMany = useCallback((items: NewCanvasElement[], center: CanvasSize) => { if (!items.length) return; const z = Math.max(0, ...history.elements.map(item => item.zIndex)); const placed = items.map((element, index) => { const id = makeId(); const width = 'width' in element ? element.width ?? 80 : 'size' in element ? element.size : element.type === 'text' ? (element.width ?? element.fontSize * 4) : 80; const height = 'height' in element ? element.height ?? 30 : 'size' in element ? element.size : element.type === 'text' ? (element.height ?? element.fontSize * 1.5) : 30; return { ...element, id, zIndex: z + index + 1, x: Math.max(0, (center.width-width)/2 + element.x), y: Math.max(minimumYRef.current, (center.height-height)/2 + element.y) } as CanvasElement; }); commitElements([...history.elements, ...placed]); setSelectedIds(placed.map(item=>item.id)); }, [commitElements, history.elements]);
  const updateSelectedTexts = useCallback((patch: CanvasElementPatch) => {
    const textIds = new Set(selectedIds.filter(id => history.elements.some(item => item.id === id && item.type === 'text')));
    if (!textIds.size) return;
    commitElements(history.elements.map(item => textIds.has(item.id) && item.type === 'text' ? { ...item, ...patch } as CanvasElement : item));
  }, [commitElements, history.elements, selectedIds]);
  const updateElement = useCallback((id: string, patch: CanvasElementPatch) => {
    commitElements(history.elements.map(item => item.id === id ? { ...item, ...patch } as CanvasElement : item));
  }, [commitElements, history.elements]);
  const reorderLayer = useCallback((id: string, direction: -1 | 1) => {
    const ordered = [...history.elements].sort((a, b) => a.zIndex - b.zIndex);
    const index = ordered.findIndex(item => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    commitElements(ordered.map((item, position) => ({ ...item, zIndex: position })));
  }, [commitElements, history.elements]);
  const update = useCallback((patch: CanvasElementPatch) => {
    if (selectedIds.length) commitElements(history.elements.map(item => selectedIds.includes(item.id) ? { ...item, ...patch } as CanvasElement : item));
  }, [commitElements, history.elements, selectedIds]);
  const remove = useCallback((targetId?: string) => { const ids = targetId ? [targetId] : selectedIds; if (!ids.length) return; commitElements(history.elements.filter(item => !ids.includes(item.id))); setSelectedIds([]); }, [commitElements, history.elements, selectedIds]);
  const duplicate = useCallback(() => {
    const chosen = history.elements.filter(item => selectedIds.includes(item.id) && !item.locked && !item.hidden); if (!chosen.length) return; const base = Math.max(0, ...history.elements.map(el => el.zIndex)); const copies = copyWithNewGroups(chosen, 12).map((item, index) => ({ ...item, id: makeId(), zIndex: base + index + 1 } as CanvasElement)); commitElements([...history.elements, ...copies]); setSelectedIds(copies.map(item => item.id));
  }, [commitElements, history.elements, selectedIds]);
  const group = useCallback((ungroup: boolean) => {
    const ids = selectedIds; if (!ids.length) return;
    if (ungroup) { if (!history.elements.some(item => ids.includes(item.id) && item.groupId)) return; commitElements(history.elements.map(item => ids.includes(item.id) && item.groupId ? { ...item, groupId: undefined } as CanvasElement : item)); return; }
    if (ids.length < 2) return; const gid = makeGroupId(); commitElements(history.elements.map(item => ids.includes(item.id) ? { ...item, groupId: gid } as CanvasElement : item));
  }, [commitElements, history.elements, selectedIds]);
  const toggleLock = useCallback((targetId?: string) => {
    const ids = targetId ? [targetId] : selectedIds; if (!ids.length) return;
    const targets = history.elements.filter(item => ids.includes(item.id)); if (!targets.length) return;
    const lock = !targets.every(item => item.locked);
    commitElements(history.elements.map(item => ids.includes(item.id) ? { ...item, locked: lock } as CanvasElement : item));
  }, [commitElements, history.elements, selectedIds]);
  const layer = useCallback((front: boolean) => {
    if (!selectedIds.length) return;
    const max = Math.max(0, ...history.elements.map(item => item.zIndex)); const min = Math.min(0, ...history.elements.map(item => item.zIndex));
    commitElements(history.elements.map(item => selectedIds.includes(item.id) ? { ...item, zIndex: front ? max + 1 : min - 1 } : item));
  }, [commitElements, history.elements, selectedIds]);
  const beginGesture = useCallback((event: ReactPointerEvent<HTMLElement>, item: CanvasElement, mode: Gesture['mode'], handle: ResizeHandle = 'se') => {
    if (mode === 'rotate') {
      event.preventDefault(); event.stopPropagation();
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* optional */ }
      setSelectedIds([item.id]);
      gesture.current = { id: item.id, ids: [item.id], mode, handle, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: [item], originElements: elementsRef.current };
      return;
    }
    event.preventDefault(); event.stopPropagation();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture may be unavailable in tests. */ }
    if (event.shiftKey || event.ctrlKey || event.metaKey) { setSelectedIds(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id]); gesture.current = null; return; }
    if (item.locked) { setSelectedIds([item.id]); gesture.current = null; return; }
    // Seleção isolada (duplo clique) é respeitada: o gesto não expande para o grupo inteiro.
    const currentSelectedIds = selectedIdsRef.current;
    const isIsolated = currentSelectedIds.includes(item.id) && currentSelectedIds.length === 1;
    const expanded = mode === 'resize' || isIsolated ? [item.id] : expandToGroups(historyElementsRef.current, currentSelectedIds.includes(item.id) ? currentSelectedIds : [item.id]);
    const ids = expanded.filter(id => !historyElementsRef.current.some(el => el.id === id && el.locked));
    setSelectedIds(mode === 'resize' ? [item.id] : expanded);
    const originElements = elementsRef.current; const origin = mode === 'resize' ? [item] : originElements.filter(element => ids.includes(element.id));
    gesture.current = { id: item.id, ids: mode === 'resize' ? [item.id] : ids, mode, handle, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin, originElements };
    // tamanho local em unidades do canvas, lido do wrapper (style.width/height em px do canvas, nao a caixa girada)
    const canvasEl = document.querySelector<HTMLElement>('.absolute.inset-0.overflow-hidden');
    const unitPx = canvasEl && canvasSize ? pxPerUnit(canvasEl.getBoundingClientRect().width, canvasSize.width) : 0;
    unitPxRef.current = unitPx;
    const rendered: Record<string, { width: number; height: number }> = {};
    for (const el of originElements) {
      const node = document.querySelector<HTMLElement>(`[data-element-id=\"${el.id}\"]`);
      if (node && unitPx > 0) rendered[el.id] = { width: parseFloat(node.style.width) / unitPx, height: parseFloat(node.style.height) / unitPx };
    }
    snapSizesRef.current = rendered;
  }, [selectedIds, zoomValue]);
  const moveGesture = useCallback((event: ReactPointerEvent<HTMLElement>, canvas: CanvasSize) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.startX; const dy = event.clientY - active.startY;
    if (active.mode === 'rotate') {
      const original = active.origin[0]; if (!original) return;
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI + 90;
      const next = snapRotation(angle, event.shiftKey);
      const changed = active.originElements.map(el => el.id === active.id ? { ...el, rotation: next } as CanvasElement : el);
      setTransient(changed); elementsRef.current = changed; setGuides([]);
      return;
    }
    if (active.mode === 'drag') {
      const scale = Math.max(.01, zoomValue / 100); let mx = dx / scale, my = dy / scale;
      const sizeOf = (el: CanvasElement) => snapSizesRef.current[el.id];
      const boxFor = (el: CanvasElement) => { const s = sizeOf(el); return s ? boxOf({ ...el, width: s.width, height: s.height } as CanvasElement) : boxOf(el); };
      const movingItems = active.originElements.filter(el => active.ids.includes(el.id));
      const boxes = movingItems.map(boxFor);
      const left = Math.min(...boxes.map(b => b.x)), top = Math.min(...boxes.map(b => b.y));
      const right = Math.max(...boxes.map(b => b.x + b.width)), bottom = Math.max(...boxes.map(b => b.y + b.height));
      const others = active.originElements.filter(el => !active.ids.includes(el.id)).map(boxFor);
      if (!event.altKey) {
        const snap = computeSnap({ x: left + mx, y: top + my, width: right - left, height: bottom - top }, others, canvas, 4 / scale);
        mx += snap.dx; my += snap.dy;
        setGuides(snap.guides);
      } else setGuides([]);
      const changed = active.originElements.map(el => active.ids.includes(el.id) ? keepInside({ ...el, x: clampLimit(el.x + mx, LIMITS.pos), y: clampLimit(el.y + my, LIMITS.pos) } as CanvasElement, canvas) : el);
      setTransient(changed); elementsRef.current = changed;
    } else {
      const original = active.origin[0]; if (!original) return; const resized = resizeRotated(original, dx, dy, zoomValue, active.handle, minimumYRef.current, snapSizesRef.current[original.id], unitPxRef.current);
      const changed = normalizeLabelElements(active.originElements.map(item => item.id === active.id ? resized : item), minimumYRef.current);
      setTransient(changed); elementsRef.current = changed; setGuides([]);
    }
  }, [zoomValue]);
  const endGesture = useCallback(() => {
    const last = elementsRef.current;
    if (gesture.current && last !== history.elements) commitElements(last);
    gesture.current = null; setTransient(null); setGuides([]);
  }, [commitElements, history.elements]);
  const reset = useCallback((value: CanvasElement[], reserveY = minimumYRef.current) => { minimumYRef.current = reserveY; history.reset(normalizeLabelElements(value, reserveY)); setTransient(null); setSelectedIds([]); }, [history.reset]);
  const setZoom = useCallback((value: number) => setZoomValue(Math.max(25, Math.min(200, value))), []);
  const align = useCallback((direction: 'left'|'centerX'|'right'|'top'|'centerY'|'bottom') => { const group=history.elements.filter(item=>selectedIds.includes(item.id)); if(group.length<2)return; const entries=group.map(item=>({item,b:elementBounds(item)})); const l=Math.min(...entries.map(e=>e.item.x)),t=Math.min(...entries.map(e=>e.item.y)),r=Math.max(...entries.map(e=>e.item.x+e.b.width)),b=Math.max(...entries.map(e=>e.item.y+e.b.height)); commitElements(history.elements.map(item=>{const e=entries.find(x=>x.item.id===item.id);if(!e)return item;return {...item,x:direction==='left'?l:direction==='right'?r-e.b.width:direction==='centerX'?(l+r-e.b.width)/2:item.x,y:direction==='top'?t:direction==='bottom'?b-e.b.height:direction==='centerY'?(t+b-e.b.height)/2:item.y} as CanvasElement;})); },[history.commit,history.elements,selectedIds]);
  const distribute=useCallback((axis:'x'|'y')=>{const g=history.elements.filter(item=>selectedIds.includes(item.id));if(g.length<3)return;const e=g.map(item=>({item,b:elementBounds(item)})).sort((a,b)=>axis==='x'?a.item.x-b.item.x:a.item.y-b.item.y);const first=e[0],last=e[e.length-1];if(!first||!last)return;const start=axis==='x'?first.item.x:first.item.y,end=axis==='x'?last.item.x+last.b.width:last.item.y+last.b.height,total=e.reduce((s,x)=>s+(axis==='x'?x.b.width:x.b.height),0),gap=(end-start-total)/(e.length-1);let cursor=start;const coords=new Map<string,number>();e.forEach(x=>{coords.set(x.item.id,cursor);cursor+=(axis==='x'?x.b.width:x.b.height)+gap;});commitElements(history.elements.map(item=>coords.has(item.id)?{...item,...(axis==='x'?{x:coords.get(item.id)}:{y:coords.get(item.id)})} as CanvasElement:item));},[history.commit,history.elements,selectedIds]);
  const previewNudge = useCallback((dx: number, dy: number) => {
    const ids = selectedIdsRef.current;
    const next = historyElementsRef.current.map(item => ids.includes(item.id) && !item.locked && !item.hidden ? { ...item, x: clampLimit(item.x + dx, LIMITS.pos), y: clampLimit(item.y + dy, LIMITS.pos) } as CanvasElement : item);
    setTransient(next); elementsRef.current = next;
  }, []);
  const commitNudge = useCallback((dx: number, dy: number) => {
    const ids = selectedIdsRef.current;
    const next = historyElementsRef.current.map(item => ids.includes(item.id) && !item.locked && !item.hidden ? { ...item, x: clampLimit(item.x + dx, LIMITS.pos), y: clampLimit(item.y + dy, LIMITS.pos) } as CanvasElement : item);
    commitElements(next); setTransient(null); elementsRef.current = next;
  }, [commitElements]);
  const move = useCallback((ids: string[], dx: number, dy: number) => {
    const next = historyElementsRef.current.map(item => ids.includes(item.id) && !item.locked && !item.hidden ? { ...item, x: clampLimit(item.x + dx, LIMITS.pos), y: clampLimit(item.y + dy, LIMITS.pos) } as CanvasElement : item);
    commitElements(next); setTransient(null); elementsRef.current = next;
  }, [commitElements]);
  useEditorShortcuts({
    undo: history.undo, redo: history.redo,
    remove: () => { const ids = selectedIdsRef.current; if (!ids.length) return; commitElements(historyElementsRef.current.filter(item => !ids.includes(item.id) || item.locked)); setSelectedIds([]); },
    duplicate, group, toggleLock: () => toggleLock(), selectAll: () => setSelectedIds(historyElementsRef.current.filter(item => !item.hidden && !item.locked).map(item => item.id)),
    clearSelection: () => setSelectedIds([]), hasSelection: () => selectedIdsRef.current.some(id => historyElementsRef.current.some(item => item.id === id && !item.locked && !item.hidden)), previewNudge, commitNudge,
  });
  return { elements, selectedIds, selectedElements, selectedId, selected, select, selectFromLayers, isolateMember, selectMany, updateSelectedTexts, zoom: zoomValue, setZoom, guides, canUndo: history.canUndo, canRedo: history.canRedo, undo: history.undo, redo: history.redo, reset, add, addMany, update, updateElement, reorderLayer, remove, duplicate, group, toggleLock, layer, align, distribute, beginGesture, moveGesture, endGesture, move };
}
