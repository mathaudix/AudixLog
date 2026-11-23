# Análise de Código - AudixLog

> Relatório de falhas, bugs e melhorias identificadas durante a análise completa do código.

---

## Resumo Executivo

O projeto **AudixLog** é um painel web React/TypeScript para gestão de notas fiscais, conferência, expedição e impressão de etiquetas. A base de código é bem estruturada, usa TypeScript estrito, testes automatizados e regras Firestore robustas.

**Status geral**: ✅ **Código funcional e testado** - Todos os testes passam (`npm test` OK, `npx tsc --noEmit` sem erros).

---

## 🔴 Issues Críticas / Bugs Reais

### 1. **test-no-nested-components.mjs** - Path com encoding problemático (JÁ CORRIGIDO)
**Arquivo**: `scripts/test-no-nested-components.mjs`  
**Problema**: URL pathname retornava `%20` para espaços, causando `ENOENT` no Windows.  
**Correção aplicada**: Adicionado `decodeURIComponent()` na linha 7.  
**Status**: ✅ Corrigido localmente.

### 2. **useLabelEditor.ts** - `selectedIdsRef` desatualizado no `beginGesture`
**Arquivo**: `src/features/labels/useLabelEditor.ts` (linha 118)  
**Problema**: `selectedIds` (estado) vs `selectedIdsRef.current` (ref) - o hook usa `selectedIds` para decidir `isIsolated`, mas `selectedIdsRef` pode estar desatualizado em closures antigas.

```typescript
// Linha 117-118: usa selectedIds (estado) mas selectedIdsRef pode ser diferente
const isIsolated = selectedIds.includes(item.id) && selectedIds.length === 1;
```

**Impacto**: Comportamento inconsistente em seleções rápidas.  
**Correção recomendada**: Usar `selectedIdsRef.current` consistentemente.

---

## 🟠 Issues de Médio Risco

### 3. **nfRepository.ts** - Race condition em `bulkUpdate`
**Arquivo**: `src/services/nfRepository.ts` (linhas 136-150)  
**Problema**: A função processa em lotes de 450, mas usa `currentNfs` (snapshot) para gerar histórico. Se o documento for alterado entre a leitura e o commit do batch, o histórico registrará valores antigos incorretos.

```typescript
const indexed = new Map(currentNfs.map(nf => [nf.id, nf]));
// ...
batch.update(nfDocument(id), { ...scoped, historico: arrayUnion(entry(actionForChanges(changes), changes)) });
```

**Impacto**: Histórico impreciso em atualizações concorrentes.  
**Mitigação**: Baixa probabilidade (UI single-user), mas possível com múltiplas abas.

### 4. **archiveService.ts** - `createdDate` usa `dataExpedicao` para notas expedidas
**Arquivo**: `src/services/archiveService.ts` (linhas 9-17)  
**Problema**: Para notas com `status === 'expedido'`, usa `dataExpedicao` como data base para arquivamento (40 dias). Mas `dataExpedicao` pode ser nulo ou inconsistente.

```typescript
const value = data.status === 'expedido' ? data.dataExpedicao ?? data.createdAt : data.createdAt;
```

**Impacto**: Notas expedidas podem ser arquivadas prematuramente ou nunca arquivadas.  
**Correção**: Sempre usar `createdAt` como base, independente do status.

### 5. **LabelEditorModal.tsx** - Memory leak potencial em `fitCanvas`
**Arquivo**: `src/features/labels/LabelEditorModal.tsx` (linhas 60-64)  
**Problema**: `requestAnimationFrame` duplo aninhado sem cleanup garantido se componente desmontar rápido.

```typescript
useEffect(() => { if (!open) return; let inner = 0; const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(fitCanvas); }); return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); }; }, [open, format, fitCanvas]);
```

**Correção**: Usar `cancelAnimationFrame` apenas se IDs válidos, ou simplificar para um único frame.

### 6. **NfFormModal.tsx** - `applyKeyRef` pode chamar `lookupCnpj` duplicado
**Arquivo**: `src/components/nf/NfFormModal.tsx` (linhas 24, 33-34)  
**Problema**: `applyKeyRef.current` é atribuído no `useEffect` (linha 25) E no final do componente (linha 34). Se `open` mudar rapidamente, pode haver chamadas duplicadas.

```typescript
useEffect(() => { if (!open) return; if (initial) { setDraft({ ...initial }); return; } setDraft(emptyDraft()); if (accessKey) applyKeyRef.current(accessKey) }, [open, initial, accessKey]);
// ...
applyKeyRef.current = applyKey; // linha 34 - sobrescreve após o useEffect
```

**Impacto**: Consultas CNPJ duplicadas, toast de erro confuso.

---

## 🟡 Issues Menores / Code Smells

### 7. **nfFilters.ts** - `dateOf` fallback problemático para notas expedidas
**Arquivo**: `src/utils/nfFilters.ts` (linhas 4-12)  
**Problema**: Se `dataExpedicao` e `dataExpedicaoISO` forem nulos, cai para `nf.data` (data de entrada), não data de expedição.

```typescript
const dateOf = (nf: NotaFiscal): string => {
  if (logisticsStatus !== 'expedido') return nf.data;
  const value = nf.dataExpedicao;
  if (nf.dataExpedicaoISO) return nf.dataExpedicaoISO;
  // ... outros fallbacks ...
  return nf.data; // ← fallback incorreto para expedidas
};
```

