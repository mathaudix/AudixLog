import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants';
export type ThemeMode = 'light' | 'dark' | 'system';
export function useTheme() {
 const [themeMode, setMode] = useState<ThemeMode>(() => {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'system';
 });
 const [dark, setDark] = useState(false);
 useEffect(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => { const isDark = themeMode === 'system' ? media.matches : themeMode === 'dark'; setDark(isDark); document.documentElement.classList.toggle('dark', isDark); document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'; };
  apply(); media.addEventListener('change', apply); localStorage.setItem(STORAGE_KEYS.theme, themeMode);
  return () => media.removeEventListener('change', apply);
 }, [themeMode]);
 return { dark, themeMode, setThemeMode: setMode };
}
