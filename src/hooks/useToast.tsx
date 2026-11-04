import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Toast } from '../types';
interface ToastContextValue { toast: Toast | null; notify: (toast: Toast) => void; clear: () => void }
const ToastContext = createContext<ToastContextValue | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null); const clear = useCallback(() => setToast(null), []); const notify = useCallback((value: Toast) => setToast(value), []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(clear, 4000); return () => window.clearTimeout(timer); }, [toast, clear]);
  const value = useMemo(() => ({ toast, notify, clear }), [toast, notify, clear]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
export function useToast() { const value = useContext(ToastContext); if (!value) throw new Error('useToast precisa de ToastProvider'); return value; }
