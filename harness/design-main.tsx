// Vitrine dos componentes (so desenvolvimento). Mostra light e dark lado a lado.
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '../src/styles/tokens.css';
import '../src/styles.css';
import '../src/redesign.css';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { DesignShowcase } from '../src/components/ui/DesignShowcase';

function Panel({ dark }: { dark: boolean }) {
  return (
    <div className={dark ? 'dark' : ''} style={{ minWidth: 0, flex: 1 }}>
      <div className="min-h-screen bg-bg text-fg">
        <DesignShowcase />
      </div>
    </div>
  );
}

const mode = new URLSearchParams(location.search).get('mode');
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      {mode === 'light' || mode === 'dark' ? (
        <Panel dark={mode === 'dark'} />
      ) : (
        <div style={{ display: 'flex', gap: 0 }}>
          <Panel dark={false} />
          <Panel dark />
        </div>
      )}
    </I18nProvider>
  </React.StrictMode>,
);
