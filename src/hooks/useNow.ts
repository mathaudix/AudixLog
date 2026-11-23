import { useEffect, useState } from 'react';

/** Retorna o instante atual, atualizado a cada `intervalMs`. Não faz nenhuma consulta ao Firestore. */
export function useNow(intervalMs = 300_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
