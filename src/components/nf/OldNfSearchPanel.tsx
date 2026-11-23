import { useEffect, useState } from 'react';
import { Archive, History } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import type { NotaFiscal } from '../../types';
import { findOldNfsByTerm } from '../../services/nfRepository';
import { classifySearchTerm, mergeOldResults, type TaggedNf } from '../../utils/oldNfSearch';
import { useToast } from '../../hooks/useToast';

interface Props { term: string; loaded: NotaFiscal[]; windowDays: number; onOpen: (nf: NotaFiscal, source: TaggedNf['source']) => void }

/** Painel "Buscar em notas antigas": consulta pontual (chave ou número), sob demanda, sem alterar a lista carregada. */
export function OldNfSearchPanel({ term, loaded, windowDays, onOpen }: Props) {
  const { t } = useI18n(); const { notify } = useToast();
  const [results, setResults] = useState<TaggedNf[] | null>(null); const [busy, setBusy] = useState(false);
  const kind = classifySearchTerm(term);

  // Limpa resultados quando o termo muda.
  useEffect(() => { setResults(null); setBusy(false); }, [term]);

  if (kind === 'vazio' || kind === 'texto') return null;

  const search = async () => {
    setBusy(true);
    try {
      const found = await findOldNfsByTerm(term);
      setResults(mergeOldResults(loaded, found));
    } catch (cause) {
      notify({ type: 'error', text: t('old_search.error', { error: cause instanceof Error ? cause.message : '' }) });
    } finally { setBusy(false); }
  };

  return <div className="mt-3 rounded-2xl border border-border bg-surface/80 p-3 dark:border-border dark:bg-surface/60">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted dark:text-tertiary">{t('old_search.hint', { days: windowDays })}</p>
      <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-bg disabled:opacity-60 dark:border-zinc-600 dark:hover:bg-raised" disabled={busy} onClick={() => void search()}>
        <History size={16}/>{busy ? t('old_search.searching') : t('old_search.button')}
      </button>
    </div>
    {results !== null && <div className="mt-3">
      <h4 className="mb-2 text-sm font-bold">{t('old_search.title', { count: results.length })}</h4>
      {results.length === 0 ? <p className="text-sm text-muted">{t('old_search.none')}</p> : <ul className="divide-y divide-slate-200 dark:divide-zinc-800">
        {results.map(({ nf, source }) => <li key={`${source}-${nf.id}`}>
          <button type="button" className="flex w-full flex-wrap items-center justify-between gap-2 py-2 text-left text-sm hover:bg-bg dark:hover:bg-raised" onClick={() => onOpen(nf, source)}>
            <span className="font-semibold">{nf.numero} · {nf.fornecedor}</span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{t('old_search.badge_antiga')}</span>
              {source === 'arquivada' && <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-fg dark:bg-raised dark:text-fg"><Archive size={12}/>{t('old_search.badge_arquivada')}</span>}
            </span>
          </button>
        </li>)}
      </ul>}
    </div>}
  </div>;
}
