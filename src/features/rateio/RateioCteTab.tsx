import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/ui/system';
import { Download, FileText, Printer, Trash2, Upload } from 'lucide-react';
import { useRateioDraft } from './useRateioDraft';
import { agruparNotas, ratearFrete, totais, type GrupoRateio, type NotaRateio } from './utils/rateio';
import { decodificarXml, parseNfeXml, type NfeLida } from './utils/parseNfeXml';
import { Button } from '../../components/ui/Button';
import { DESTINOS, type Destino } from './utils/destino';
import { downloadCsv } from './utils/exportCsv';
import { printReport } from './utils/printReport';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ResumoRateio } from './components/ResumoRateio';
import { TabelaGrupos } from './components/TabelaGrupos';
import { FormManual } from './components/FormManual';
import logoUrl from '../../assets/logo/logo-mark-black.svg';

const LOTE = 50;

export default function RateioCteTab({ onToast }: { onToast: (t: { type: 'success' | 'error' | 'info'; text: string }) => void }) {
  const freteFocus = useRef(false);
  const pastaRef = useRef<HTMLInputElement>(null);
  const arquivosRef = useRef<HTMLInputElement>(null);
  // webkitdirectory não é repassado de forma confiável pelo React: definido direto no elemento.
  useEffect(() => {
    pastaRef.current?.setAttribute('webkitdirectory', '');
    pastaRef.current?.setAttribute('directory', '');
  }, []);
  const { draft, update, status } = useRateioDraft(true, freteFocus);
  const [freteInput, setFreteInput] = useState<string>('');
  const [filtroDestino, setFiltroDestino] = useState<'todos' | Destino>('todos');
  const [busca, setBusca] = useState('');
  const [progresso, setProgresso] = useState<number | null>(null);
  const [avisoDup, setAvisoDup] = useState<string | null>(null);
  const [erroXml, setErroXml] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<null | { title: string; message: string; run: () => void }>(null);

  const frete = Math.round(draft.frete || 0);
  const notasLidas: NotaRateio[] = draft.notas;
  // Notas atuais no momento da chamada (usado depois de awaits na importação).
  const grupos = useMemo(() => ratearFrete(agruparNotas(notasLidas), frete, draft.fretesManuais, draft.pesosManuais), [notasLidas, frete, draft.fretesManuais, draft.pesosManuais]);
  const visiveis = useMemo(() => grupos.filter(g => (filtroDestino === 'todos' || g.destino === filtroDestino) && (!busca || [g.fornecedor, g.documento, g.ie].join(' ').toLowerCase().includes(busca.toLowerCase()))), [grupos, filtroDestino, busca]);
  const t = totais(grupos);

  const onFrete = (v: string) => { setFreteInput(v); update(prev => ({ frete: Math.round(Number(v.replace(',', '.')) || 0) })); };

  async function importar(files: FileList | null) {
    if (!files) return;
    const todos = Array.from(files);
    const xmls = todos.filter(f => f.name.toLowerCase().endsWith('.xml'));
    setAvisoDup(null);
    setErroXml(null);
    if (xmls.length === 0) {
      setErroXml(todos.length ? 'Nenhum arquivo .xml encontrado na pasta' : 'Nenhum arquivo .xml selecionado');
      return;
    }
    const existentes = new Set(notasLidas.map(n => n.chave));
    const novas: NfeLida[] = [];
    let invalidos = 0, duplicados = 0, valorInvalido = 0, naoNfe = 0;
    for (let i = 0; i < xmls.length; i += LOTE) {
      const lote = xmls.slice(i, i + LOTE);
      for (const f of lote) {
        try {
          const r = parseNfeXml(decodificarXml(await f.arrayBuffer()));
          if (!r.ok) {
            if (r.motivo === 'valor') valorInvalido++;
            else if (r.motivo === 'nao_nfe') naoNfe++;
            else invalidos++;
            continue;
          }
          if (existentes.has(r.nota.chave) || novas.some(n => n.chave === r.nota.chave)) { duplicados++; continue; }
          novas.push(r.nota);
        } catch {
          invalidos++;
        }
      }
      setProgresso(Math.round(((i + lote.length) / xmls.length) * 100));
      await new Promise(res => setTimeout(res, 0));
    }
    setProgresso(null);
    const ignorados = naoNfe + invalidos + valorInvalido;
    setAvisoDup(duplicados ? `${duplicados} nota(s) ignorada(s) pois já haviam sido lançadas (duplicadas)` : null);
    setErroXml(ignorados ? `${ignorados} arquivo(s) ignorado(s) por não serem XMLs de NFe válidos` : null);
    if (novas.length) update(prev => ({ notas: [...prev.notas, ...novas] }));
    onToast({
      type: novas.length ? 'success' : 'info',
      text: `${novas.length} importadas, ${duplicados} duplicadas, ${ignorados} inválidas`,
    });
  }

  function lancarManual(n: NfeLida) {
    if (notasLidas.some(x => x.chave === n.chave)) { onToast({ type: 'error', text: 'Chave já lançada' }); return false; }
    update(prev => ({ notas: [...prev.notas, n] }));
    return true;
  }

  function removerGrupo(g: GrupoRateio) {
    setConfirmar({
      title: 'Remover notas do CT-e', message: `Remover ${g.notas.length} nota(s) de ${g.fornecedor}?`,
      run: () => {
        const keys = new Set(g.notas.map(n => n.chave));
        update(prev => {
          const fretes = { ...prev.fretesManuais }; delete fretes[g.key];
          const pesos = { ...prev.pesosManuais }; delete pesos[g.key];
          return { notas: prev.notas.filter(n => !keys.has(n.chave)), fretesManuais: fretes, pesosManuais: pesos };
        });
      },
    });
  }

  function zerarTudo() {
    setConfirmar({
      title: 'Zerar rateio', message: 'Isso apaga notas, frete total, valores fixos e pesos fixos. Continuar?',
      run: () => { setFreteInput(''); setAvisoDup(null); setErroXml(null); update(() => ({ notas: [], frete: 0, fretesManuais: {}, pesosManuais: {} })); },
    });
  }

  const setFreteManual = (key: string, v: number | null) => {
    update(prev => {
      const m = { ...prev.fretesManuais };
      if (v === null) delete m[key]; else m[key] = Math.round(v);
      return { fretesManuais: m };
    });
  };
  const setPesoManual = (key: string, v: number | null) => {
    update(prev => {
      const m = { ...prev.pesosManuais };
      if (v === null) delete m[key]; else m[key] = v;
      return { pesosManuais: m };
    });
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title="Rateio de Frete CT-e"
        description={status === 'saving' ? 'Salvando…' : status === 'saved' ? 'Salvo na nuvem' : 'Rascunho compartilhado'}
        actions={<>
          <Button variant="primary" size="md" onClick={() => pastaRef.current?.click()}><Upload size={15}/> Importar pasta</Button>
          <Button variant="secondary" size="md" onClick={() => arquivosRef.current?.click()}><FileText size={15}/> Importar arquivos</Button>
          <input ref={pastaRef} type="file" className="hidden" multiple onChange={e => { void importar(e.target.files); e.target.value = ''; }}/>
          <input ref={arquivosRef} type="file" className="hidden" multiple accept=".xml" onChange={e => { void importar(e.target.files); e.target.value = ''; }}/>
          <Button variant="secondary" size="md" disabled={!grupos.length} onClick={() => downloadCsv(visiveis)}><Download size={15}/> Exportar CSV</Button>
          <Button variant="secondary" size="md" disabled={!grupos.length} onClick={() => { if (!printReport(visiveis, frete, logoUrl)) onToast({ type: 'error', text: 'Não há dados para imprimir com os filtros atuais' }); }}><Printer size={15}/> Imprimir</Button>
          <Button variant="danger-ghost" size="md" onClick={zerarTudo}><Trash2 size={15}/> Zerar</Button>
        </>}
      />

      {progresso !== null && <div className="rounded-card border border-border bg-surface p-3 text-small text-fg">Processando {progresso}%<div className="mt-2 h-2 rounded bg-bg"><div className="h-2 rounded bg-primary" style={{ width: `${progresso}%` }}/></div></div>}
      {avisoDup && <div className="rounded-card border border-warning/30 bg-warning/10 p-3 text-small text-warning">{avisoDup}</div>}
      {erroXml && <div className="rounded-card border border-danger/30 bg-danger/10 p-3 text-small text-danger">{erroXml}</div>}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <label className="block rounded-card border border-border bg-surface p-4 text-sm font-semibold text-fg">Valor total do frete (R$)
            <input type="number" inputMode="numeric" step="1" value={freteInput} onFocus={() => { freteFocus.current = true; }} onBlur={() => { freteFocus.current = false; }} onChange={e => onFrete(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-fg"/>
          </label>
          <FormManual destinos={DESTINOS} onAdd={lancarManual}/>
        </div>
        <div className="min-w-0 space-y-4">
          <ResumoRateio totais={t} frete={frete} grupos={grupos}/>
          <div className="flex flex-wrap gap-2">
            <select value={filtroDestino} onChange={e => setFiltroDestino(e.target.value as 'todos' | Destino)} className="rounded-control border border-border bg-surface px-3 py-2 text-small text-fg">
              <option value="todos">Todas</option>
              {DESTINOS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar fornecedor, CNPJ ou IE" className="min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2 text-small text-fg"/>
          </div>
          <TabelaGrupos grupos={visiveis} totalFrete={frete} onFreteManual={setFreteManual} onPesoManual={setPesoManual} onRemove={removerGrupo}/>
        </div>
      </div>

      <ConfirmDialog open={confirmar !== null} title={confirmar?.title ?? ''} message={confirmar?.message ?? ''} danger onCancel={() => setConfirmar(null)} onConfirm={() => { const run = confirmar?.run; setConfirmar(null); run?.(); }}/>
    </section>
  );
}
