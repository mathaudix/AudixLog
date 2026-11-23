import type { GrupoRateio } from '../utils/rateio';
import { DESTINOS, type Destino } from '../utils/destino';

const COR: Record<Destino, string> = { Netos: 'bg-warning', Sorriso: 'bg-warning/60', 'Filial 5': 'bg-info', 'Vó Graça': 'bg-primary', 'RP Martins': 'bg-brand', Lojas: 'bg-tertiary' };
const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const kg = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ResumoRateio({ totais, frete, grupos }: { totais: { notas: number; valor: number; peso: number; frete: number; ctes: number }; frete: number; grupos: GrupoRateio[] }) {
  const pctFrete = totais.valor > 0 ? ((frete / totais.valor) * 100).toFixed(1) : '0,0';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card label="Notas lidas" value={String(totais.notas)}/>
        <Card label="Carga total" value={money(totais.valor)} hint={`Frete representa ${pctFrete}%`}/>
        <Card label="Conhecimentos a emitir" value={String(totais.ctes)} hint={`Frete total ${money(frete)}`}/>
        <Card label="Peso bruto (KG)" value={kg(totais.peso)}/>
      </div>
      <div className="rounded-card border border-border bg-surface p-4 shadow-surface">
        <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-tertiary">Custos agrupados por destino</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {DESTINOS.map(d => {
            const gs = grupos.filter(g => g.destino === d);
            return (
              <div key={d} className="rounded-control border border-border p-2 text-caption">
                <span className={`mb-1 inline-block h-2 w-8 rounded ${COR[d]}`}/>
                <div className="font-semibold text-fg">{d}</div>
                <div className="text-muted">{gs.length} CT-e(s) · R$ {gs.reduce((s, g) => s + g.frete, 0).toLocaleString('pt-BR')}</div>
                <div className="text-muted">{kg(gs.reduce((s, g) => s + (g.fixoPeso ?? g.peso), 0))} KG</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-lg font-semibold text-fg">{value}</p>{hint && <p className="mt-1 text-xs text-muted">{hint}</p>}</div>;
}
