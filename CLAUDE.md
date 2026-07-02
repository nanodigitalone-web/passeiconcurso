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

## 3. Ambiente de trabalho
- **Não existe ambiente local** (decisão do dono, 2026-07-02): trabalha-se
  direto na produção. A ÚNICA base de dados é a **Neon** — o `server/.env`
  já aponta para ela.
- Backend local (contra a Neon): `cd server && npm run dev` (porta 8787).
- Frontend: `npm run dev` (porta 8080). Build: `npm run build`.
- Aplicar migração (vai direto à Neon, lê `server/.env`):
  `cd server && node scripts/apply-migration.mjs <ficheiro.sql>`
- **Sempre que mudar schema**: criar migração idempotente em `database/migrations/`
  E atualizar `database/schema.sql`; aplicar na **Neon**.
- ⚠️ Produção real: testar bem (build + smoke test) antes de push — o push à
  `main` faz deploy automático (Vercel + Render).

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
  **5 vidas** (recarrega 1/3h, server-side, `/profile/lives`); **10s por questão**
  (salta sozinho); máx. **20 pontos**/sessão.
- **Pontos/Ranking**: `profiles.pontos` = saldo gastável; `profiles.pontos_globais`
  = total ganho (NUNCA desce, usado no ranking). Trocar moedas baixa só o saldo.
  Perfil mostra totais/disponíveis/trocados.
- **Convites**: link `/login?convite=CODE` (= `friend_code`). Convidador ganha
  **50 pontos** por novo registo (`profiles.referred_by`, uma vez). Página
  `/partilhar` (convite, partilhar app, banner, certificado).
- **Interesses + personalização**: `/interesses` tem um interruptor "marcar
  para estudo" (`profiles.interesses_ativo`). Quando ativo, o **Aprender** e o
  **Simulado** GERAIS (Index/Aprender/Percurso) passam a abrir a categoria
  virtual `interesses/interesses` (filtra por disciplina ∈ `profiles.interesses`)
  em vez da categoria normal do utilizador — não existe página separada.
- **Foto de perfil**: upload real em `POST /profile/avatar` (multer + Cloudinary
  ou disco), ícone de câmara sobre o avatar em `Perfil.tsx`.
- **Banner/Certificado**: `src/lib/share.ts` (canvas → imagem). Certificado aos
  **100.000 pontos**.

## 5. Migrações (estado)
001 attempts+trial · 002 questions · 003 pontos_globais · 004 vidas ·
005 referrals · 006 fix points drift · 007 attempt.mode · 008 perfil
académico+interesses · 009 follows · 010 interesses_ativo · 011 interesses_max ·
012 reset_interesses (interesses nullable + reset ALL to NULL) ·
013 promotions · 014 payment_amount · 015 plans/subscrições ·
016 ligas semanais + streak freeze + Simulado Nacional.
Todas aplicadas na **Neon** (única BD — já não existe ambiente local).

## 6. Ações pendentes do DONO (externas)
- **Rotar a ANTHROPIC_API_KEY** após terminar a geração de questões (colada no chat
  novamente em 2026-07-01). Chave guardada em `server/.env` (gitignored) com nome
  "passeiclaude". Após rotação, actualizar `server/.env` E o Render.
- **Rotar a password da Neon** (também foi partilhada no chat).
- **UptimeRobot**: monitorizar `https://passei-api.onrender.com/health` (não a raiz).
- Confirmar envs no Render: DATABASE_URL (Neon), GOOGLE_CLIENT_ID, CORS_ORIGINS
  (com www.passeii.com), CLOUDINARY_URL, ADMIN_EMAILS, ANTHROPIC_API_KEY.
- Vercel: VITE_API_URL → backend Render; VITE_GOOGLE_CLIENT_ID.
- **Google Cloud Console**: origens de produção autorizadas (já feito; confirmar).

## 7. Problemas conhecidos / em curso
- **Questões por disciplinas de interesse**: geração RELANÇADA 2026-07-02 com
  `caffeinate -i` (a paragem anterior foi provavelmente o Mac a adormecer;
  última inserção tinha sido 01:22 UTC). BD em **21.400+**; 20 disciplinas já
  com ≥500. Script: `server/scripts/generate-interests.mjs` (agora inclui a
  área nova "Ciências Básicas e Línguas": Biologia, Biologia Médica, Química,
  Química Orgânica, Bioquímica, Física, Matemática, Bioestatística, Anatomia I,
  Inglês, Francês, Espanhol → concurso geral/geral). Alvo: **500/disciplina**
  (97 disciplinas). Log: `server/generation.log` (gitignored). Retomar se
  interrompido (a partir de `server/`):
  `nohup caffeinate -i node scripts/generate-interests.mjs 500 >> generation.log 2>&1 &`
