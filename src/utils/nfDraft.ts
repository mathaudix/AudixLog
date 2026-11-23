import type { NfDraft } from '../types';

/** Rascunho vazio da entrada de nota. Usado na abertura e após cada salvamento bem-sucedido. */
export const emptyDraft = (today: string = new Date().toISOString().slice(0, 10)): NfDraft => ({
  numero: '', fornecedor: '', data: today, volumes: 0, peso: 0, valor: 0, produtos: '', obs: '',
  chaveAcesso: '', filial: '', responsavel: '', statusConferencia: 'pendente', foto: null,
});

/**
 * Após salvar com sucesso, todos os campos voltam ao estado inicial para a próxima bipagem.
 * Se o salvamento falhar, o rascunho deve ser mantido (a função não é chamada).
 */
export function resetAfterSave(today?: string): NfDraft {
  return emptyDraft(today);
}