**Impacto**: Filtro de data nas notas expedidas pode mostrar data errada.

### 8. **staleness.ts** - `toMillis` não trata `Timestamp` do Firestore corretamente em todos os casos
**Arquivo**: `src/utils/staleness.ts` (linhas 14-26)  
**Problema**: Verifica `toDate` mas não `seconds`/`nanoseconds` (formato serializado do Firestore).

```typescript
if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
  return (value as { toDate: () => Date }).toDate().getTime();
}
```

**Correção**: Adicionar verificação de `seconds` (já existe em `nfWindow.ts:createdDateOf` mas não aqui).

### 9. **parseAccessKey.ts** - Validação de UF pode falhar para códigos novos
**Arquivo**: `src/utils/accessKey.ts` (linhas 14-20)  
**Problema**: `UF_BY_IBGE` não inclui todos os códigos IBGE válidos (ex: 53 = DF está, mas códigos futuros não).

**Impacto**: Chaves válidas de UFs novos retornam código numérico em vez de sigla.

### 10. **RateioCteTab.tsx** - `notasRef` pode causar stale closure em `importar`
**Arquivo**: `src/features/rateio/RateioCteTab.tsx` (linhas 39-41)  
**Problema**: `notasRef.current = notasLidas` atualiza a ref, mas `importar` usa `notasRef.current` após `await` - se houver render intermediário, a ref pode estar desatualizada.

```typescript
const notasRef = useRef<NotaRateio[]>(notasLidas);
notasRef.current = notasLidas;
// ...
if (novas.length) update({ notas: [...notasRef.current, ...novas] });
```

**Correção**: Usar `draft.notas` diretamente do estado via `update` funcional.

---

## 🔵 Melhorias Sugeridas (Não-bugs)

### 11. **Testes de regras Firestore** - Falta `npm run test:rules` no CI
O script existe mas precisa de JDK 21 + emulador. Recomendado adicionar ao pipeline.

### 12. **Configuração `engines`** - Node 20.19+ mas CI pode usar versão diferente
`package.json` especifica `>=20.19.0`. Verificar se CI/CD usa versão compatível.

### 13. **Acessibilidade** - Vários componentes usam `div`/`span` onde `button` seria semântico
Ex: `ContextToolbar` botões, `StatusControl` menu items.

### 14. **Tratamento de erro em `xmlParser.ts`** - `parsererror` verificado mas namespace ignorado
**Arquivo**: `src/utils/xmlParser.ts` (linha 7)  
NF-e usa namespace padrão; `getElementsByTagName` funciona, mas `getElementsByTagNameNS` seria mais robusto.

### 15. **`labelPrintCore.ts`** - `abreviarFornecedor` regex pode remover parte do nome válido
**Arquivo**: `src/utils/labelPrintCore.ts` (linha 14)  
Regex remove prefixos como "COMERCIO DE", "INDUSTRIA E COMERCIO" - pode cortar nome real se fornecedor começar com essas palavras.

---

## 📋 Checklist de Correções Prioritárias

| Prioridade | Item | Arquivo | Esforço |
|------------|------|---------|---------|
| 🔴 Crítica | Fix `selectedIdsRef` em `useLabelEditor` | `useLabelEditor.ts` | Baixo |
| 🔴 Crítica | Fix race condition `bulkUpdate` histórico | `nfRepository.ts` | Médio |
| 🟠 Alta | Fix `createdDate` archive usar `createdAt` sempre | `archiveService.ts` | Baixo |
| 🟠 Alta | Fix `fitCanvas` memory leak | `LabelEditorModal.tsx` | Baixo |
| 🟠 Alta | Fix `applyKeyRef` duplicado | `NfFormModal.tsx` | Baixo |
| 🟡 Média | Fix `dateOf` fallback para expedidas | `nfFilters.ts` | Baixo |
| 🟡 Média | Fix `toMillis` para Timestamp serializado | `staleness.ts` | Baixo |
| 🟢 Baixa | Completar `UF_BY_IBGE` | `accessKey.ts` | Baixo |
| 🟢 Baixa | Fix `notasRef` stale closure | `RateioCteTab.tsx` | Baixo |

---

## ✅ Pontos Positivos do Código

1. **TypeScript Strict** - Zero erros de tipo
2. **Testes abrangentes** - 22 suites de teste passando
3. **Regras Firestore robustas** - Separação clara admin/operador, validação de campos
4. **Arquitetura limpa** - Separação services/hooks/components/utils
5. **i18n completo** - 525 chaves em PT/EN
6. **Histórico de alterações** - Auditoria completa no Firestore
7. **Editor de etiquetas avançado** - Snap guides, rotação, grupo, undo/redo
8. **Calibração de impressão** - Suporte a Argox OS-214 Plus com offset persistido

---

## 🚀 Próximos Passos Recomendados

1. Aplicar correções das issues 🔴 e 🟠 acima
2. Rodar `npm test` e `npm run typecheck` após cada correção
3. Executar `npm run test:rules` com emulador Firestore (requer JDK 21)
4. Testar fluxo completo: login → importar XML → conferir → expedir → imprimir etiqueta
5. Verificar acessibilidade com screen reader (NVDA/VoiceOver)

---

*Análise realizada em 2026-11-23 - AudixLog v0.91.0*