- **Disciplinas cobertas**: 75 disciplinas de saúde (Medicina 25, Enfermagem 15,
  Fisioterapia 15, Farmácia 15, Análises Clínicas 15) + 10 extra. Cada uma usa slug
  como campo `disciplina` na BD (ex: `anatomia-humana-sistemica`).
- **Questões de categorias** (minsa/medico etc.): BD em ~10.000. Alvo 15.000.
  Retomar: `node scripts/bulk-generate.mjs 15000 15` (usa Anthropic se sem Gemini key).
- Bundle frontend ~2.1MB (code-splitting é melhoria futura).
- O admin já mostra o total REAL da BD (endpoint `/admin/questions-stats`); antes
  contava só a lista embutida (1072).
- Bundle frontend ~2.1MB (code-splitting é melhoria futura).
- Segurança: o servidor tem rede global (unhandledRejection/uncaughtException)
  para nunca crashar; novos endpoints devem ter try/catch.
- **Lovable**: o editor faz commits diretos na `main` e já re-adicionou Supabase
  (código morto). Cuidado ao integrar.
- ⚠️ A password da Neon foi colada no chat (autorizado pelo dono) — **rotar**
  assim que possível, como já indicado na secção 6.

## 8. Convenções
- Commits e push só quando o dono pede (ele autorizou push direto à `main` no
  modo auto). Mensagens em PT, com `Co-Authored-By: Claude Opus 4.8`.
- Testar (build + smoke test) antes de pôr online; o simulado/Aprender são o
  coração da app — não partir.

---

## 9. Registo de sessões (mais recente no topo)

### 2026-07-02 (3 funcionalidades novas: prontidão + ligas/freeze + Simulado Nacional)
- **Diagnóstico de Prontidão** (`/prontidao`, `GET /profile/readiness`): score 0–100 por
  disciplina (65% precisão recente-ponderada + 35% cobertura de questões dominadas,
  alvo cap 100). Página com anel de score, resumo e barras por disciplina (fracas
  primeiro). Entrada nas ações rápidas da Home.
- **Ligas semanais** (tab "Liga" no Ranking, `GET /ranking/league`): 5 divisões
  (Bronze→Lenda) em `profiles.league`; pontos da semana vêm do `points_log`. Rollover
  lazy no 1.º pedido da semana (advisory lock + tabela `league_rollovers`): top 10 de
  cada divisão sobe, quem não pontuou desce.
- **Streak freeze**: `profiles.streak_freezes` (máx. 2, 300 moedas via
  `POST /profile/streak-freeze/buy`), consumo automático em `server/src/lib/streak.ts`
  (lib nova partilhada por `/content/attempts` e `/profile/dashboard`; dias congelados
  em `streak_freeze_uses`). Cartão de compra no Perfil.
- **Simulado Nacional** (`/simulado-nacional`, router `server/src/routes/exams.ts`):
  evento cronometrado com questões congeladas na criação (iguais para todos), inscrição
  grátis ou paga em moedas, prova com deadline server-side (grace 30s no submit),
  correção no servidor, pontos = acertos (contam para a liga), attempts com mode='exame'
  (não consome o limite diário free), prémios em moedas ao pódio (finalização lazy com
  advisory lock + notificações). Admin: tab "Exames" (`src/components/admin/ExamesTab.tsx`,
  endpoints `/admin/exams`) cria/apaga exames e anuncia por broadcast.
- Migração **016** aplicada na **Neon**. `schema.sql` atualizado. Build Vite +
  `tsc --noEmit` (front e server) OK; smoke test do server OK.
- **Redesign da secção de concursos** (`Concursos.tsx`, `ConcursoDetail.tsx`,
  `CategoriaDetail.tsx`): linguagem visual da Home — hero gradiente com blur,
  pesquisa integrada, cartões com acentos coloridos rotativos, badges
  "O teu"/"A tua" no concurso/categoria do utilizador, CTA branco, ações
  rápidas (tópicos/recursos) e tópicos em tags azuis.
