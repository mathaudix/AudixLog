import { useCallback, useState } from 'react';
import type { AppConfig, ImportSummary, NotaFiscal } from '../types';
import { buildDuplicateIndex, isDuplicate, addToDuplicateIndex } from '../utils/duplicates';
import { parseNFeXml } from '../utils/xmlParser';
import { parseAccessKey } from '../utils/accessKey';
import { branchFromDest } from '../utils/destination';
import { getLocalDateISO } from '../utils/format';
import { createNf, findNfByChave } from '../services/nfRepository';
import { useToast } from './useToast';
export function useImport(nfs: NotaFiscal[], config: AppConfig) {
  const [processing, setProcessing] = useState(false); const { notify } = useToast();
  const importFiles = useCallback(async (files: File[], kind: 'xml', responsible: string): Promise<ImportSummary> => {
    setProcessing(true); const summary: ImportSummary = { success: 0, duplicates: 0, errors: 0 }; const index = buildDuplicateIndex(nfs);
    try {
      for (const file of files) {
        try {
          if (kind === 'xml') {
            const parsed = parseNFeXml(await file.text());
            const keyInfo = parseAccessKey(parsed.chave); const nf: Omit<NotaFiscal, 'id'> = { cnpjDestinatario: parsed.cnpjDest, cnpjEmitente: parsed.cnpjEmit, serie: keyInfo?.serie ?? '', numero: parsed.numero, fornecedor: parsed.fornecedor, chaveAcesso: parsed.chave, volumes: parsed.volumes, peso: parsed.peso, valor: parsed.valor, produtos: parsed.produtos, filial: branchFromDest(parsed.cnpjDest, config.branchMap) || config.branchMap[parsed.cnpjEmit] || '', status: 'recebido', statusConferencia: 'pendente', data: getLocalDateISO(), obs: 'Importado via XML', responsavel: responsible, foto: null };
            await persist(nf, index, summary);
          }
        } catch { summary.errors += 1; }
      }
    } finally { setProcessing(false); }
    const msg = `${summary.success} XML(s) importado(s) com sucesso!${summary.duplicates ? ` (${summary.duplicates} duplicados ignorados)` : ''}${summary.errors ? ` (${summary.errors} erros)` : ''}`;
    notify({ type: summary.success ? 'success' : 'error', text: summary.success || summary.duplicates ? msg : 'Erro ao importar arquivos.' });
    return summary;
  }, [nfs, config, notify]);
  return { processing, importFiles };
}
async function persist(nf: Omit<NotaFiscal, 'id'>, index: ReturnType<typeof buildDuplicateIndex>, summary: ImportSummary): Promise<void> {
  if (!nf.numero || isDuplicate(index, nf) || (nf.chaveAcesso && await findNfByChave(nf.chaveAcesso))) { summary.duplicates += 1; return; }
  const result = await createNf(nf, 'importada');
  if (!result.ok) { summary.errors += 1; return; }
  addToDuplicateIndex(index, nf); summary.success += 1;
}
