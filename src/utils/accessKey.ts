export function normalizeAccessKey(raw: string): string {
  const match = raw.match(/(?:^|\D)(\d{44})(?=\D|$)/);
  if (match?.[1]) return match[1];
  const digits = raw.replace(/\D/g, '');
  return digits.length > 44 ? digits.slice(-44) : digits;
}

export function nfNumberFromKey(key: string): string {
  const normalized = normalizeAccessKey(key);
  if (normalized.length !== 44) return '';
  return normalized.slice(25, 34).replace(/^0+/, '');
}

const UF_BY_IBGE: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

export interface ParsedAccessKey {
  key: string;
  cnpj: string;
  uf: string;
  ufCode: string;
  year: number;
  month: string;
  emissionMonth: string;
  cnpjEmitente: string;
  modelo: string;
  serie: string;
  numero: string;
  tpEmis: string;
  cNF: string;
  dv: string;
  dvValido: boolean;
}

/** Módulo 11 sobre os 43 primeiros dígitos (pesos 2 a 9, da direita para a esquerda). */
export function accessKeyCheckDigit(first43: string): number {
  let sum = 0;
  let weight = 2;
  for (let i = first43.length - 1; i >= 0; i -= 1) {
    sum += Number(first43[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

const formatCnpj = (digits: string) =>
  `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;

export function parseAccessKey(raw: string): ParsedAccessKey | null {
  const key = normalizeAccessKey(raw);
  if (key.length !== 44 || !/^\d{44}$/.test(key)) return null;
  const ufCode = key.slice(0, 2);
  const aamm = key.slice(2, 6);
  const year = 2000 + Number(aamm.slice(0, 2));
  const month = aamm.slice(2, 4);
  const modeloCode = key.slice(20, 22);
  const modelo = modeloCode === '55' ? '55 NF-e' : modeloCode === '65' ? '65 NFC-e' : modeloCode;
  const dv = key.slice(43, 44);
  return {
    key,
    cnpj: key.slice(6, 20),
    uf: UF_BY_IBGE[ufCode] ?? ufCode,
    ufCode,
    year,
    month,
    emissionMonth: `${month}/${year}`,
    cnpjEmitente: formatCnpj(key.slice(6, 20)),
    modelo,
    serie: String(Number.parseInt(key.slice(22, 25), 10)),
    numero: String(Number.parseInt(key.slice(25, 34), 10)),
    tpEmis: key.slice(34, 35),
    cNF: key.slice(35, 43),
    dv,
    dvValido: accessKeyCheckDigit(key.slice(0, 43)) === Number(dv),
  };
}
