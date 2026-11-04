import type { UserStatus } from '../types';

export type AccessState = 'semPerfil' | 'naoVerificado' | 'pendente' | 'desativado' | 'ativo';

// Perfis sem o campo `status` são cadastros antigos (criados no Console): seguem só o flag `ativo`, como as regras.
export function accessState(input: { emailVerified: boolean; profile: { ativo: boolean; status?: UserStatus } | null }): AccessState {
  const { emailVerified, profile } = input;
  if (!profile) return 'semPerfil';
  if (profile.status === undefined) return profile.ativo ? 'ativo' : 'desativado';
  if (profile.status === 'desativado') return 'desativado';
  if (!emailVerified) return 'naoVerificado';
  if (profile.status === 'ativo') return profile.ativo ? 'ativo' : 'desativado';
  return 'pendente';
}
