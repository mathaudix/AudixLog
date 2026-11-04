import React from 'react';
import ReactDOM from 'react-dom/client';
import '../src/styles.css';
import '../src/redesign.css';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ToastProvider } from '../src/hooks/useToast';
import RateioCteTab from '../src/features/rateio/RateioCteTab';

// Notas de exemplo para o preview (sem Firebase).


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <ToastProvider>
        <main className="min-h-screen bg-bg p-6"><RateioCteTab onToast={() => undefined} /></main>
      </ToastProvider>
    </I18nProvider>
  </React.StrictMode>,
);
