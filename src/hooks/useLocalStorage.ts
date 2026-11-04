import { useCallback, useState } from 'react';
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => { try { const stored = localStorage.getItem(key); return stored === null ? initialValue : (JSON.parse(stored) as T); } catch { return initialValue; } });
  const update = useCallback((next: T | ((current: T) => T)) => { setValue(current => { const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next; try { localStorage.setItem(key, JSON.stringify(resolved)); } catch { /* armazenamento indisponível */ } return resolved; }); }, [key]);
  return [value, update];
}