- Dono confirmou: **já não existe ambiente local** — trabalho direto na produção
  (secção 3 atualizada).
- **Redesign do Ranking** (`Ranking.tsx`): hero gradiente com stats do utilizador
  (pontos globais, liga via `profile.league`, sequência), cartão "A tua posição"
  (mostra quanto falta para ultrapassar o próximo), medalhas ouro/prata/bronze
  no top 3 da lista, números formatados pt-PT.
- **Header + menu + Login** (`TopBar.tsx`, `BottomNav.tsx`, `DesktopSidebar.tsx`,
  `Login.tsx`): TopBar com blur e chips de sequência/pontos; BottomNav flutuante
  (item ativo em chip gradiente); sidebar com Simulado Nacional e Prontidão;
  Login redesenhado (prova social, cartão de vidro no botão Google).
  **"Percurso" renomeado para "Relatório"** em toda a UI (rota `/percurso` mantém-se).
- **Marca multi-área**: expressão "saúde" removida dos textos visíveis (Login,
  Seo de Concursos, partilhas, banner/certificado canvas). Mantêm-se nomes reais
  de cursos ("Técnico — Saúde") e o disclaimer legal do MINSA.
- **Menu inferior com gaveta "···"**: 4 itens principais (Início, Concursos,
  Aprender, Ranking) + botão Mais que abre Drawer com atalhos coloridos
  (Simulado, Prontidão, Planos, Sacar, Convidar, Recursos, Relatório, Perfil).
- **Home reorganizada**: stats (sequência/pontos/acerto) dentro do hero azul;
  no lugar deles, mini-trilha Aprender (planeta atual via `src/lib/celestial.ts`
  partilhado, progresso, botão Jogar → abre a sessão directamente).
- **Notificações**: só mensagens dos últimos 2 dias. **Sobre**: sem linha de
  login Google, créditos "By Yetuedu". **Travessões** removidos de todos os
  textos visíveis (pedido do dono: nada que denuncie escrita de IA).
- **Fix batalhas** (`battles.ts`, `battlesService.ts`, `Batalha.tsx`): criação
  usa o motor do servidor (funcionava só com o banco local, vazio para plano/
  interesses). Novo `GET /battles/:id/questions` — ambos jogam o MESMO conjunto.
- **Ranking limitado a 20** (geral/semanal/liga) a pedido do dono.
- **Badge de plano nos avatares em todo o lado**: `plan_id` (subselect a
  user_subscriptions activas) devolvido em ranking/liga/semana/exames/perfil
  público/seguidores; frontend envolve avatares com `PlanBadge` e mostra
  `PlanPill` junto ao nome no perfil próprio e público.
- **"Sobre a aplicação"**: `AboutModal.tsx` (versão, features, créditos
  Yetuedu), acessível nas Definições do Perfil.
- **Menu inferior colorido**: cada item com cor própria (ícone colorido em
  repouso, chip gradiente quando activo).
- **Aprender melhorado**: CTA "Continuar · Nível N" branco, chip de vidas
  (fetch a /profile/lives), % na barra, estado vazio sem emoji, chip do
  sistema actual destacado com a cor do corpo celeste.
- **Modal de seguidores redesenhado** + **Partilhar redesenhada** (hero com
  código de convite, cartões compactos, barra de progresso do certificado).
- **Páginas de pagamento redesenhadas**: `Acesso.tsx`, `PlanoPagamento.tsx`,
  `AccessGate.tsx` — heros com preço em chip, promo em amarelo, conclusão
  verde-esmeralda, benefícios com checks.
- **Redesign das provas do simulado** (`Quiz.tsx`, `Resultado.tsx`): escolha de
  formato com hero; prova com contador de acertos ao vivo, disciplina no cartão
  da questão e comentário colorido por certo/errado; resultado com anel de
  percentagem, chip "+N pontos" e erros comentados em blocos vermelho/verde.
- **Login (ajustes do dono)**: sem badge do topo nem travessões; rodapé
  "By Yetuedu" (negrito branco); prova social diz 35 mil+ questões.
- **Perfil — informações pessoais**: vista normal mostra só as respostas com
  chips de ícone coloridos; labels apenas no modo de edição.
