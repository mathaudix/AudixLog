import { useState } from 'react';
import { ChevronDown, ChevronRight, Lock, Trash2, Weight } from 'lucide-react';
import type { GrupoRateio } from '../utils/rateio';
import { pesoEfetivo } from '../utils/rateio';
import { StatusPill, type Tone } from '../../../components/ui/system';

const TOM_DESTINO: Record<string, Tone> = { Netos: 'warning', Sorriso: 'warning', 'Filial 5': 'info', 'Vó Graça': 'primary', 'RP Martins': 'primary', Lojas: 'neutral' };
const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const kg = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  grupos: GrupoRateio[];
  totalFrete: number;
  onFreteManual: (key: string, v: number | null) => void;
  onPesoManual: (key: string, v: number | null) => void;
  onRemove: (g: GrupoRateio) => void;
}

export function TabelaGrupos({ grupos, totalFrete, onFreteManual, onPesoManual, onRemove }: Props) {
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const soma = grupos.reduce((s, g) => s + g.frete, 0);
  const somaValor = grupos.reduce((s, g) => s + g.valor, 0);
  const somaPeso = grupos.reduce((s, g) => s + pesoEfetivo(g), 0);
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-bg text-left text-xs uppercase tracking-wide text-muted">
          <tr><th className="p-3">Emitente/Fornecedor</th><th className="p-3">NF-e</th><th className="p-3 text-right">Mercadoria</th><th className="p-3 text-right">Peso bruto</th><th className="p-3 text-right">Valor CT-e</th><th className="p-3"/></tr>
        </thead>
        <tbody>
          {grupos.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">Nenhuma nota lançada.</td></tr>}
          {grupos.map(g => {
            const open = !!abertos[g.key];
            return (
              <FragmentRow key={g.key}>
                <tr className="border-t border-border">
                  <td className="p-3"><div className="font-semibold text-fg">{g.fornecedor}</div><div className="text-xs text-muted">{g.documento} · IE {g.ie || '—'} · <StatusPill tone={TOM_DESTINO[g.destino] ?? 'neutral'}>{g.destino}</StatusPill></div><div className="text-xs text-muted">{g.notas[0]?.chave} {g.notas.length > 1 ? `(+${g.notas.length - 1} chaves)` : ''}</div></td>
                  <td className="p-3"><button type="button" className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-fg" onClick={() => setAbertos(a => ({ ...a, [g.key]: !open }))}>{open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}{g.notas.length}</button></td>
                  <td className="p-3 text-right text-fg">{money(g.valor)}</td>
                  <td className="p-3 text-right"><ManualValue value={g.fixoPeso} display={`${kg(pesoEfetivo(g))} kg`} icon={<Weight size={12}/>} tone="orange" onSave={v => onPesoManual(g.key, v)} label="Peso"/></td>
                  <td className="p-3 text-right"><ManualValue value={g.fixoFrete} display={`R$ ${g.frete.toLocaleString('pt-BR')}`} sub={`${g.percentual.toFixed(2)}% do frete`} icon={<Lock size={12}/>} tone="orange" onSave={v => onFreteManual(g.key, v)} label="Frete" /></td>
                  <td className="p-3 text-right"><button type="button" aria-label="Remover notas do grupo" className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger" onClick={() => onRemove(g)}><Trash2 size={15}/></button></td>
                </tr>
                {open && <tr className="bg-bg"><td colSpan={6} className="p-3"><table className="w-full text-xs"><thead className="text-muted"><tr><th className="text-left">Chave</th><th className="text-right">Valor</th><th className="text-right">Peso</th><th className="text-right">Frete</th></tr></thead><tbody>{g.notas.map(n => <tr key={n.chave}><td className="py-1 font-mono">{n.chave}</td><td className="text-right">{money(n.valor)}</td><td className="text-right">{kg(n.peso)}</td><td className="text-right">R$ {n.frete.toLocaleString('pt-BR')}</td></tr>)}</tbody></table></td></tr>}
              </FragmentRow>
            );
          })}
        </tbody>
        {grupos.length > 0 && <tfoot className="border-t-2 border-border bg-bg font-semibold text-fg"><tr><td className="p-3">SOMA TOTAL ({grupos.length} conhecimentos)</td><td/><td className="p-3 text-right">{money(somaValor)}</td><td className="p-3 text-right">{kg(somaPeso)} kg</td><td className="p-3 text-right">R$ {soma.toLocaleString('pt-BR')}{soma !== totalFrete && <span className="ml-1 text-xs text-muted">(filtrado)</span>}</td><td/></tr></tfoot>}
      </table>
      {grupos.length > 0 && soma !== totalFrete && <p className="border-t border-border p-3 text-right text-sm text-muted">Frete total informado: <span className="font-semibold text-fg">R$ {totalFrete.toLocaleString('pt-BR')}</span></p>}
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) { return <>{children}</>; }
function ManualValue({ value, display, sub, icon, tone, onSave, label }: { value?: number; display: string; sub?: string; icon: React.ReactNode; tone: 'primary' | 'orange'; onSave: (v: number | null) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const color = tone === 'primary' ? 'text-primary' : 'text-warning';
  if (editing) return (
    <input autoFocus aria-label={`${label} manual`} type="number" className="w-24 rounded border border-border bg-bg px-2 py-1 text-right text-fg" value={draft} onChange={e => setDraft(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(draft === '' ? null : Number(draft.replace(',', '.'))); setEditing(false); } if (e.key === 'Escape') setEditing(false); }} onBlur={() => setEditing(false)}/>
  );
  return (
    <button type="button" title={`Fixar ${label.toLowerCase()} manualmente`} className={`inline-flex flex-col items-end ${value !== undefined ? color : 'text-fg'}`} onClick={() => { setDraft(value !== undefined ? String(value) : ''); setEditing(true); }}>
      <span className="inline-flex items-center gap-1 font-semibold">{value !== undefined && icon}{display}{value !== undefined && <button type="button" aria-label={`Remover ${label.toLowerCase()} fixo`} className="ml-1 text-xs" onClick={e => { e.stopPropagation(); onSave(null); }}>×</button>}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </button>
  );
}
