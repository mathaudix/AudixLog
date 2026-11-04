import { pt } from '../i18n/pt';
import { en } from '../i18n/en';
import { Component, type ErrorInfo, type ReactNode } from 'react';

function boundaryT(path: string): string {
  const lang = localStorage.getItem('audix.lang');
  const dict = lang === 'en-US' ? en : pt;
  const value = path.split('.').reduce<unknown>((current, key) => (
    current && typeof current === 'object'
      ? (current as Record<string, unknown>)[key]
      : undefined
  ), dict);
  return typeof value === 'string' ? value : path;
}

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(boundaryT('errors.unhandled_interface_error'), error, info.componentStack);
  }
  render(): ReactNode {
    if (this.state.error) return <main className="grid min-h-[100dvh] place-items-center bg-bg p-6 text-fg"><section className="max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-lg dark:border-red-900 dark:bg-zinc-900"><h1 className="text-lg font-bold">{boundaryT('ui.o_sistema_encontrou_um_erro')}</h1><p role="alert" className="mt-3 break-words text-sm">{this.state.error.message || (boundaryT('errors.unexpected_error'))}</p><button type="button" className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white" onClick={() => window.location.reload()}>Recarregar página</button></section></main>;
    return this.props.children;
  }
}
