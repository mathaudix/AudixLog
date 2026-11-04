# Design system do AudixLog

Fonte única de cor, raio, sombra e texto: `src/styles/tokens.css`. Componentes compartilhados: `src/components/ui/`.

## Tokens e mapeamento da paleta

| Token (Tailwind) | Valor claro | Uso |
|---|---|---|
| `bg` | #F0FDFF | fundo do app |
| `surface` | #FFFFFF | cards, topo, modais |
| `border` | #DCEAF0 | bordas de 1px |
| `fg` | #082F49 | texto principal |
| `muted` | #475569 | texto secundário |
| `tertiary` | #64748B | texto auxiliar, rótulos |
| `brand` | #082F49 | sidebar, títulos de marca |
| `primary` | #0E7490 | ações, links, foco, seleção |
| `subtle` | #BAE6FD | seleção, badges de informação |
| `success` | #22C55E | status OK / conferida / expedida |
| `warning` | #D97706 | pendente, avisos |
| `danger` | #DC2626 | divergente, erro, ação destrutiva |

No modo escuro, os mesmos nomes passam a apontar para tons de navy (fundo #051B2A, cartões #09283C) e para teal clareado (#4AB9D2) em texto e foco.

## Contraste medido (WCAG 2.x)

| Par | Razão | Resultado |
|---|---|---|
| Branco sobre teal #0E7490 | 5,36 | passa (texto normal ≥ 4,5) |
| Navy #082F49 sobre verde #22C55E | 6,09 | passa |
| Branco sobre verde #22C55E | 2,28 | **reprovado**: não usar |
| Teal #0E7490 sobre #F0FDFF | 5,15 | passa |
| Navy #082F49 sobre #F0FDFF | 13,35 | passa |
| Slate #475569 sobre branco | 7,58 | passa |
| Branco sobre vermelho #DC2626 | 4,83 | passa |
| Teal claro #4AB9D2 sobre #051B2A (escuro) | 7,66 | passa |
| #F0FDFF sobre #051B2A (escuro) | 16,88 | passa |

Regra: sobre verde, o texto é sempre navy.

## Tipografia

Fonte Inter (variável, self-hosted via `@fontsource-variable/inter`). Escala em classes Tailwind:

| Classe | Tamanho / altura | Uso |
|---|---|---|
| `text-display` | 24 / 1.2 | título de tela (PageHeader) |
| `text-h1` | 20 / 1.25 | valores de destaque em cards |
| `text-h2` | 16 / 1.3 | título de seção |
| `text-h3` | 14 / 1.35 | título de card |
| `text-body` | 14 / 1.5 | texto corrido |
| `text-small` | 13 / 1.45 | descrições, textos de apoio |
| `text-caption` | 11 / 1.35 | rótulos de coluna, metadados, selos |
| `font-mono` | JetBrains Mono | chaves de NF-e e códigos (componente `Mono`) |

## Quando usar cada botão

- **Primary**: a ação principal da tela (Importar, Salvar, Confirmar). Um por área.
- **Secondary**: ações comuns e de apoio (Exportar, Imprimir, Cancelar).
- **Soft**: ação de baixa ênfase dentro de cartões, com fundo teal suave.
- **Ghost**: ícones e ações discretas em barras e linhas de tabela.
- **Link**: ação de texto dentro de um parágrafo.
- **Danger**: só para excluir ou zerar, com confirmação. **Danger-ghost**: versão discreta para a mesma ação.

Tamanhos: `sm` (32 px), `md` (36 px, padrão), `lg` (40 px). Use `iconOnly` com `aria-label`.

## Componentes (`src/components/ui/system.tsx`)

- `PageHeader`: título, descrição e ações de cada tela.
- `Card`: superfície padrão, com cabeçalho opcional.
- `StatusPill` (tons `neutral`, `primary`, `info`, `success`, `warning`, `danger`): status de NF, destinos do rateio, avisos.
- `DataTable`: cabeçalho e linhas padronizados; `empty` para estado vazio.
- `EmptyState`, `Skeleton`, `Mono`.
- `Button`, `Input`, `Select`, `Textarea` (em `Button.tsx` e `Controls.tsx`), `Modal`, `ConfirmDialog`, `Toast`, `Tooltip`.

Vitrine de conferência: `harness/design-main.tsx` (somente desenvolvimento, fora do build de produção).

## Regras

1. Nunca escreva cor hexadecimal em componente. Use um token.
2. Vermelho e âmbar são só semânticos (erro, divergência, aviso). Não use vermelho como destaque de marca.
3. Sobre verde, texto navy. Nunca branco.
4. Cartões usam `rounded-card` (12 px) e bordas de 1 px. Controles usam `rounded-control` (8 px).
5. Dark mode vem dos tokens; não crie variante `dark:` com cor fixa.
6. Exceções permitidas: cores de impressão de etiquetas (editor), relatório de impressão, arte SVG da tela de login.

## Contagem de cores soltas

- Antes: 116 valores hexadecimais em `src` (fora de `tokens.css`).
- Depois: 17, todos na arte SVG `AuthBackdrop.tsx`, e cerca de 59 no editor de etiquetas e na impressão, que ficam como exceção.

## Componentes novos (etapa 2)

Em `src/components/ui/`:

- `IconButton`: tamanhos 36px (`md`) e 32px (`sm`, para cards). `aria-label` é obrigatório. Usado no X do `Modal` e no botão da câmera da janela da nota.
- `Checkbox`: rótulo obrigatório, foco visível, estado de erro.
- `Switch`: `role="switch"`, `aria-checked`, foco visível, tokens e dark.
- `Tabs`: variantes `segmented` e `underline`, navegação por setas, Home e End; o foco acompanha a aba selecionada (padrão WAI-ARIA).

Escala de controles: campos e botões em 36px com fonte de 14px. A exceção é o campo da chave de acesso, em fonte mono e 16px, com altura de 40px.

## Telas migradas

- Configurações (`SettingsModal`): seletor de idioma em `ui-input` 14px/36px; X do modal em `IconButton`.
- Janela da nota (`NfFormModal`): 22 controles em 14px/36px (eram 17 em 13px/38px); botões em 36px; a grade de cada seção fecha as linhas em desktop, tablet e celular (medido com `scripts/measure-nf-grid.mjs`).
- Limpeza de i18n: chave `destination.series_optional` removida (pt e en), sem uso no código. As demais chaves do recurso de destino pelo CNPJ já tinham sido removidas.

Print: `preview_etapa2_v78.png` (Configurações e janela da nota, claro em cima, escuro embaixo). Gerado por `scripts/capture-etapa2-preview.mjs` e `scripts/compose-etapa2-preview.py`.

## Contagem de cores soltas

- Antes (v77): 104 valores hexadecimais (número da rodada anterior).
- Depois (v78): 138 valores hexadecimais em `src/` (`.css`, `.ts`, `.tsx`), excluindo `src/i18n` e arquivos com "print" no nome. Essa contagem não foi reconciliada com o método que gerou 104; a comparação direta está pendente.

## O que falta migrar (etapa 2)

- Usuários/perfil (`ProfilePage` e telas de usuários): ainda usam classes Tailwind de cor (slate/zinc/blue).
- Histórico (`NfHistoryTimeline`): ainda usa classes de status antigas.
- Painel de estatísticas (`stats`): restante fora dos componentes novos.
- Casca do editor de etiquetas (painéis, toolbar, barras flutuantes): mantém cores próprias. As cores de impressão da etiqueta ficam como exceção.
- Sidebar e topo: migração completa para `Button`/`Tooltip` ainda não feita em todos os ícones.
- Rota de vitrine: só no harness de desenvolvimento, sem atalho no menu.
