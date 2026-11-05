// Harness de Configuracoes e dialogo da nota (so desenvolvimento, com mocks). Sem Firebase.
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
import { SettingsModal } from '../src/components/settings/SettingsModal';
import { harnessConfig } from './configMock';
import type { UserProfile } from '../src/types';

const params = new URLSearchParams(location.search);
if (params.get('theme') === 'dark') document.documentElement.classList.add('dark');

const profile = { uid: 'harness-user', email: 'harness@local', nome: 'Harness', role: 'admin', ativo: true } as unknown as UserProfile;

function Harness() {
  return <ToastProvider>
    <SettingsModal open onClose={() => undefined} config={harnessConfig} currentProfile={profile} archiveCount={0} archiveProgress={null} onArchive={() => undefined} />
  </ToastProvider>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><I18nProvider><Harness /></I18nProvider></React.StrictMode>,
);
