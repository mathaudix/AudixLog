import { useCallback, useReducer } from 'react';
import type { CanvasElement } from './types';
import { canvasHistoryReducer, type HistoryState } from './history';
export function useCanvasHistory(initial: CanvasElement[]) {
 const [state, dispatch] = useReducer(canvasHistoryReducer, { present: initial, past: [], future: [] } satisfies HistoryState);
 const commit = useCallback((value: CanvasElement[]) => dispatch({ type: 'commit', value }), []);
 const undo = useCallback(() => dispatch({ type: 'undo' }), []);
 const redo = useCallback(() => dispatch({ type: 'redo' }), []);
 const reset = useCallback((value: CanvasElement[]) => dispatch({ type: 'reset', value }), []);
 return { elements: state.present, canUndo: state.past.length > 0, canRedo: state.future.length > 0, commit, undo, redo, reset };
}
