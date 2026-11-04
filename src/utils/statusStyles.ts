import type React from 'react';
import type { StatusConferencia, StatusLogistico } from '../types';
import { branchHex } from '../constants/branchColors';

export type AudixStatus = StatusConferencia | StatusLogistico | 'expedidas' | 'desconhecido';
export interface StatusStyle { label: string; classes: string; dot: string; hex: string }

export const STATUS_STYLES: Record<AudixStatus, StatusStyle> = {
  pendente: { label: 'Pendente', classes: 'bg-warning/15 text-warning border-warning/30', dot: 'bg-warning', hex: 'var(--chart-pending)' },
  conferida: { label: 'Conferida', classes: 'bg-success/20 text-brand border-success/40', dot: 'bg-success', hex: 'var(--chart-ok)' },
  divergente: { label: 'Divergente', classes: 'bg-danger/10 text-danger border-danger/30', dot: 'bg-danger', hex: 'rgb(var(--color-danger))' },
  recebido: { label: 'Recebido', classes: 'bg-subtle text-brand border-primary/25', dot: 'bg-primary', hex: 'rgb(var(--color-primary))' },
  expedido: { label: 'Expedido', classes: 'bg-primary/10 text-primary border-primary/25', dot: 'bg-primary', hex: 'rgb(var(--color-primary))' },
  expedidas: { label: 'Expedidas', classes: 'bg-primary/10 text-primary border-primary/25', dot: 'bg-primary', hex: 'rgb(var(--color-primary))' },
  desconhecido: { label: 'Desconhecido', classes: 'bg-bg text-muted border-border', dot: 'bg-tertiary', hex: 'rgb(var(--color-tertiary))' },
};

export function getStatusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status as AudixStatus] ?? { ...STATUS_STYLES.desconhecido, label: status || 'Desconhecido' };
}

export const STATUS_ICON_TONE: Record<AudixStatus, string> = {
  pendente: '!text-warning',
  conferida: '!text-success',
  divergente: '!text-danger',
  recebido: '!text-primary',
  expedido: '!text-primary',
  expedidas: '!text-success',
  desconhecido: '!text-tertiary',
};

export function getStatusIconTone(status: string): string {
  return STATUS_ICON_TONE[status as AudixStatus] ?? STATUS_ICON_TONE.desconhecido;
}

export function branchChipStyle(code: string): React.CSSProperties {
  return { '--chip': branchHex(code) } as React.CSSProperties;
}
