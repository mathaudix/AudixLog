import React from 'react';
import ReactDOM from 'react-dom/client';
import '../src/styles.css';
import '../src/redesign.css';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ToastProvider } from '../src/hooks/useToast';
import LabelEditorModal from '../src/features/labels/LabelEditorModal';
import { ProfileProvider } from '../src/hooks/useCurrentUserProfile';
import type { NotaFiscal } from '../src/types';

const nfs = [
  { numero: '000123', fornecedor: 'FORNECEDOR EXEMPLO LTDA', filial: '03', chaveAcesso: '35260912345678000190550010001231231000012345', volumes: 4, peso: 12.5, valor: 1500 },
] as unknown as NotaFiscal[];

function Harness() {
  return (
    <ProfileProvider profile={{ uid: 'harness-user', email: 'harness@local', nome: 'Harness', role: 'admin', ativo: true } as never}>
      <ToastProvider>
        <LabelEditorModal open onClose={() => undefined} nfs={nfs} onToast={toast => console.log('TOAST', toast.text)} />
      </ToastProvider>
    </ProfileProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><I18nProvider><Harness /></I18nProvider></React.StrictMode>,
);
