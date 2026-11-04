import type { CanvasElement } from './types';
export interface HistoryState {present:CanvasElement[];past:CanvasElement[][];future:CanvasElement[][]}
export type EditorHistoryAction={type:'commit';value:CanvasElement[]}|{type:'undo'}|{type:'redo'}|{type:'reset';value:CanvasElement[]};
const LIMIT=100;
export function canvasHistoryReducer(s:HistoryState,a:EditorHistoryAction):HistoryState{if(a.type==='reset')return{present:a.value,past:[],future:[]};if(a.type==='commit')return JSON.stringify(s.present)===JSON.stringify(a.value)?s:{present:a.value,past:[...s.past,s.present].slice(-LIMIT),future:[]};if(a.type==='undo'){const x=s.past.at(-1);return x?{present:x,past:s.past.slice(0,-1),future:[s.present,...s.future].slice(0,LIMIT)}:s}const x=s.future[0];return x?{present:x,past:[...s.past,s.present].slice(-LIMIT),future:s.future.slice(1)}:s}
