import { useI18n } from './i18n/I18nProvider';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, Truck } from 'lucide-react';
import { Button } from './components/ui/Button';
import type { UserProfile } from './types';
import { useCurrentUserProfile, ProfileProvider } from './hooks/useCurrentUserProfile';
import { LoginPage } from './components/auth/LoginPage';
import { AccessGate } from './components/auth/AccessGate';
import { accessState } from './services/accessState';
import { SignUpForm } from './components/auth/SignUpForm';
import { UsersPage } from './components/settings/UsersPage';
import { Loader2 } from 'lucide-react';
import { auth } from './services/firebase';
import { ProfilePage } from './components/profile/ProfilePage';
import type { BulkAction, Filters, NotaFiscal, NfDraft, SortConfig, StatusConferencia } from './types';
import { ITEMS_PER_PAGE } from './constants';
import { createNf, updateNf, removeNf, bulkUpdate, setStatus, dispatch, undoDispatch } from './services/nfRepository';
import { archiveOldNfs, isArchiveEligible } from './services/archiveService';
import { exportNfsToXlsx } from './utils/spreadsheet'; import { filterAndSort, computeStats } from './utils/nfFilters';
import { getStaleInfo, type StaleInfo } from './utils/staleness';
import { useNow } from './hooks/useNow';
import { useAuth } from './hooks/useAuth'; import { useNfs } from './hooks/useNfs'; import { useAppConfig } from './hooks/useAppConfig'; import { useTheme } from './hooks/useTheme'; import { useDebounce } from './hooks/useDebounce'; import { useImport } from './hooks/useImport';
import { calcDivergence, signed } from './utils/divergence';
import { Sidebar } from './components/layout/Sidebar'; import { Header } from './components/layout/Header'; import { NfFilters } from './components/nf/NfFilters'; import { NfTable } from './components/nf/NfTable'; import { OldNfSearchPanel } from './components/nf/OldNfSearchPanel'; import { Pagination } from './components/nf/Pagination'; import { BulkActionBar } from './components/nf/BulkActionBar'; import { NfFormModal } from './components/nf/NfFormModal'; const StatsPanel = lazy(() => import('./components/stats/StatsPanel').then(m => ({ default: m.StatsPanel }))); const SettingsModal = lazy(() => import('./components/settings/SettingsModal').then(m => ({ default: m.SettingsModal }))); import { ConfirmDialog } from './components/ui/ConfirmDialog'; import { ToastView } from './components/ui/Toast'; import { useToast as useToastContext } from './hooks/useToast';
const RateioCteTab = lazy(() => import('./features/rateio/RateioCteTab'));
const LabelEditorModal = lazy(() => import('./features/labels/LabelEditorModal'));
import { StandardLabelPrintModal } from './features/labels/StandardLabelPrintModal';
import { normalizeAccessKey, nfNumberFromKey } from './utils/accessKey';
function Dashboard({ profile, onSignOut }: { profile: UserProfile; onSignOut: () => void }) {
 const [usersOpen, setUsersOpen] = useState(false);
 const [pendingUsers, setPendingUsers] = useState(0);
 const { t } = useI18n();
 const { config } = useAppConfig(true); const { nfs, loading } = useNfs(true, config.windowDays); const now = useNow(); const { themeMode, setThemeMode } = useTheme(); const { toast, notify, clear } = useToastContext();
 const [pageView, setPageView] = useState<'dashboard' | 'profile'>('dashboard');
 const [tab, setTab] = useState<'estoque' | 'expedidas' | 'rateio'>('estoque');
 const [sidebarExpanded, setSidebarExpanded] = useState(() => { try { return localStorage.getItem('audix.sidebar.expanded') === 'true'; } catch { return false; } });
 useEffect(() => { try { localStorage.setItem('audix.sidebar.expanded', String(sidebarExpanded)); } catch { /* storage unavailable */ } }, [sidebarExpanded]);
 const [filters, setFilters] = useState<Filters>({ search: '', startDate: '', endDate: '', status: 'todos', filial: '' }); const debouncedSearch = useDebounce(filters.search, 250);
 const [sort, setSort] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' }); const [currentPage, setCurrentPage] = useState(1); const [selected, setSelected] = useState<string[]>([]);
 const [formOpen, setFormOpen] = useState(false); const [scannedKey, setScannedKey] = useState(''); const [revealNfId, setRevealNfId] = useState<string | null>(null); const [editing, setEditing] = useState<NotaFiscal | null>(null); const [settingsOpen, setSettingsOpen] = useState(false); const [archiveProgress, setArchiveProgress] = useState<{ completed: number; total: number } | null>(null);   const [labelEditorOpen, setLabelEditorOpen] = useState(false); const [standardLabelOpen, setStandardLabelOpen] = useState(false); const [labelTargetNfs, setLabelTargetNfs] = useState<NotaFiscal[]>([]); const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => Promise<void>; danger?: boolean } | null>(null);
 const { processing, importFiles } = useImport(nfs, config); const list = useMemo(() => filterAndSort(nfs, { ...filters, search: debouncedSearch }, sort, tab === 'estoque' ? 'recebido' : 'expedido'), [nfs, filters, debouncedSearch, sort, tab]);
 const staleById = useMemo(() => new Map<string, StaleInfo>(nfs.filter(nf => nf.status === 'recebido').map(nf => [nf.id, getStaleInfo(nf, now, config.staleHours)])), [nfs, now, config.staleHours]);
 const staleCount = useMemo(() => [...staleById.values()].filter(info => info.stale).length, [staleById]);
 const divergentById = useMemo(() => new Map<string, boolean>(nfs.map(nf => [nf.id, calcDivergence({ pesoEsperado: nf.peso, pesoConferido: nf.pesoConferido, volEsperado: nf.volumes, volConferido: nf.volumesConferidos }, { weightTolerancePct: config.weightTolerancePct, volumeTolerance: config.volumeTolerance }).divergent])), [nfs, config.weightTolerancePct, config.volumeTolerance]);
 const divergentTitleById = useMemo(() => new Map<string, string>(nfs.flatMap(nf => { const check = calcDivergence({ pesoEsperado: nf.peso, pesoConferido: nf.pesoConferido, volEsperado: nf.volumes, volConferido: nf.volumesConferidos }, { weightTolerancePct: config.weightTolerancePct, volumeTolerance: config.volumeTolerance }); return check.divergent ? [[nf.id, `Peso ${signed(check.weightDiffKg, 2)} kg${check.weightDiffPct !== null ? ` (${signed(check.weightDiffPct, 1)}%)` : ''} · Volumes ${signed(check.volumeDiff, 0)}`] as [string, string]] : []; })), [nfs, config.weightTolerancePct, config.volumeTolerance]);
 const divergentCount = divergentTitleById.size;
 const visibleList = useMemo(() => list.filter(nf => (!filters.stale || staleById.get(nf.id)?.stale) && (!filters.divergent || divergentById.get(nf.id))), [list, filters.stale, filters.divergent, staleById, divergentById]);
 const handleScannedKey = (raw: string) => {
   const key = normalizeAccessKey(raw);
   if (key.length !== 44) return;
   const nfNumber = nfNumberFromKey(key);
   const digits = (value: string) => value.replace(/\D/g, '').replace(/^0+/, '');
   const match = nfs.find(item => normalizeAccessKey(item.chaveAcesso ?? '') === key)
     ?? nfs.find(item => digits(item.numero) === digits(nfNumber));
   if (!match) {
     setScannedKey(key);
     setEditing(null);
     setFormOpen(true);
     notify({ type: 'error', text: t('notes.nota_nao_encontrada', { key }) });
     return;
   }
   setRevealNfId(match.id);
   setTab(match.status === 'expedido' ? 'expedidas' : 'estoque');
   setFilters(current => ({ ...current, search: match.numero, startDate: '', endDate: '', status: 'todos', filial: '' }));
   setCurrentPage(1);
   setSelected([match.id]);
   setPageView('dashboard');
   notify({ type: 'success', text: t('notes.nota_encontrada', { number: match.numero }) });
 };
 useEffect(() => {
   let buffer = '';
   let lastAt = 0;
   const onKeyDown = (event: KeyboardEvent) => {
     if (event.key === 'Enter') {
       if (buffer.length >= 40) {
         event.preventDefault();
         const key = normalizeAccessKey(buffer);
         buffer = '';
         if (key.length === 44) handleScannedKey(key);
       } else buffer = '';
       return;
     }
     if (event.key.length !== 1 || !/\d/.test(event.key)) return;
     const now = performance.now();
     if (now - lastAt > 120) buffer = '';
     lastAt = now;
     buffer += event.key;
     if (buffer.length > 80) buffer = buffer.slice(-80);
   };
   window.addEventListener('keydown', onKeyDown, true);
   return () => window.removeEventListener('keydown', onKeyDown, true);
 }, [nfs]);
 const stats = useMemo(() => computeStats(nfs), [nfs]); const branchOptions = useMemo(() => [...new Set(nfs.map(nf => nf.filial?.trim().toUpperCase()).filter((branch): branch is string => Boolean(branch)))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [nfs]); const pages = Math.ceil(visibleList.length / ITEMS_PER_PAGE); const shown = visibleList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
 const commit = useCallback(async (result: { ok: true } | { ok: false; error: Error }, success: string) => { if (result.ok) notify({ type: 'success', text: success }); else notify({ type: 'error', text: result.error.message }); }, [notify]);
 const save = async (draft: NfDraft) => {
   if (!draft.responsavel?.trim()) { notify({ type: 'error', text: t('notes.obrigatorio_responsavel') }); throw new Error(t('notes.responsavel_obrigatorio')); }
   const duplicate = nfs.some(nf => nf.id !== editing?.id && ((draft.chaveAcesso && nf.chaveAcesso === draft.chaveAcesso) || (nf.numero === draft.numero && nf.fornecedor.toLowerCase() === draft.fornecedor.toLowerCase())));
   if (duplicate) { notify({ type: 'error', text: t('notes.duplicate_invoice') }); throw new Error('Duplicata'); }
   const payload = { ...draft, numero: draft.numero.trim(), fornecedor: draft.fornecedor || 'N/I', volumes: Number(draft.volumes) || 0, peso: Number(draft.peso) || 0, valor: Number(draft.valor) || 0, status: draft.status ?? editing?.status ?? 'recebido', statusConferencia: draft.statusConferencia ?? 'pendente', responsavel: draft.responsavel.trim() };
   const result = editing ? await updateNf(editing.id, payload) : await createNf({ ...payload, data: draft.data, status: 'recebido' }, 'criada');
   if (!result.ok) { notify({ type: 'error', text: t('notes.save_error') }); throw result.error; }
   notify({ type: 'success', text: editing ? t('notes.updated_success') : t('notes.invoice_registered') }); setEditing(null); setScannedKey('');
 };
 const doBulk = async (action: BulkAction) => {
   const dispatchedAt = new Date(); const payload = action.type === 'dispatch' ? { status: 'expedido', dataExpedicao: dispatchedAt, dataExpedicaoISO: dispatchedAt.toISOString().slice(0, 10) } : action.type === 'status' ? { statusConferencia: action.value } : action.type === 'assignee' ? { responsavel: action.value } : null;
   const perform = async () => { const result = action.type === 'delete' ? await Promise.all(selected.map(removeNf)) : await bulkUpdate(selected, payload ?? {}, nfs); const failure = Array.isArray(result) ? result.find(item => !item.ok) : !result.ok ? result : null; if (failure && !failure.ok) notify({ type: 'error', text: t('notes.batch_error') }); else notify({ type: 'success', text: t('notes.batch_updated') }); setSelected([]); };
   setConfirm({ title: action.type === 'delete' ? t('notes.confirm_delete_records') : t('notes.confirm_bulk_action'), message: t('notes.bulk_action_message', { count: selected.length }), danger: action.type === 'delete', run: perform });
 };
 const selectId = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
 const archiveCount = useMemo(() => nfs.filter(nf => isArchiveEligible(nf)).length, [nfs]);
 const requestArchive = () => setConfirm({ title: t('notes.archive_old'), message: t('notes.archive_message', { count: archiveCount }), run: async () => { setArchiveProgress({ completed: 0, total: archiveCount }); try { const result = await archiveOldNfs((completed, total) => setArchiveProgress({ completed, total })); notify({ type: result.falhas.length ? 'error' : 'success', text: `${t('notes.archive_success_count', { count: result.ok })}${result.falhas.length ? ` ${t('notes.archive_failures_count', { count: result.falhas.length })}` : ''}` }); } catch (cause) { notify({ type: 'error', text: cause instanceof Error ? cause.message : t('notes.archive_error') }); } finally { setArchiveProgress(null); } } });
 const setStatusInline = async (id: string, status: StatusConferencia) => { const result = await setStatus(id, status); await commit(result, t('settings.status_updated')); };
 const importValidated = async (files: File[]) => { const valid = files.filter(file => { const ext = file.name.toLowerCase().split('.').pop() ?? ''; if (file.size > 10 * 1024 * 1024) { notify({ type: 'error', text: t('notes.file_too_large') }); return false; } if (ext !== 'xml') { notify({ type: 'error', text: t('notes.select_xml') }); return false; } return true; }); if (!valid.length) return; await importFiles(valid, 'xml', ''); }; const fileImport = async (event: React.ChangeEvent<HTMLInputElement>) => { await importValidated(Array.from(event.target.files ?? [])); event.target.value = ''; };
 const onStatusFilter = (status: 'pendente' | 'conferida' | 'divergente' | 'expedidas') => { if (status === 'expedidas') setTab('expedidas'); else { setTab('estoque'); setFilters(current => ({ ...current, status })); } };
 const exportCurrent = () => { const filtered = nfs.filter(nf => (tab === 'estoque' ? nf.status === 'recebido' : nf.status === 'expedido') && (!filters.filial || nf.filial === filters.filial)); if (!filtered.length) notify({ type: 'error', text: t('notes.no_export_data') }); else { void exportNfsToXlsx(filtered).then(() => notify({ type: 'success', text: t('notes.export_success') })).catch(error => notify({ type: 'error', text: error instanceof Error ? error.message : String(error) })); } };
 const print = (nf: NotaFiscal) => { setLabelTargetNfs([nf]); setStandardLabelOpen(true); };
 return <div className="app-shell flex h-[100dvh] min-w-0 overflow-hidden" style={{ '--sidebar-w': sidebarExpanded ? '240px' : '68px', '--sidebar-half': sidebarExpanded ? '120px' : '34px' } as React.CSSProperties}><Sidebar tab={tab} expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(value => !value)} onTab={value => { setTab(value); setCurrentPage(1); setPageView('dashboard'); setUsersOpen(false); }} onRateio={() => { setTab('rateio'); setPageView('dashboard'); setUsersOpen(false); }} onUsers={profile.role === 'admin' ? () => setUsersOpen(true) : undefined} pendingUsers={pendingUsers} onSettings={profile.role === 'admin' ? () => setSettingsOpen(true) : () => undefined} onLabelEditor={() => { setSelected([]); setLabelTargetNfs([]); setLabelEditorOpen(true); }} /><main className={`app-main flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto ${selected.length ? 'has-selection' : ''}`}><Header userName={profile.nome} userEmail={profile.email} onProfile={() => setPageView('profile')} onSignOut={onSignOut} themeMode={themeMode} onThemeMode={setThemeMode} onNew={() => { setEditing(null); setFormOpen(true); }} onImportXml={() => document.getElementById('xml-upload')?.click()} onExport={exportCurrent}/><input id="xml-upload" className="hidden" type="file" accept=".xml,text/xml" multiple onChange={event => void fileImport(event)}/><div className="mx-auto w-full max-w-[1600px] min-w-0 px-3 pt-3 sm:px-4 lg:px-6"></div><div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-6">{usersOpen ? <UsersPage self={profile} onBack={() => setUsersOpen(false)} onPendingChange={setPendingUsers}/> : tab === 'rateio' ? <Suspense fallback={null}><RateioCteTab onToast={notify}/></Suspense> : pageView === 'profile' ? <ProfilePage user={auth.currentUser!} profile={profile} themeMode={themeMode} onThemeMode={setThemeMode} onBack={() => setPageView('dashboard')} onSignOut={onSignOut}/> : <><section className="view-heading"><div><h1>{tab === 'estoque' ? t('notes.in_stock_title') : t('notes.dispatched_title')}</h1><p>{t("notes.controle_de_recebimento_conferencia_e_movimentac")}</p></div></section><StatsPanel stats={stats} nfs={nfs} filters={filters} onStatus={onStatusFilter} onBranch={branch => { setTab('estoque'); setFilters(current => ({ ...current, filial: branch })); }}/ ><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-fg">{t("notes.notas_fiscais")}</h2><p className="mt-1 text-xs text-muted">{t("notes.acompanhe_conferencias_volumes_e_expedicoes")}</p></div><div role="group" aria-label={t("notes.visao_logistica")} className="segmented-tabs"><Button type="button" onClick={() => { setTab('estoque'); setCurrentPage(1); }} aria-pressed={tab === 'estoque'}><Boxes size={15} className="mr-1.5 inline"/>{t("notes.estoque")}</Button><Button type="button" onClick={() => { setTab('expedidas'); setCurrentPage(1); }} aria-pressed={tab === 'expedidas'}><Truck size={15} className="mr-1.5 inline"/>{t("notes.expedidas")}</Button></div></div>{(staleCount > 0 || filters.stale) && <button type="button" onClick={() => { setFilters(current => ({ ...current, stale: !current.stale })); setCurrentPage(1); }} aria-pressed={!!filters.stale} className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${filters.stale ? 'border-red-600 bg-red-600 text-white' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'}`}>{t('notes.stale_filter')}: {staleCount}</button>}{divergentCount > 0 && <button type="button" onClick={() => { setFilters(current => ({ ...current, divergent: !current.divergent })); setCurrentPage(1); }} aria-pressed={!!filters.divergent} className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${filters.divergent ? 'border-orange-600 bg-orange-600 text-white' : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300'}`}>{t('notes.divergent_filter')}: {divergentCount}</button>}<NfFilters filters={filters} onChange={value => { setFilters(value); setCurrentPage(1); }} branches={branchOptions}/><NfTable hasFilters={Boolean(filters.search || filters.startDate || filters.endDate || filters.status !== 'todos' || filters.filial || filters.stale || filters.divergent)} onClearFilters={() => setFilters({ search: '', startDate: '', endDate: '', status: 'todos', filial: '' })} loading={loading} staleById={staleById} divergentById={divergentTitleById} staleHours={config.staleHours} revealId={revealNfId} allowDelete={profile.role === 'admin'} nfs={shown} selected={selected} onSelect={selectId} onSelectAll={setSelected} onStatus={setStatusInline} onEdit={nf => { setEditing(nf); setFormOpen(true); }} onDelete={profile.role === 'admin' ? nf => setConfirm({ title: t('notes.confirm_delete_invoice'), message: t('notes.delete_invoice_message', { number: nf.numero }), danger: true, run: async () => { const result = await removeNf(nf.id); await commit(result, t('notes.invoice_deleted')); } }) : () => undefined} onDispatch={nf => setConfirm({ title: t('notes.confirm_dispatch'), message: t('notes.confirm_dispatch_message', { number: nf.numero }), run: async () => commit(await dispatch(nf.id), t('notes.invoice_dispatched')) })} onUndo={nf => setConfirm({ title: t('notes.confirm_reverse_dispatch'), message: `A nota fiscal ${nf.numero} voltará ao estoque.`, run: async () => commit(await undoDispatch(nf.id), t('notes.dispatch_reversed')) })} onPrint={print} sort={sort} onSort={key => setSort(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))}/><OldNfSearchPanel term={debouncedSearch} loaded={nfs} windowDays={config.windowDays ?? 90} onOpen={(nf, source) => { if (source === 'arquivada') { notify({ type: 'info', text: t('old_search.readonly_archived') }); return; } setEditing(nf); setFormOpen(true); }}/><Pagination page={currentPage} pages={pages} onPage={setCurrentPage}/><BulkActionBar count={selected.length} allowDelete={profile.role === 'admin'} members={config.teamMembers} onAction={action => void doBulk(action)} onClear={() => setSelected([])} onPrintLabels={() => { setLabelTargetNfs(nfs.filter(nf => selected.includes(nf.id))); setStandardLabelOpen(true); }} onAdvancedEditor={() => { setLabelTargetNfs(nfs.filter(nf => selected.includes(nf.id))); setLabelEditorOpen(true); }}/></> }</div></main><NfFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); setScannedKey(''); }} onSave={save} config={config} initial={editing} accessKey={scannedKey}/>{profile.role === 'admin' && <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} config={config} currentProfile={profile} archiveCount={archiveCount} archiveProgress={archiveProgress} onArchive={requestArchive}/>}{labelEditorOpen && <Suspense fallback={null}><LabelEditorModal open={labelEditorOpen} onClose={() => setLabelEditorOpen(false)} nfs={labelTargetNfs.length ? labelTargetNfs : nfs.filter(nf => selected.includes(nf.id))} onToast={notify}/></Suspense>}{standardLabelOpen && <StandardLabelPrintModal open={standardLabelOpen} nfs={labelTargetNfs.length ? labelTargetNfs : nfs.filter(nf => selected.includes(nf.id))} onClose={() => setStandardLabelOpen(false)} onAdvancedEditor={() => setLabelEditorOpen(true)} onToast={notify}/>}<ConfirmDialog open={confirm !== null} title={confirm?.title ?? ''} message={confirm?.message ?? ''} danger={confirm?.danger} onCancel={() => setConfirm(null)} onConfirm={() => { const task = confirm?.run; setConfirm(null); if (task) void task(); }}/><ToastView toast={toast} onClose={clear}/>{processing && <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify
 const { t } = useI18n();-center gap-2 bg-emerald-700 p-2 text-sm text-white"><Loader2 size={16} className="animate-spin"/>  {t("notes.importando_arquivos")}</div>}</div>;
}


// Alterna entre login e criação de conta antes da sessão existir.
function AuthFlow() {
 const [signingUp, setSigningUp] = useState(false);
 return signingUp ? <SignUpForm onBack={() => setSigningUp(false)}/> : <LoginPage onSignUp={() => setSigningUp(true)}/>;
}

export default function App() {
 const { user, loading, logout } = useAuth();
 const access = useCurrentUserProfile(user);
 const [, setAccessTick] = useState(0);
 const bumpAccess = useCallback(() => setAccessTick(value => value + 1), []);
 if (loading || (user && access.loading)) return <div className="grid min-h-[100dvh] place-items-center bg-bg"><Loader2 className="animate-spin text-emerald-500"/></div>;
 if (!user) return <AuthFlow/>;
 if (!access.profile || accessState({ emailVerified: user.emailVerified, profile: access.profile }) !== 'ativo') return <AccessGate user={user} onChange={bumpAccess}/>;
 return <ProfileProvider profile={access.profile}><Dashboard profile={access.profile} onSignOut={() => void logout()}/></ProfileProvider>;
}
