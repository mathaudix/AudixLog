import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../../services/firebase';
import type { NfeLida } from './utils/parseNfeXml';

export interface RateioDraft {
  notas: NfeLida[];
  frete: number;
  fretesManuais: Record<string, number>;
  pesosManuais: Record<string, number>;
}

const EMPTY: RateioDraft = { notas: [], frete: 0, fretesManuais: {}, pesosManuais: {} };
const draftRef = () => doc(db, 'artifacts', appId, 'public', 'data', 'cte_state', 'shared_draft');

/** Rascunho compartilhado (cte_state/shared_draft): onSnapshot + salvamento com debounce de 1 s. */
export function useRateioDraft(enabled: boolean, focusedFreteRef: { current: boolean }) {
  const [draft, setDraft] = useState<RateioDraft>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(draftRef(), snap => {
      // Enquanto há edição local ainda não salva, o snapshot do servidor não pode apagá-la.
      if (dirty.current) return;
      const data = snap.data() as Partial<RateioDraft> | undefined;
      if (!data) { setLoaded(true); return; }
      setDraft(current => ({
        notas: data.notas ?? [],
        frete: focusedFreteRef.current ? current.frete : Number(data.frete ?? 0),
        fretesManuais: data.fretesManuais ?? {},
        pesosManuais: data.pesosManuais ?? {},
      }));
      setLoaded(true);
    });
  }, [enabled, focusedFreteRef]);

  // Forma funcional: nunca usa um draft antigo capturado antes de um await.
  // Aceita valores diretos ou funções (prev => next) para campos do draft.
  const update = (patch: Partial<RateioDraft> | ((prev: RateioDraft) => Partial<RateioDraft>)) => {
    setDraft(current => {
      const nextPatch = typeof patch === 'function' ? patch(current) : patch;
      return { ...current, ...nextPatch };
    });
    dirty.current = true;
    setStatus('saving');
  };

  useEffect(() => {
    if (!dirty.current || !loaded || !enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await setDoc(draftRef(), { ...draft, updatedAt: serverTimestamp(), lastUpdatedBy: auth.currentUser?.uid ?? null }, { merge: true });
        dirty.current = false;
        setStatus('saved');
      } catch {
        setStatus('idle');
      }
    }, 1000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [draft, loaded, enabled]);

  return { draft, update, status, loaded };
}
