# CLAUDE.md — Memória do Projeto Passei

> Ficheiro de arranque/handoff. O Claude Code lê isto automaticamente no início
> de cada sessão (em qualquer computador, via git). **Objetivo: não perder o
> contexto do que estamos a fazer**, mesmo quando o chat fica longo ou se muda
> de máquina.
>
> **Regra de manutenção (para o Claude):** ler no início de cada sessão e
> **atualizar o "Registo de sessões" no fim de cada solicitação concluída**
> (o que mudou, ficheiros, migrações, deploys, decisões). Manter conciso.

---

## 1. O que é
**Passei — Concursos da Saúde (Angola)**. App de estudo: simulados comentados,
modo "Aprender" (trilha por níveis), ranking, moedas, batalhas, amigos.
Online: **www.passeii.com**. Criada originalmente no Lovable.

## 2. Arquitetura
- **Frontend**: React + Vite + Tailwind + shadcn/ui → deploy na **Vercel**.
  Código em `src/`. Fala com o backend só via `src/lib/api.ts` + `src/services/*`.
- **Backend**: Express + JWT (TypeScript, corre com `tsx`, sem compilação) →
  deploy no **Render** (plano free). Código em `server/src/`.
- **Base de dados**: Postgres puro na **Neon** (free). Schema em
  `database/schema.sql`; migrações em `database/migrations/`.
- **Uploads** (comprovativos): Cloudinary se `CLOUDINARY_URL`, senão disco (dev).
- **Login**: **só Google** (Google Identity Services). Sem email/senha na UI.

### URLs
- Frontend: https://www.passeii.com
- Backend: https://passei-api.onrender.com  (health: `/health`)
- Repo: github.com/nanodigitalone-web/passeiconcurso (branch principal: `main`)

## 3. Dev local
- Postgres em Docker: container `passei-db`, porta **5433**
  (`postgres://passei:passei@localhost:5433/passei`).
- Backend: `cd server && npm run dev` (porta 8787).
- Frontend: `npm run dev` (porta 8080). Build: `npm run build`.
- Aplicar migração: `cd server && node scripts/apply-migration.mjs <ficheiro.sql>`
  (Neon: prefixar `DATABASE_URL="<neon>" DATABASE_SSL=true`).
- **Sempre que mudar schema**: criar migração idempotente em `database/migrations/`
  E atualizar `database/schema.sql`; aplicar em **local E Neon**.

## 4. Funcionalidades-chave (onde estão)
- **Motor de questões** (mistura antigas+novas, anti-viés, repetição espaçada):
  `POST /content/questions` em `server/src/routes/content.ts`. Frontend:
  `quizService.loadQuestionSet`. Regras: cooldown 5h; acertadas não repetem;
  erradas repetem até 3x (5h) e depois nunca; não-vistas primeiro; seed
  (provas reais) com mais peso; baralha posição das opções (correta != sempre B).
- **Banco de questões**: tabela `questions` (DB). Seed das 1072 originais via
  `server/scripts/seed-questions.mjs`. Geração IA: `server/src/lib/generateQuestions.ts`
  (Claude Haiku) + endpoint admin `POST /admin/questions/generate`. Geração em
  lote: `server/scripts/bulk-generate.mjs` (alvo 10.000).
- **Registo de respostas**: `POST /content/attempts` (campo `mode`:
  'simulado'|'aprender') → tabela `question_attempts` (sinal da IA).
- **Simulado** (`src/pages/Quiz.tsx`): máx. **50 pontos**, **sem limite diário**.
- **Aprender** (`src/pages/Aprender.tsx` + `AprenderSessao.tsx`): trilha
  **infinita por níveis**, cada nível = **300 questões** (`/content/aprender-level`);
  **5 vidas** (recarrega 1/3h, server-side, `/profile/lives`); **5s por questão**
  (salta sozinho); máx. **20 pontos**/sessão.
- **Pontos/Ranking**: `profiles.pontos` = saldo gastável; `profiles.pontos_globais`
  = total ganho (NUNCA desce, usado no ranking). Trocar moedas baixa só o saldo.
  Perfil mostra totais/disponíveis/trocados.
- **Convites**: link `/login?convite=CODE` (= `friend_code`). Convidador ganha
  **100 pontos** por novo registo (`profiles.referred_by`, uma vez). Página
  `/partilhar` (convite, partilhar app, banner, certificado).
