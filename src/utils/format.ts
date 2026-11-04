export function formatCurrency(value: unknown): string {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(numeric) ? numeric : 0);
}
export function formatDateDisplay(value: unknown): string {
  if (!value) return '';
  const text = String(value); const parts = text.split('-');
  return parts.length !== 3 ? text : `${parts[2]}/${parts[1]}/${parts[0]}`;
}
export function formatDateTime(value: unknown): string {
  if (!value) return '-';
  let date: Date;
  if (typeof value === 'object' && value !== null && 'seconds' in value && typeof value.seconds === 'number') date = new Date(value.seconds * 1000);
  else date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
export function getLocalDateISO(): string {
  const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
export function parseDateBR(dateValue: unknown): string {
  if (dateValue === null || dateValue === undefined || String(dateValue).trim() === '') return getLocalDateISO();
  const text = String(dateValue).trim();
  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number.parseFloat(text); const date = new Date(new Date(1899, 11, 30).getTime() + serial * 86400000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  if (text.includes('/')) {
    const parts = text.split(' ')[0]?.split('/') ?? [];
    if (parts.length === 3) { let [day = '', month = '', year = ''] = parts; if (day.length === 4) return `${day}-${month.padStart(2, '0')}-${year.padStart(2, '0')}`; if (year.length === 2) year = `20${year}`; return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; }
  }
  if (text.includes('-')) {
    const parts = text.split(' ')[0]?.split('-') ?? [];
    if (parts.length === 3) { const [first = '', second = '', third = ''] = parts; if (first.length === 4) return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`; if (third.length === 4) return `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`; }
  }
  return text;
}