- **Redesign notificações + Perfil inferior** (`Notificacoes.tsx`,
  `NotificationToaster.tsx`, `PlatformAlertModal.tsx`, `Perfil.tsx`): página com
  hero e ícones por tipo de mensagem (heurística no conteúdo), toast com ação
  "Ver" (silenciado também na prova do Simulado Nacional), modal de alertas sem
  emojis com blur e CTA branco, secções do Perfil (infos pessoais → sair) com
  chips coloridos e sair como cartão destrutivo.

### 2026-07-01 (admin metrics resilience + UX melhorias)
- **Admin – UserStatsModal reutilizável**: componente partilhado entre Top 3 e UsersTab.
  Clicar em qualquer utilizador em UsersTab faz fetch `GET /admin/users/:id/stats` e abre
  o modal completo (13 métricas, incl. `referrals_given`).
- **Admin – Activação & Retenção Detalhada**: nova secção com 6 KPIs: utilizadores activados,
  taxa de activação, retenção D1/D7/D30, receita/MAU e payback em meses.
- **Admin – Questões por Disciplina**: gráfico de barras após «Questões por Categoria» mostrando
  questões disponíveis por disciplina dos interesses/temas (usa `m.disciplines` já no endpoint).
- **Fix avatar**: `AvatarImage` em `avatar.tsx` agora tem `object-cover` — fotos não-quadradas
  deixam de distorcer em todo o lado da app.
- **Fix streak**: calculado e gravado em `profiles.streak` no endpoint `POST /content/attempts`,
  logo após inserir as tentativas. Antes estava sempre a 0.
- **Fix pontos simulado**: `Quiz.tsx` mostra `toast.error` se `addPoints` falhar (antes silencioso).
- **Aprender**: tempo por questão 10 → **15 segundos** (`AprenderSessao.tsx`).
- **Renomear «interesses» → «disciplinas»**: todos os textos visíveis ao utilizador actualizados
  em `Perfil.tsx`, `Interesses.tsx`, `InteressesModal.tsx`, `Index.tsx`. Variáveis e campos BD mantêm
  o nome original.
- Commit: `0628f7f`. Deploy via Vercel automático.

### 2026-07-01 (admin moderation + fix interesses)
- **Fix questões por interesses**: `content.ts` importa `ALL_DISCIPLINAS` de `disciplinas.ts`
  via tsx. Nova `expandInterestSlugs()` expande cada slug para incluir o nome legível
  (ex. "anatomia-humana-sistemica" → também "Anatomia Humana Sistémica"). Questões seed/antigas
  têm nome legível; novas têm slug — agora ambas batem. Aplica-se em `/aprender-level` e `/questions`.
- **Admin – Top 3 utilizadores**: endpoint `GET /admin/top-users` (JOIN com `question_attempts`
  e `category_access`). StatsTab mostra pódio clicável com medalhas; modal detalha todos os dados.
- **Admin – Moderação**: UsersTab ganha filtros (Todos/Com plano/Bloqueados), `WarnUserDialog`
  (POST `/admin/users/:id/warn` → notificação com mensagem personalizada) e `BanUserDialog`
  (POST `/admin/users/:id/ban` → bloqueia + notificação com motivo).
- **Admin – Prevenção de fraude**: botão "Revogar" em carregamentos aprovados. POST
  `/admin/topups/:id/revoke` deduz moedas (≥0), regista em `coin_transactions` com tipo
  `topup_revoke`, muda status para `revoked` e notifica utilizador.
- Migração 014 incluída no commit (já aplicada na Neon).

### 2026-06-30 (correção de arquitetura interesses + extras)
- **Correção de arquitetura**: a página separada `EstudarInteresses.tsx`
  (Simulado/Aprender isolados dentro de Interesses) criada na sessão anterior
  foi **removida** — o dono pediu explicitamente que não existisse essa página.
  Em vez disso: `/interesses` ganhou um interruptor "marcar para estudo"
  (`profiles.interesses_ativo`, migração 010). Quando ativo, as rotas GERAIS
  `Index.tsx`, `Aprender.tsx` e `Percurso.tsx` passam a apontar para a categoria
  virtual `interesses/interesses` (mecanismo já existente em `Quiz.tsx`/
  `AprenderSessao.tsx`/`access.ts`/`content.ts`, reaproveitado sem alterações).
- **Percurso → "Começar agora"**: abre diretamente `/quiz/{concurso}/{categoria}`
  do utilizador (ou `interesses/interesses` se ativo) em vez de `/concursos`.
