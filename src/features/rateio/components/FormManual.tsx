import { useState } from 'react';
import type { NfeLida } from '../utils/parseNfeXml';
import type { Destino } from '../utils/destino';

/** Converte "1.234,56" ou "1234.56" em número. */
export function parseMoneyBR(v: string): number {
  const s = v.trim();
  if (!s) return 0;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function FormManual({ destinos, onAdd }: { destinos: readonly Destino[]; onAdd: (n: NfeLida) => boolean }) {
  const [f, setF] = useState({ fornecedor: '', documento: '', ie: '', chave: '', valor: '', peso: '', destino: 'Lojas' as Destino });
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(s => ({ ...s, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const chave = f.chave.replace(/\D/g, '');
    const valor = parseMoneyBR(f.valor);
    if (chave.length !== 44) return setErro('A chave precisa ter 44 dígitos');
    if (!(valor > 0)) return setErro('Valor deve ser maior que zero');
    const ok = onAdd({ chave, valor, peso: parseMoneyBR(f.peso) || 0, fornecedor: (f.fornecedor.trim() || 'MANUAL').toUpperCase(), documento: f.documento.replace(/\D/g, ''), ie: f.ie.trim(), destino: f.destino });
    if (ok) { setErro(null); setF(s => ({ ...s, chave: '', valor: '', peso: '' })); }
  }

  const input = 'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg';
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-fg">Lançamento manual de nota</p>
      <input className={input} placeholder="Fornecedor (vazio = MANUAL)" value={f.fornecedor} onChange={set('fornecedor')}/>
      <div className="grid grid-cols-2 gap-2"><input className={input} placeholder="CNPJ/CPF (opc.)" value={f.documento} onChange={set('documento')}/><input className={input} placeholder="IE (opc.)" value={f.ie} onChange={set('ie')}/></div>
      <input className={input} placeholder="Chave de acesso (44 dígitos)" value={f.chave} onChange={set('chave')}/>
      <div className="grid grid-cols-2 gap-2"><input className={input} placeholder="Valor da NF-e" value={f.valor} onChange={set('valor')}/><input className={input} placeholder="Peso bruto (KG)" value={f.peso} onChange={set('peso')}/></div>
      <select className={input} value={f.destino} onChange={set('destino')}>{destinos.map(d => <option key={d} value={d}>{d === 'Lojas' ? 'Central/Padrão (Lojas)' : d}</option>)}</select>
      {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
      <button type="submit" className="ui-button ui-button-primary ui-button-md w-full">Lançar nota</button>
    </form>
  );
}
