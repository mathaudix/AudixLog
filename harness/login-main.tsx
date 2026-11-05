// Harness da tela de login (so desenvolvimento, com mocks). Sem Firebase.
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/kaushan-script/latin-400.css';
import '../src/styles/tokens.css';
import '../src/styles.css';
import '../src/redesign.css';
import '../src/styles/sidebar.css';
import '../src/styles/controls.css';
import '../src/styles/states.css';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { LoginPage } from '../src/components/auth/LoginPage';

const params = new URLSearchParams(location.search);
if (params.get('theme') === 'dark') document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <LoginPage onSignUp={() => undefined} />
    </I18nProvider>
  </React.StrictMode>,
);
