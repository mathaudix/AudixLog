import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { UserProfile, UserStatus } from '../../types';
import { subscribeUsers, setUserAccess, type AccessChange } from '../../services/profileRepository';
import { useI18n } from '../../i18n/I18nProvider';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';

type Filter = 'todos' | UserStatus;

// Status efetivo: perfis antigos (sem status) valem pelo flag ativo.
export const effectiveStatus = (u: UserProfile): UserStatus => u.status ?? (u.ativo ? 'ativo' : 'desativado');

// Regras de negócio da tela: quem pode sofrer cada ação. Retorna a chave de erro ou null.
export function guardChange(target: UserProfile, change: AccessChange, self: UserProfile, admins: UserProfile[]): string | null {
  if (target.uid === self.uid && (change === 'deactivate' || change === 'removeAdmin')) return 'users.selfBlock';
  const activeAdmins = admins.filter(a => effectiveStatus(a) === 'ativo' && a.role === 'admin');
  const isLastAdmin = target.role === 'admin' && effectiveStatus(target) === 'ativo' && activeAdmins.length <= 1;
  if (isLastAdmin && (change === 'deactivate' || change === 'removeAdmin')) return 'users.lastAdmin';
  return null;
}

export function pendingCount(users: UserProfile[]): number {
  return users.filter(u => effectiveStatus(u) === 'pendente').length;
}

export function UsersPage({ self, onBack, onPendingChange }: { self: UserProfile; onBack: () => void; onPendingChange?: (count: number) => void }) {
  const { t } = useI18n();
  const { notify } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');
  const [busyUid, setBusyUid] = useState('');

  useEffect(() => subscribeUsers(setUsers, error => notify({ type: 'error', text: t('users.error', { error: error.message }) })), [notify, t]);
  useEffect(() => onPendingChange?.(pendingCount(users)), [users, onPendingChange]);

  const visible = useMemo(() => users
    .filter(u => filter === 'todos' || effectiveStatus(u) === filter)
    .sort((a, b) => Number(effectiveStatus(a) === 'pendente') > Number(effectiveStatus(b) === 'pendente') ? -1 : a.nome.localeCompare(b.nome)), [users, filter]);

  const act = async (target: UserProfile, change: AccessChange) => {
    const blocked = guardChange(target, change, self, users);
    if (blocked) { notify({ type: 'error', text: t(blocked) }); return; }
    setBusyUid(target.uid);
    const result = await setUserAccess(target, change);
    setBusyUid('');
    notify(result.ok ? { type: 'success', text: t('users.saved') } : { type: 'error', text: t('users.error', { error: result.error.message }) });
  };

  const actions = (u: UserProfile) => {
    const status = effectiveStatus(u);
    const list: [AccessChange, string][] = [];
    if (status === 'pendente') list.push(['approve', t('users.approve')]);
    if (status === 'ativo') list.push(['deactivate', t('users.deactivate')]);
    if (status === 'desativado') list.push(['reactivate', t('users.reactivate')]);
    if (u.role === 'admin') list.push(['removeAdmin', t('users.removeAdmin')]);
    else if (status === 'ativo') list.push(['makeAdmin', t('users.makeAdmin')]);
    return list;
  };

  const filters: Filter[] = ['todos', 'pendente', 'ativo', 'desativado'];
  const label = (s: Filter) => s === 'todos' ? t('users.all') : t(`users.${s}`);
  const statusText = (s: UserStatus) => t(`users.${s}`);

  return <section className="space-y-5"><div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={onBack} aria-label={t('users.back')}><ArrowLeft size={16}/></Button><h1 className="text-xl font-bold">{t('users.title')}</h1></div><Tabs label={t('users.title')} variant="segmented" items={filters.map(f => ({ id: f, label: label(f) }))} value={filter} onChange={setFilter} />{visible.length === 0 ? <p className="text-sm text-muted">{t('users.empty')}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted"><th className="py-2 pr-3">{t('users.name')}</th><th className="py-2 pr-3">{t('users.email')}</th><th className="py-2 pr-3">{t('users.status')}</th><th className="py-2 pr-3">{t('users.role')}</th><th className="py-2 pr-3">{t('users.createdAt')}</th><th className="py-2"/></tr></thead><tbody>{visible.map(u => <tr key={u.uid} className="border-b border-border align-top"><td className="py-2 pr-3 font-semibold">{u.nome || '—'}</td><td className="break-all py-2 pr-3">{u.email}</td><td className="py-2 pr-3">{statusText(effectiveStatus(u))}</td><td className="py-2 pr-3">{u.role === 'admin' ? t('users.admin') : t('users.operator')}</td><td className="py-2 pr-3">{u.criadoEm ? u.criadoEm.toLocaleDateString('pt-BR') : '—'}</td><td className="py-2"><div className="flex flex-wrap gap-1">{actions(u).map(([change, text]) => <Button key={change} size="sm" variant={change === 'approve' ? 'primary' : 'secondary'} disabled={busyUid === u.uid} onClick={() => void act(u, change)}>{text}</Button>)}</div></td></tr>)}</tbody></table></div>}</section>;
}
