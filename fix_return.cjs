const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const lines = content.split('\n');
const returnLineIdx = 116; // 0-indexed

// The new formatted return statement
const newReturn = `return (
  <div
    className="app-shell flex h-[100dvh] min-w-0 overflow-hidden"
    style={{
      '--sidebar-w': sidebarExpanded ? '240px' : '68px',
      '--sidebar-half': sidebarExpanded ? '120px' : '34px',
    } as React.CSSProperties)
  >
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3 focus:px-3 focus:py-1.5 focus:bg-primary focus:text-white focus:rounded focus:font-medium focus:text-sm"
    >
      {t('common.skipToContent')}
    </a>
    <Sidebar
      tab={tab}
      expanded={sidebarExpanded}
      onToggle={() => setSidebarExpanded((value) => !value)}
      onTab={(value) => {
        setTab(value);
        setCurrentPage(1);
        setPageView('dashboard');
        setUsersOpen(false);
      }}
      onRateio={() => {
        setTab('rateio');
        setPageView('dashboard');
        setUsersOpen(false);
      }}
      onUsers={profile.role === 'admin' ? () => setUsersOpen(true) : undefined}
      pendingUsers={pendingUsers}
      onSettings={profile.role === 'admin' ? () => setSettingsOpen(true) : () => undefined}
      onLabelEditor={() => {
        setSelected([]);
        setLabelTargetNfs([]);
        setLabelEditorOpen(true);
      }}
    />
    <main
      id="main-content"
      className={\`app-main flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto \${selected.length ? 'has-selection' : ''}\`}
    >
      <Header
        userName={profile.nome}
        userEmail={profile.email}
        onProfile={() => setPageView('profile')}
        onSignOut={onSignOut}
        themeMode={themeMode}
        onThemeMode={setThemeMode}
        onNew={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onImportXml={() => document.getElementById('xml-upload')?.click()}
        onExport={exportCurrent}
      />
      <input
        id="xml-upload"
        className="hidden"
        type="file"
        accept=".xml,text/xml"
        multiple
        onChange={(event) => void fileImport(event)}
      />
      <div className="mx-auto w-full max-w-[1600px] min-w-0 px-2.5 sm:px-3 lg:px-4">
        <div className="space-y-3 sm:space-y-4 p-2 sm:p-3 lg:p-4">
          {usersOpen ? (
            <UsersPage self={profile} onBack={() => setUsersOpen(false)} onPendingChange={setPendingUsers} />
          ) : tab === 'rateio' ? (
            <Suspense fallback={null}>
              <RateioCteTab onToast={notify} />
            </Suspense>
          ) : pageView === 'profile' ? (
            <ProfilePage
              user={auth.currentUser!}
              profile={profile}
              themeMode={themeMode}
              onThemeMode={setThemeMode}
              onBack={() => setPageView('dashboard')}
              onSignOut={onSignOut}
            />
          ) : (
            <>
              <section className="view-heading">
                <div>
                  <h1>{tab === 'estoque' ? t('notes.in_stock_title') : t('notes.dispatched_title')}</h1>
                  <p>{t('notes.controle_de_recebimento_conferencia_e_movimentac')}</p>
                </div>
              </section>
              <StatsPanel
                stats={stats}
                nfs={nfs}
                filters={filters}
                onStatus={onStatusFilter}
                onBranch={(branch) => {
                  setTab('estoque');
                  setFilters((current) => ({ ...current, filial: branch }));
                }}
              />
              <div className="flex items-center justify-between gap-2.5">
                <div>
                  <h2 className="text-sm font-semibold text-fg">{t('notes.notas_fiscais')}</h2>
                  <p className="mt-0.5 text-xs text-muted">{t('notes.acompanhe_conferencias_volumes_e_expedicoes')}</p>
                </div>
                <div role="group" aria-label={t('notes.visao_logistica')} className="segmented-tabs">
                  <Button
                    type="button"
                    onClick={() => {
                      setTab('estoque');
                      setCurrentPage(1);
                    }}
                    aria-pressed={tab === 'estoque'}
                  >
                    <Boxes size={15} className="mr-1.5 inline" />
                    {t('notes.estoque')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setTab('expedidas');
                      setCurrentPage(1);
                    }}
                    aria-pressed={tab === 'expedidas'}
                  >
                    <Truck size={15} className="mr-1.5 inline" />
                    {t('notes.expedidas')}
                  </Button>
                </div>
              </div>
              {(staleCount > 0 || filters.stale) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters((current) => ({ ...current, stale: !current.stale }));
                    setCurrentPage(1);
                  }}
                  aria-pressed={!!filters.stale}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm font-semibold " +
                    (filters.stale
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300')
                >
                  {t('notes.stale_filter')}: {staleCount}
                </button>
              )}
              {divergentCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters((current) => ({ ...current, divergent: !current.divergent }));
                    setCurrentPage(1);
                  }}
                  aria-pressed={!!filters.divergent}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm font-semibold " +
                    (filters.divergent
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300')
                >
                  {t('notes.divergent_filter')}: {divergentCount}
                </button>
              )}
              <NfFilters
                filters={filters}
                onChange={(value) => {
                  setFilters(value);
                  setCurrentPage(1);
                }}
                branches={branchOptions}
              />
              <NfTable
                hasFilters={
                  Boolean(
                    filters.search ||
                      filters.startDate ||
                      filters.endDate ||
                      filters.status !== 'todos' ||
                      filters.filial ||
                      filters.stale ||
                      filters.divergent
                  )
                }
                onClearFilters={() => setFilters({ search: '', startDate: '', endDate: '', status: 'todos', filial: '' })}
                loading={loading}
                staleById={staleById}
                divergentById={divergentTitleById}
                staleHours={config.staleHours}
                revealId={revealNfId}
                allowDelete={profile.role === 'admin'}
                nfs={shown}
                selected={selected}
                onSelect={selectId}
                onSelectAll={setSelected}
                onStatus={setStatusInline}
                onEdit={(nf) => {
                  setEditing(nf);
                  setFormOpen(true);
                }}
                onDelete={
                  profile.role === 'admin'
                    ? (nf) =>
                        setConfirm({
                          title: t('notes.confirm_delete_invoice'),
                          message: t('notes.delete_invoice_message', { number: nf.numero }),
                          danger: true,
                          run: async () => {
                            const result = await removeNf(nf.id);
                            await commit(result, t('notes.invoice_deleted'));
                          },
                        })
                    : () => undefined
                }
                onDispatch={(nf) =>
                  setConfirm({
                    title: t('notes.confirm_dispatch'),
                    message: t('notes.confirm_dispatch_message', { number: nf.numero }),
                    run: async () => commit(await dispatch(nf.id), t('notes.invoice_dispatched')),
                  })
                }
                onUndo={(nf) =>
                  setConfirm({
                    title: t('notes.confirm_reverse_dispatch'),
                    message: \`A nota fiscal \${nf.numero} voltará ao estoque.\`,
                    run: async () => commit(await undoDispatch(nf.id), t('notes.dispatch_reversed')),
                  })
                }
                onPrint={print}
                sort={sort}
                onSort={(key) =>
                  setSort((current) => ({
                    key,
                    direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
                  }))
                }
              />
              <OldNfSearchPanel
                term={debouncedSearch}
                loaded={nfs}
                windowDays={config.windowDays ?? 90}
                onOpen={(nf, source) => {
                  if (source === 'arquivada') {
                    notify({ type: 'info', text: t('old_search.readonly_archived') });
                    return;
                  }
                  setEditing(nf);
                  setFormOpen(true);
                }}
              />
              <Pagination page={currentPage} pages={pages} onPage={setCurrentPage} />
              <BulkActionBar
                count={selected.length}
                allowDelete={profile.role === 'admin'}
                members={config.teamMembers}
                onAction={(action) => void doBulk(action)}
                onClear={() => setSelected([])}
                onPrintLabels={() => {
                  setLabelTargetNfs(nfs.filter((nf) => selected.includes(nf.id)));
                  setStandardLabelOpen(true);
                }}
                onAdvancedEditor={() => {
                  setLabelTargetNfs(nfs.filter((nf) => selected.includes(nf.id)));
                  setLabelEditorOpen(true);
                }}
              />
            </>
          )}
        </div>
      </div>
    </main>
    <NfFormModal
      open={formOpen}
      onClose={() => {
        setFormOpen(false);
        setEditing(null);
        setScannedKey('');
      }}
      onSave={save}
      config={config}
      initial={editing}
      accessKey={scannedKey}
      canEditFiscal={profile.role === 'admin'}
    />
    {profile.role === 'admin' && (
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        currentProfile={profile}
        archiveCount={archiveCount}
        archiveProgress={archiveProgress}
        onArchive={requestArchive}
      />
    )}
    {labelEditorOpen && (
      <Suspense fallback={null}>
        <LabelEditorModal
          open={labelEditorOpen}
          onClose={() => setLabelEditorOpen(false)}
          nfs={labelTargetNfs.length ? labelTargetNfs : nfs.filter((nf) => selected.includes(nf.id))}
          onToast={notify}
        />
      </Suspense>
    )}
    {standardLabelOpen && (
      <StandardLabelPrintModal
        open={standardLabelOpen}
        nfs={labelTargetNfs.length ? labelTargetNfs : nfs.filter((nf) => selected.includes(nf.id))}
        onClose={() => setStandardLabelOpen(false)}
        onAdvancedEditor={() => setLabelEditorOpen(true)}
        onToast={notify}
      />
    )}
    <ConfirmDialog
      open={confirm !== null}
      title={confirm?.title ?? ''}
      message={confirm?.message ?? ''}
      danger={confirm?.danger}
      onCancel={() => setConfirm(null)}
      onConfirm={() => {
        const task = confirm?.run;
        setConfirm(null);
        if (task) void task();
      }}
    />
    <ToastView toast={toast} onClose={clear} />
    {processing && (
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 bg-emerald-700 p-2 text-sm text-white">
        <Loader2 size={16} className="animate-spin" />
        {t('notes.importando_arquivos')}
      </div>
    )}
  </div>
);`;

// Replace the return line
lines[returnLineIdx] = newReturn;

// Join and write
const newContent = lines.join('\n');
fs.writeFileSync('src/App.tsx', newContent);
console.log('File updated successfully');