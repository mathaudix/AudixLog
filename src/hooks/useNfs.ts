import { useEffect, useState } from 'react';
import type { NotaFiscal } from '../types';
import { subscribeNfs } from '../services/nfRepository';
import { DEFAULT_WINDOW_DAYS } from '../utils/nfWindow';
import { useToast } from './useToast';
export function useNfs(enabled: boolean, windowDays: number = DEFAULT_WINDOW_DAYS) {
  const [nfs, setNfs] = useState<NotaFiscal[]>([]); const [loading, setLoading] = useState(enabled); const { notify } = useToast();
  useEffect(() => { if (!enabled) return; setLoading(true); return subscribeNfs(data => { setNfs(data); setLoading(false); }, error => { setLoading(false); notify({ type: 'error', text: `Erro ao carregar notas: ${error.message}` }); }, windowDays); }, [enabled, notify, windowDays]);
  return { nfs, loading };
}
