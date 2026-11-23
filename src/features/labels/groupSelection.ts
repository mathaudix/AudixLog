import type { CanvasElement } from './types';

// Cor de marcador estável por groupId (hash simples -> paleta fixa).
const MARKER_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2'];
export function groupMarkerColor(groupId: string): string {
  let h = 0;
  for (let i = 0; i < groupId.length; i += 1) h = (h * 31 + groupId.charCodeAt(i)) >>> 0;
  return MARKER_COLORS[h % MARKER_COLORS.length] ?? MARKER_COLORS[0] ?? '#2563eb';
}

// Decide a nova seleção num clique simples num item.
// - item em grupo -> seleciona o grupo inteiro (mesma regra do canvas).
// - isolate=true (Alt-clique no painel) -> seleciona só o item.
export function selectOnClick(elements: CanvasElement[], id: string, isolate = false): string[] {
  const item = elements.find(el => el.id === id);
  if (!item) return [id];
  if (isolate || !item.groupId) return [id];
  return elements.filter(el => el.groupId === item.groupId).map(el => el.id);
}

// Duplo clique num membro com o grupo inteiro selecionado isola só esse membro.
// Retorna null quando não se aplica (sem grupo, ou já isolado) -> o chamador mantém o comportamento atual.
export function isolateOnDoubleClick(elements: CanvasElement[], selectedIds: string[], id: string): string[] | null {
  const item = elements.find(el => el.id === id);
  if (!item || !item.groupId) return null;
  const members = elements.filter(el => el.groupId === item.groupId).map(el => el.id);
  const wholeGroupSelected = members.length > 0 && members.every(m => selectedIds.includes(m));
  if (!wholeGroupSelected || selectedIds.length !== members.length) return null;
  return [id];
}
