# Guia de configuração

Tudo aqui usa planos gratuitos. Os comandos são executados na raiz do repositório, exceto quando indicado.

## 1. Rodar no seu computador

Pré-requisitos: [Node.js 22+](https://nodejs.org) e pnpm (`npm install -g pnpm`).

```bash
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

Edite `apps/api/.dev.vars`:

| Variável | Valor |
|---|---|
| `ALLOWED_EMAIL` | seu e-mail Google |
| `ENCRYPTION_KEY` | resultado de `openssl rand -base64 32` |
| `DEV_LOGIN` | `true` (habilita o botão "Entrar (modo desenvolvimento)") |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | opcionais localmente; preencha após o passo 3 para testar o login real |

```bash
pnpm db:migrate:local   # cria o banco local
pnpm dev                # API em :8787 e app em :5173
```

Abra http://localhost:5173.

Outros comandos úteis: `pnpm test`, `pnpm typecheck`, `pnpm check` (lint), `pnpm format`.

## 2. Cloudflare (hospedagem, API e banco)

1. Crie uma conta gratuita em https://dash.cloudflare.com/sign-up.
2. Entre pelo terminal e crie o banco:

   ```bash
   cd apps/api
   npx wrangler login
   npx wrangler d1 create task-manager
   ```

3. Copie o `database_id` exibido para `apps/api/wrangler.jsonc` (campo `d1_databases[0].database_id`).
4. Publique pela primeira vez para descobrir a URL do app:

   ```bash
   cd ../..
   pnpm db:migrate:remote
   pnpm run deploy
   ```

   A URL será algo como `https://task-manager.<seu-subdominio>.workers.dev`.
5. Em `apps/api/wrangler.jsonc`, troque `APP_URL` por essa URL.

## 3. Google Cloud (login com Google)

1. Acesse https://console.cloud.google.com e crie um projeto chamado **Task Manager**.
2. Abra **Google Auth Platform** (menu "APIs e serviços" → "Tela de consentimento OAuth"):
   - **Branding**: nome do app "Task Manager" e seu e-mail como suporte.
   - **Público-alvo (Audience)**: tipo **Externo**. Depois clique em **Publicar app** para passar de "Teste"
     para **Em produção**. Em modo de teste o Google desconecta o app a cada 7 dias.
     Não é preciso enviar para verificação: na primeira vez aparecerá o aviso "O Google não verificou este app";
     clique em **Avançado → Acessar Task Manager**.
3. Em **Clientes**, crie um cliente OAuth do tipo **Aplicativo da Web** com estes
   **URIs de redirecionamento autorizados**:
   - `https://task-manager.<seu-subdominio>.workers.dev/api/auth/google/callback`
   - `http://localhost:5173/api/auth/google/callback`
4. Guarde o **ID do cliente** e a **chave secreta do cliente**.

> Na fase 4 vamos ativar as APIs **Google Calendar** e **Gmail** neste mesmo projeto.

## 4. Segredos de produção

Em `apps/api`:

```bash
npx wrangler secret put ALLOWED_EMAIL         # seu e-mail Google
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put ENCRYPTION_KEY        # cole o resultado de: openssl rand -base64 32
```

> Não troque a `ENCRYPTION_KEY` depois de em uso: os tokens do Google já salvos ficariam ilegíveis
> (seria preciso sair e entrar de novo).

Publique novamente com `pnpm run deploy` e entre pela URL do app.

## 5. Instalar no celular

- **iPhone (Safari)**: abra a URL → botão Compartilhar → **Adicionar à Tela de Início**.
  Isso também é necessário para receber notificações (iOS 16.4+).
- **Android (Chrome)**: abra a URL → menu ⋮ → **Instalar app**.

## 6. Publicação automática pelo GitHub (opcional)

A cada push na branch `main`, o GitHub Actions roda os testes e publica na Cloudflare, se estes segredos
existirem em **Settings → Secrets and variables → Actions** do repositório:

| Segredo | Onde obter |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → modelo **Edit Cloudflare Workers**, adicionando a permissão **D1: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages → coluna lateral "Account ID" |

Sem esses segredos, o CI só roda lint, tipagem, build e testes.
