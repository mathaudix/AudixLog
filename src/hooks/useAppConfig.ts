import { useEffect, useState } from 'react';
import { DEFAULT_CONFIG } from '../constants';
import type { AppConfig } from '../types';
import { subscribeConfig } from '../services/configRepository';
import { useToast } from './useToast';
export function useAppConfig(enabled: boolean) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG); const { notify } = useToast();
  useEffect(() => { if (!enabled) return; return subscribeConfig(setConfig, error => notify({ type: 'error', text: `Erro de configuração: ${error.message}` })); }, [enabled, notify]);
  return { config, setConfig };
}