- **Banner/Certificado**: `src/lib/share.ts` (canvas → imagem). Certificado aos
  **100.000 pontos**.

## 5. Migrações (estado)
001 attempts+trial · 002 questions · 003 pontos_globais · 004 vidas ·
005 referrals · 006 fix points drift · 007 attempt.mode.
Todas aplicadas em local **e** Neon.

## 6. Ações pendentes do DONO (externas)
- **Rotar a ANTHROPIC_API_KEY** antes do lançamento (foi colada no chat → exposta).
  Nova chave só no Render (env `ANTHROPIC_API_KEY`). Nunca no chat/código.
- **Rotar a password da Neon** (também foi partilhada no chat).
- **UptimeRobot**: monitorizar `https://passei-api.onrender.com/health` (não a raiz).
- Confirmar envs no Render: DATABASE_URL (Neon), GOOGLE_CLIENT_ID, CORS_ORIGINS
  (com www.passeii.com), CLOUDINARY_URL, ADMIN_EMAILS, ANTHROPIC_API_KEY.
- Vercel: VITE_API_URL → backend Render; VITE_GOOGLE_CLIENT_ID.
- **Google Cloud Console**: origens de produção autorizadas (já feito; confirmar).

## 7. Problemas conhecidos / em curso
- **Repetição de questões**: categorias pequenas (77–200 q) esgotam → motor
  cai no fallback e repete. SOLUÇÃO = encher com IA. **BLOQUEADO**: a conta
  Anthropic ficou **SEM CRÉDITOS** (a geração parou em ≈6.600). Assim que o dono
  adicionar créditos (console.anthropic.com → Plans & Billing), reiniciar
  `bulk-generate.mjs` (já prioriza as categorias mais pequenas).
- **Provider de geração migrado para Gemini** (grátis): `generateQuestions.ts` e
  `bulk-generate.mjs` usam Gemini se `GEMINI_API_KEY` (modelo `gemini-2.0-flash`),
  senão Anthropic Haiku. Por o `GEMINI_API_KEY` no Render (e dar-mo p/ correr o lote).
- Comando p/ retomar a geração (de `server/`):
  `GEMINI_API_KEY=... DATABASE_URL=<neon> DATABASE_SSL=true node scripts/bulk-generate.mjs 10000 15`
- O admin já mostra o total REAL da BD (endpoint `/admin/questions-stats`); antes
  contava só a lista embutida (1072).
- Bundle frontend ~2.1MB (code-splitting é melhoria futura).
- Segurança: o servidor tem rede global (unhandledRejection/uncaughtException)
  para nunca crashar; novos endpoints devem ter try/catch.
- **Lovable**: o editor faz commits diretos na `main` e já re-adicionou Supabase
  (código morto). Cuidado ao integrar.

## 8. Convenções
- Commits e push só quando o dono pede (ele autorizou push direto à `main` no
  modo auto). Mensagens em PT, com `Co-Authored-By: Claude Opus 4.8`.
- Testar (build + smoke test) antes de pôr online; o simulado/Aprender são o
  coração da app — não partir.

---

## 9. Registo de sessões (mais recente no topo)

### 2026-06-30
- UptimeRobot reportava "down" → era a raiz `/` (404). Adicionada rota `GET /`.
- Trilha do Aprender: agora infinita por níveis (300 q/nível), usa o motor IA,
  vidas persistentes (3h), 5s/questão, máx 20 pts. Migração 007 (mode).
- Bug de pontos (saldo > total) reparado (migração 006). Keep-alive do Render
  (GitHub Action) + recomendação UptimeRobot.
- Convites (+100 pts), partilha, banner e certificado (100k). Migração 005.
- Rede de segurança global no servidor (não crashar).
- Geração IA em lote a caminho das 10.000 (≈6.600 em 2026-06-30).

### 2026-06-29
- Separação Vercel/Render/Neon concluída; import dos 47 utilizadores do Supabase
  para a Neon. Ranking justo (pontos_globais, migração 003). Simulado 50 pts/sem
  limite. Vidas no Aprender (migração 004). Repetição espaçada no motor. Tabela
  `questions` (002) + seed + geração IA (Claude Haiku). Bug do NotificationToaster
  corrigido. Login Google na web: faltavam origens no Google Console.