- **Pontos de convite**: 100 → **50 pontos** (`auth.ts` `applyReferral`,
  `Partilhar.tsx`, `Perfil.tsx`).
- **Foto de perfil**: novo endpoint `POST /profile/avatar` (multer memoryStorage
  → Cloudinary `upload_stream` com `public_id` estável + `overwrite:true`, ou
  disco em dev) grava `avatar_url` direto na BD. `Perfil.tsx` ganhou um botão de
  câmara sobre o avatar (substituiu o campo de texto "URL do avatar").
- **Bio no perfil público**: confirmado que já funcionava (`PerfilPublico.tsx` +
  `GET /profile/:id`), sem alterações necessárias.
- **Bug de centragem** (`PlatformAlertModal.tsx`): `mx-4 ... sm:mx-auto` num
  `DialogContent` com `width:100%` + `translate-x-[-50%]` não encolhe a caixa,
  só lhe soma espaço para fora do ecrã → ficava deslocado para um lado. Corrigido
  para `w-[calc(100%-2rem)] max-w-sm` (a largura encolhe, a centragem por
  transform volta a bater certo).
- **Migração 010 aplicada na Neon** (dono colou a connection string no chat;
  corrida via psycopg2 já que o sandbox não tem `node`/`psql` — ver secção 7
  sobre a necessidade de rotar a password de novo). Ainda por confirmar no
  Postgres local (Docker). Build não verificado por ferramenta (sandbox sem
  Node/npm) — apenas revisão manual de código.

### 2026-06-30 (design)
- **Index.tsx** redesenhado de raiz: limpo, profissional, sem emojis no texto.
  Hero com gradiente + stats (simulados/pontos/acertos). Ações rápidas como cards
  com ícone colorido + texto. Lista de concursos limpa. Sem qualquer bloco de
  interesses na home.
- **InteressesModal.tsx** (novo): Dialog fullscreen que aparece automaticamente
  após o primeiro login, quando `profile.interesses === undefined` (null na BD =
  nunca configurado). "Pular" guarda `[]` para não voltar a aparecer. Integrado
  no `AppShell.tsx`.
- **Perfil.tsx**: interesses mostrados inline com hierarquia clara
  (área em caps small → disciplinas selecionadas em tags azuis com checkmark).
  Botão "Editar" navega para `/interesses`. Sem emojis.

### 2026-06-30 (follow system)
- Sistema de seguir utilizadores completo:
  - Migração 009: tabela `follows` (follower_id, following_id, PK composta, CHECK self-follow).
  - `database/schema.sql` atualizado com tabela follows + índices.
  - Backend `GET /profile/:id` aumentado: devolve `followers_count`, `following_count`, `is_following`.
  - Novos endpoints: `POST /profile/:id/follow`, `DELETE /profile/:id/follow`.
  - Frontend: `src/pages/PerfilPublico.tsx` (hero gradiente, avatar, stats 3 col, info académica, botão seguir/a seguir).
  - Rota `/perfil/:id` adicionada em `App.tsx`.
  - Ranking: todos os utilizadores (pódio + lista) clicáveis → `/perfil/:id`.
- Design/home: escolas e cursos como combobox pesquisável; ano como select.
  `src/data/escolas.ts`, `src/data/cursos.ts`, `src/components/ui/combobox.tsx`.
- Home (`Index.tsx`): 6 ações rápidas incluindo "Por Interesses" e "Sacar Dinheiro".
- Modal de interesses após 1.º login (`src/components/InteressesModal.tsx`).

### 2026-06-30 (cont.)
- Pivô multi-área (deixa de ser só saúde): taxonomia `src/data/disciplinas.ts`
  (10 áreas, flag `saude`). Migração 008: profiles.universidade/curso/ano/
  interesses(jsonb). Perfil com campos académicos. Ecrã `/interesses` (só
  áreas de saúde por agora — decisão do dono; resto "em breve"). Início
  (`Index.tsx`) redesenhado: hero gradiente, "os teus temas", ações rápidas
  coloridas, concursos. Geração para áreas novas = próximo (precisa Gemini key).
- Admin mostra total real da BD (6.608: 1072 seed + 5536 ai). Geração migrada
  p/ Gemini. UptimeRobot "down" = era a raiz 404 (corrigido com rota /).
  ⚠️ Anthropic SEM CRÉDITOS → geração parou; usar Gemini.

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
