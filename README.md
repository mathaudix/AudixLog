# AudixLOG

Painel web para gestão de notas fiscais, conferência, expedição e impressão de etiquetas. Stack: React 18, TypeScript strict, Vite, Tailwind CSS e Firebase modular.

## Pré-requisitos e execução local

- Node.js 20 ou superior e npm.
- Projeto Firebase com Authentication (provedor E-mail/senha) e Cloud Firestore habilitados.

```sh
npm install
npm run dev
npm run typecheck
npm run build
npm test
```

Configure as variáveis Firebase no `.env` (use `.env.example` como modelo). Variáveis `VITE_*` são públicas e não devem conter segredos de servidor.

| Variável | Obrigatória | Uso |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Sim | Chave pública Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sim | Domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | Sim | Identificador do projeto |
| `VITE_FIREBASE_STORAGE_BUCKET` | Não | Bucket Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Não | Sender ID |
| `VITE_FIREBASE_APP_ID` | Sim | App ID Firebase |
| `VITE_APP_ID` | Não | Namespace dos dados; padrão `martins-sp-control` |

## Primeiro acesso

1. No Console Firebase, abra **Authentication → Sign-in method** e ative **E-mail/senha**.
2. Em **Authentication → Users**, crie o usuário inicial com e-mail e senha.
3. Copie o UID desse usuário.
4. **Antes de publicar as regras**, no Firestore crie o documento `artifacts/martins-sp-control/public/data/allowed_users/{UID}` (substitua `{UID}` pelo UID real), com `email` (string), `nome` (string), `role` igual a `admin` e `ativo` igual a `true`.
5. Instale Firebase CLI e autentique:

   ```sh
   npm install -g firebase-tools
   firebase login
   ```

6. Na raiz do projeto, publique as regras e o app (ver [Publicar](#publicar)).

O primeiro administrador deve existir antes das regras restritivas. Cadastros adicionais são feitos pelo administrador em **Configurações → Acesso de usuários**; cada usuário também deve existir em Authentication.

## Arquivamento manual

Administradores podem abrir **Configurações → Arquivar NFs antigas** para consultar a quantidade elegível e confirmar. O critério herdado é `createdAt` (ou `data` se `createdAt` não estiver disponível) com idade de **40 dias ou mais**. O processo manual informa progresso e falhas por NF. Uma transação transfere cada NF para `artifacts/{appId}/public/data/history_nfs/{mesmoId}`; se o destino já existir, remove somente a origem, evitando duplicatas. Não usa Cloud Functions nem exige Blaze.

## Histórico de alterações

Criação, importação, edição, status, responsável, expedição e estorno acrescentam eventos ao array `historico`. A linha do tempo na linha expandida ordena do mais recente para o mais antigo e mostra e-mail, data/hora e alterações. Fotos são descritas como “foto alterada”; o Base64 não é incluído no diff. O arquivamento acrescenta o evento `arquivada`.

## Etiquetas e coleções

O editor oferece formatos 100×150, 150×100, 100×50 e 100×30 dupla, variáveis `{NUMERO}`, `{FILIAL}`, `{FORNECEDOR}`, `{CHAVE}`, `{VOL}`, `{TOTAL_VOL}`, modelos salvos no Firestore e impressão. Coleções: `artifacts/{appId}/public/data/nfs`, `history_nfs`, `savedLabelsAdvanced`, `settings/config` e `allowed_users`.

## Verificação de layout do editor

`npm run check:layout` compila o harness do editor e confere, em 1920×1080 e 1366×768 (claro e escuro), que o painel de elementos, o canvas e o painel "Etiqueta" estão lado a lado, com o painel direito à direita do canvas e no mesmo topo. Falha com código de saída 1 se a ordem quebrar. Requer Playwright com Chromium instalado (`npx playwright install chromium`). Para usar outro binário de Chromium, defina `CHROMIUM_PATH`.

## Publicar

```sh
npm install
npm test
firebase deploy --only firestore:rules
npm run deploy
```

- `npm test` roda os testes de layout das etiquetas, do editor, de chave de acesso, de destino, de defasagem, de divergência e de componentes aninhados.
- `firebase deploy --only firestore:rules` publica as regras do Firestore. Rode quando `firestore.rules` mudar.
- `npm run deploy` gera o build (`dist/`) e publica somente o **Firebase Hosting** (`firebase.json` aponta `hosting.public` para `dist`). Não há Cloud Functions neste projeto.
- Depois do deploy, aperte **Ctrl+F5** para carregar a versão nova sem cache.

## Usuários e acesso

- **Autocadastro:** na tela de login, "Criar conta" pede nome, e-mail e senha (mínimo 8 caracteres). O sistema envia um e-mail de confirmação.
- **Confirmação:** enquanto o e-mail não for confirmado, a pessoa vê a tela "Confirme seu e-mail", com reenvio (intervalo de 60 s).
- **Aprovação:** depois de confirmar, o cadastro fica "Aguardando aprovação do administrador". Ao ser aprovado, a tela libera o acesso sozinha.
- **Tela Usuários:** só para administradores, no menu lateral. Lista os usuários com status e papel, e permite aprovar, desativar, reativar, tornar admin ou remover admin.
- **Perfis antigos:** usuários criados antes desta versão (sem o campo de status) continuam funcionando só pelo flag "ativo", sem exigir confirmação de e-mail.

**No Firebase Console:**
1. Authentication › Sign-in method: ative **E-mail/senha**.
2. Authentication › Templates: idioma **Português (Brasil)**, nome do remetente **AudixLog**. O e-mail sai de `noreply@<projeto>.firebaseapp.com` e pode cair no spam.
3. Authentication › Settings › Authorized domains: inclua `gestaoaudixlog.web.app` e `localhost`.
4. Publique as regras com `npm run deploy:rules`.

## Impressora Argox OS-214 Plus

Etiquetas 100x30 em duas colunas (bobina de 110 mm de liner, etiquetas de 50 × 30 mm, vão de 3,5 mm).

**No driver da impressora** (Preferências de impressão > Página/Stock):
1. Crie um papel personalizado de **106 × 30 mm** (largura × altura).
2. Tipo de mídia: **Etiqueta com vão** (gap/web), com **3 mm** de vão.
3. Orientação: **Retrato**. Velocidade e escuridão: padrão da impressora.

**No Chrome, na janela de impressão:**
- Destino: **Argox OS-214 Plus**
- Tamanho do papel: o personalizado (106 × 30 mm)
- Margens: **Nenhuma**
- Escala: **100**
- Cabeçalhos e rodapés: **desmarcado**

**Calibração:** em **Configurações > Calibração de impressão**, clique em **Imprimir teste de calibração**. A página mostra a moldura de cada etiqueta e uma régua em mm. Se a moldura não encostar na borda da etiqueta, ajuste o **X** do formato 100x30 (2 colunas) em passos de 0,5 mm. O valor fica salvo neste computador.

