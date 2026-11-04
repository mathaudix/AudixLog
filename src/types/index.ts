export type StatusConferencia = 'pendente' | 'conferida' | 'divergente';
export type StatusLogistico = 'recebido' | 'expedido';
export interface NotaFiscal {
  id: string; numero: string; fornecedor: string; data: string;
  volumes: number; peso: number; valor: number; pesoConferido?: number; volumesConferidos?: number; produtos?: string; obs?: string;
  chaveAcesso?: string; serie?: string; cnpjEmitente?: string; cnpjDestinatario?: string; filial?: string; responsavel?: string;
  statusConferencia: StatusConferencia; status: StatusLogistico;
  foto?: string | null; createdAt?: Date | { seconds: number } | string | null;
  dataExpedicao?: Date | { seconds: number } | string | null; dataExpedicaoISO?: string | null; historico?: HistoryEntry[];
}
export type UserRole = 'admin' | 'operador';
export type UserStatus = 'pendente' | 'ativo' | 'desativado';
// status ausente = cadastro antigo (criado no Console), que segue só o flag ativo.
export interface UserProfile { uid: string; email: string; nome: string; role: UserRole; ativo: boolean; status?: UserStatus; criadoEm?: Date | null }
export type HistoryAction = 'criada' | 'editada' | 'status' | 'responsavel' | 'expedida' | 'estorno_expedicao' | 'importada' | 'arquivada';
export interface HistoryChange { field: string; from: string; to: string }
export interface HistoryEntry { at: import('firebase/firestore').Timestamp; uid: string; email: string; nome?: string; action: HistoryAction; changes?: HistoryChange[] }
export interface AppConfig { teamMembers: string[]; branchMap: Record<string, string>; staleHours: number; weightTolerancePct: number; volumeTolerance: number; windowDays?: number }
export interface Filters { search: string; startDate: string; endDate: string; status: StatusConferencia | 'todos'; filial: string; stale?: boolean; divergent?: boolean }
export interface SortConfig { key: keyof NotaFiscal; direction: 'asc' | 'desc' }
export type BulkAction =
  | { type: 'dispatch' }
  | { type: 'status'; value: StatusConferencia }
  | { type: 'assignee'; value: string }
  | { type: 'delete' };
export interface Toast { type: 'success' | 'error' | 'info'; text: string }
export type Result<T> = { ok: true; data: T } | { ok: false; error: Error };
export interface NfStats { totalEstoque: number; expedidas: number; pendentesConf: number; conferidas: number; divergentes: number }
export interface FilialStat { label: string; value: number; colorClass: string }
export interface ImportSummary { success: number; duplicates: number; errors: number }
export interface NfDraft extends Omit<NotaFiscal, 'id' | 'createdAt' | 'status' | 'statusConferencia'> {
  status?: StatusLogistico; statusConferencia?: StatusConferencia; cnpjError?: boolean;
}
