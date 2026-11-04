import type { CanvasElement } from './types';

let counter = 0;
export function makeGroupId(): string {
  counter += 1;
  return `grp-${Date.now().toString(36)}-${counter.toString(36)}`;
}

// Expande a seleção para todos os membros de cada grupo presente.
export function expandToGroups(elements: CanvasElement[], ids: string[]): string[] {
  const groups = new Set(elements.filter(el => ids.includes(el.id) && el.groupId).map(el => el.groupId as string));
  if (!groups.size) return ids;
  const extra = elements.filter(el => el.groupId && groups.has(el.groupId)).map(el => el.id);
  return [...new Set([...ids, ...extra])];
}

// Item travado não se move, não redimensiona e não gira.
export function isMovable(el: CanvasElement): boolean {
  return !el.locked;
}

// Duplica um conjunto: grupos recebem um novo groupId por grupo original.
export function copyWithNewGroups<T extends CanvasElement>(items: T[], offset: number): T[] {
  const remap = new Map<string, string>();
  return items.map(item => {
    let groupId: string | undefined;
    if (item.groupId) {
      if (!remap.has(item.groupId)) remap.set(item.groupId, makeGroupId());
      groupId = remap.get(item.groupId);
    }
    return { ...item, groupId, x: item.x + offset, y: item.y + offset } as T;
  });
}

// Modelos antigos não têm groupId/locked: normaliza para o comportamento padrão sem alterar o restante.
export function sanitizeGroupLock(el: CanvasElement): CanvasElement {
  const out = { ...el } as CanvasElement & { groupId?: unknown; locked?: unknown };
  if (typeof out.groupId !== 'string' || !out.groupId) delete out.groupId;
  if (typeof out.locked !== 'boolean') delete out.locked;
  return out;
}
