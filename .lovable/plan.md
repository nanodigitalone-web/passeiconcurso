# Migração para arquitetura própria (Git → Vercel + Render + Postgres)

Objetivo: separar o projeto em **3 partes independentes**, prontas para repositórios Git, saindo totalmente do Lovable Cloud:

- **Frontend** (Vercel) — React/Vite atual, sem cliente Supabase.
- **Backend** (Render) — API Node/Express com autenticação JWT própria.
- **Base de dados** (Postgres puro, onde quiseres: Render, Neon, etc.).

## Estrutura do monorepo (um repo) ou 3 repos

```text
/
├── apps/
│   ├── web/        → frontend (Vercel)   [vercel.json]
│   └── api/        → backend  (Render)   [render.yaml, Dockerfile]
├── database/
│   ├── schema.sql  → tabelas + funções (Postgres puro)
│   └── seed.sql    → dados iniciais (admin, etc.)
└── README.md       → como correr e fazer deploy de cada parte
```
Podes separar depois em 3 repositórios — a estrutura já fica pronta para isso.

## Base de dados (Postgres puro)

- `auth.users` (gerido pelo Supabase) é substituído por uma tabela **`users`** própria
  (email, password_hash, google_id, created_at).
- Mantêm-se todas as tabelas atuais: profiles, user_roles, category_access,
  battles, friendships, notifications, coin_*, withdrawal_requests, points_log,
  cursos_preparatorios, push_subscriptions, access_codes, payment_requests.
- As funções RPC que usavam `auth.uid()` deixam de existir na DB; essa lógica
  passa para o backend (que já conhece o utilizador pelo JWT). As funções puras
  de cálculo mantêm-se.
- **RLS deixa de ser necessário** — a segurança passa a ser garantida pelo backend
  (cada rota valida o JWT e filtra por utilizador).

## Backend (Render) — Node + Express + `pg`

- **Auth JWT próprio**: `POST /auth/register`, `/auth/login`, `/auth/google`,
  `GET /auth/me`. Password com bcrypt, tokens JWT (access) assinados com `JWT_SECRET`.
- **Módulos de rotas** que substituem os serviços atuais 1:1:
  profile, access, quiz-content (respostas gated), recursos (gated por acesso),
  ranking, friends, battles, notifications, coins/carteira, cursos, admin, push.
- **Cron** (8h) para push-notify via `node-cron` ou Render Cron Job.
- Middleware de autorização (`requireAuth`, `requireAdmin`) substitui as policies RLS.
- Conteúdo pago dos quizzes/recursos continua **só no servidor**.

## Frontend (Vercel)

- Novo `src/lib/api.ts` — cliente `fetch` com baseURL `VITE_API_URL` e Bearer token
  guardado em localStorage.
- Reescrevo os 16 ficheiros `src/services/*` para chamarem a API em vez do Supabase.
  **A UI e os hooks não mudam** (já só falam com a camada de serviços).
- Removo `src/integrations/supabase` e `src/integrations/lovable`.
- Login passa a email/password + Google OAuth pelo backend.

## Deploy

- `apps/web` → Vercel (build `vite build`, output `dist`, env `VITE_API_URL`).
- `apps/api` → Render (Web Service Node, env `DATABASE_URL`, `JWT_SECRET`,
  `VAPID_*`, `CRON_SECRET`, `GOOGLE_CLIENT_ID/SECRET`).
- DB → executar `database/schema.sql` + `seed.sql` na instância Postgres.
- `.env.example` em cada app + README com passos de deploy e ligação ao Git.

## Execução (por etapas, para manter tudo a funcionar)

1. `database/schema.sql` + `seed.sql` (Postgres puro, com tabela `users`).
2. Backend `apps/api`: scaffold, ligação pg, auth JWT, middlewares.
3. Backend: todas as rotas de domínio + cron push.
4. Frontend: `src/lib/api.ts` + reescrita de todos os serviços.
5. Mover frontend para `apps/web`, limpar integrações Supabase.
6. Configs de deploy (vercel.json, render.yaml, Dockerfile) + README + .env.example.

## Notas importantes (técnicas)

- Os segredos atuais do Lovable Cloud (VAPID, etc.) terão de ser recriados como
  variáveis de ambiente no Render — incluo `.env.example` com todos os nomes.
- Google OAuth exige criar credenciais próprias no Google Cloud Console
  (Client ID/Secret) — incluo instruções no README.
- Enquanto a migração decorre, a app atual no Lovable continua a funcionar; a nova
  arquitetura só fica ativa quando fizeres deploy nos novos hosts.
