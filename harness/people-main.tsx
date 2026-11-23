// Harness de Perfil, Usuarios e Historico (so desenvolvimento, com mocks). Sem Firebase.
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '../src/styles/tokens.css';
import '../src/styles.css';
import '../src/redesign.css';
import '../src/styles/sidebar.css';
import '../src/styles/controls.css';
import '../src/styles/states.css';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ToastProvider } from '../src/hooks/useToast';
import { ProfilePage } from '../src/components/profile/ProfilePage';
import { UsersPage } from '../src/components/settings/UsersPage';
import { NfHistoryTimeline } from '../src/components/nf/NfHistoryTimeline';
import type { UserProfile, HistoryEntry } from '../src/types';

const params = new URLSearchParams(location.search);
if (params.get('theme') === 'dark') document.documentElement.classList.add('dark');
const view = params.get('view') ?? 'profile';

const self = { uid: 'harness-user', email: 'harness@local', nome: 'Harness Admin', role: 'admin', ativo: true, status: 'ativo' } as unknown as UserProfile;
const user = { uid: 'harness-user', email: 'harness@local', metadata: { creationTime: '2026-01-10T12:00:00Z', lastSignInTime: '2026-11-04T10:00:00Z' } } as unknown as Parameters<typeof ProfilePage>[0]['user'];

const history = [
  { uid: 'a', nome: 'Ana', email: 'ana@local', action: 'criada', at: new Date(Date.now() - 3600_000 * 5), changes: [] },
  { uid: 'b', nome: 'Bruno', email: 'bruno@local', action: 'status', at: new Date(Date.now() - 3600_000 * 2), changes: [{ field: 'status', from: 'pendente', to: 'conferida' }] },
  { uid: 'c', nome: 'Carla', email: 'carla@local', action: 'expedida', at: new Date(Date.now() - 600_000), changes: [] },
  { uid: 'd', nome: 'Diego', email: 'diego@local', action: 'arquivada', at: new Date(Date.now() - 86400_000 * 3), changes: [] },
] as unknown as HistoryEntry[];

function Harness() {
  if (view === 'users') {
    return <div className="mx-auto max-w-4xl p-5"><UsersPage self={self} onBack={() => undefined} /></div>;
  }
  if (view === 'history') {
    return <div className="mx-auto max-w-2xl p-5"><NfHistoryTimeline entries={history} /></div>;
  }
  return <ProfilePage user={user} profile={self} themeMode={params.get('theme') === 'dark' ? 'dark' : 'light'} onThemeMode={() => undefined} onBack={() => undefined} onSignOut={() => undefined} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <ToastProvider>
        <Harness />
      </ToastProvider>
    </I18nProvider>
  </React.StrictMode>,
);
