import { useEffect, useRef } from 'react';

export interface EditorShortcutActions {
  undo: () => void; redo: () => void; remove: () => void; duplicate: () => void; group: (ungroup: boolean) => void; toggleLock: () => void;
  selectAll: () => void; clearSelection: () => void; hasSelection: () => boolean;
  previewNudge: (dx: number, dy: number) => void; commitNudge: (dx: number, dy: number) => void;
}
const isTextEntry = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || Boolean(target.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'));
};
export function useEditorShortcuts(actions: EditorShortcutActions): void {
  const actionsRef = useRef(actions); actionsRef.current = actions;
  const nudgeRef = useRef({ dx: 0, dy: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const flushNudge = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      const { dx, dy } = nudgeRef.current;
      if (dx || dy) actionsRef.current.commitNudge(dx, dy);
      nudgeRef.current = { dx: 0, dy: 0 };
    };
    const keydown = (event: KeyboardEvent) => {
      if (isTextEntry(event.target)) return;
      const mod = event.ctrlKey || event.metaKey, key = event.key.toLowerCase();
      if (mod && key === 'z') { event.preventDefault(); event.shiftKey ? actionsRef.current.redo() : actionsRef.current.undo(); return; }
      if (mod && key === 'y') { event.preventDefault(); actionsRef.current.redo(); return; }
      if (mod && key === 'd') { event.preventDefault(); actionsRef.current.duplicate(); return; }
      if (mod && key === 'g') { event.preventDefault(); actionsRef.current.group(event.shiftKey); return; }
      if (mod && event.shiftKey && key === 'l') { event.preventDefault(); actionsRef.current.toggleLock(); return; }
      if (mod && key === 'a') { event.preventDefault(); actionsRef.current.selectAll(); return; }
      if (event.key === 'Escape') { if (actionsRef.current.hasSelection()) { event.preventDefault(); actionsRef.current.clearSelection(); } return; }
      if (event.key === 'Delete' || event.key === 'Backspace') { if (actionsRef.current.hasSelection()) { event.preventDefault(); actionsRef.current.remove(); } return; }
      const step = event.shiftKey ? 5 : 1;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      if ((!dx && !dy) || !actionsRef.current.hasSelection()) return;
      event.preventDefault(); nudgeRef.current = { dx: nudgeRef.current.dx + dx, dy: nudgeRef.current.dy + dy };
      actionsRef.current.previewNudge(nudgeRef.current.dx, nudgeRef.current.dy);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushNudge, 400);
    };
    const keyup = (event: KeyboardEvent) => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) flushNudge(); };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);
}
