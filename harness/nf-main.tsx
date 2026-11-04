// Harness da janela da nota (so desenvolvimento, com mocks). Sem Firebase.
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '../src/styles/tokens.css';
import '../src/styles.css';
import '../src/redesign.css';
import '../src/styles/sidebar.css';
import '../src/styles/controls.css';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ToastProvider } from '../src/hooks/useToast';
import { NfFormModal } from '../src/components/nf/NfFormModal';
import { harnessConfig } from './configMock';

const params = new URLSearchParams(location.search);
if (params.get('theme') === 'dark') document.documentElement.classList.add('dark');

const KEY = '35261112345678000190550010000012341000012345';

function Harness() {
  return <ToastProvider>
    <NfFormModal open onClose={() => undefined} onSave={async () => undefined} config={harnessConfig} initial={null} accessKey={KEY} />
  </ToastProvider>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><I18nProvider><Harness /></I18nProvider></React.StrictMode>,
);
