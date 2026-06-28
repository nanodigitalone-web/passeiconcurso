# Passei — Concursos da Saúde (Angola)

Monorepo separado em 3 partes independentes, prontas para deploy distribuído:

```
.
├── src/            # Frontend (React + Vite)  → Vercel
├── server/         # Backend (Node + Express) → Render
└── database/       # Esquema Postgres (schema.sql + seed.sql) → DB própria
```

O backend usa Postgres puro + JWT próprio (já **não** depende do Supabase).

---

## Desenvolvimento local (rápido, com Docker)

```bash
# 1. Base de dados Postgres em Docker
docker run -d --name passei-db \
  -e POSTGRES_PASSWORD=passei -e POSTGRES_USER=passei -e POSTGRES_DB=passei \
  -p 5433:5432 postgres:16-alpine

# 2. Backend
cd server
cp .env.example .env          # já vem com DATABASE_URL para localhost:5433
npm install
npm run migrate               # aplica ../database/schema.sql e seed.sql
npm run dev                   # http://localhost:8787  (GET /health -> {"ok":true})

# 3. Frontend (noutro terminal, na raiz)
cp .env.example .env          # VITE_API_URL=http://localhost:8787
npm install
npm run dev                   # http://localhost:8080
```

> Para parar/recomeçar a BD: `docker stop passei-db` / `docker start passei-db`.

---

## Deploy (stack 100% gratuito)

| Parte | Serviço grátis |
|---|---|
| Base de dados | **Neon** (neon.tech) — Postgres grátis |
| Uploads de comprovativos | **Cloudinary** (cloudinary.com) — grátis |
| Backend | **Render Free** (adormece após 15 min sem uso) |
| Frontend | **Vercel** |

### 1. Base de dados — Neon
Cria um projeto grátis em neon.tech e copia a connection string. Guarda-a para
`DATABASE_URL`. (Plano pago do Render para Postgres não é necessário.)

### 2. Uploads — Cloudinary
Cria conta grátis em cloudinary.com. Em *Account Details* copia a variável
`CLOUDINARY_URL` (`cloudinary://api_key:api_secret@cloud_name`). Guarda-a.

### 3. Backend — Render (Free)
Render → New → **Blueprint** → escolhe o repo. O `render.yaml` cria o serviço
`passei-api` no plano **free**. Preenche os segredos `sync: false`:
- `DATABASE_URL` → a string do Neon
- `CLOUDINARY_URL` → a do Cloudinary
- `ADMIN_EMAILS` → `nanodigitalone@gmail.com,joelarmandomanuel@gmail.com,jamanueljo@gmail.com`
- `CORS_ORIGINS` → `https://www.passeii.com,https://passeii.com`
- `JWT_SECRET` → deixa o Render gerar (`generateValue: true`)

Os restantes (`NODE_ENV`, `JWT_EXPIRES_IN`, `DATABASE_SSL`, `CRON_SECRET`) já vêm
definidos no blueprint. Copia o URL do serviço (ex.: `https://passei-api.onrender.com`).

### 4. Criar as tabelas no Neon (uma vez)
```bash
cd server
DATABASE_URL="<string-do-neon>" DATABASE_SSL=true npm run migrate
```

### 5. Frontend — Vercel
Add New → Project → importa o repo (deteta Vite). Em *Environment Variables*
adiciona só:

```
VITE_API_URL=https://passei-api.onrender.com
```
Deploy. O `vercel.json` já trata do rewrite SPA.

> Limitação do plano grátis: o backend Render "adormece" após 15 min sem uso; a
> 1ª chamada seguinte demora ~50s a acordar.

---

## Autenticação
JWT próprio (`/auth/register`, `/auth/login`, `/auth/google`). O token é guardado
no `localStorage` do frontend e enviado como `Authorization: Bearer`. Os e-mails
em `ADMIN_EMAILS` recebem automaticamente o papel de administrador.

## Segurança
- Nunca faça commit de ficheiros `.env` (já protegidos no `.gitignore`).
- O backend aplica `helmet` (security headers) e rate-limit nas rotas `/auth`.
- O JWT_SECRET tem guard: o servidor recusa arrancar em produção com o valor
  inseguro por defeito.

### Sobre as antigas chaves Supabase
O `.env` versionado continha apenas a chave **anon/pública** do Supabase
(`VITE_SUPABASE_PUBLISHABLE_KEY`) — uma chave desenhada para ser pública (vai
sempre no frontend) e protegida pelas RLS policies do lado do Supabase. **Não**
havia chave `service_role`. Como o projeto já não usa Supabase, essas chaves
estão mortas. O projeto Supabase é gerido pelo Lovable Cloud; se quiser encerrá-lo,
faça-o pelo painel do Lovable (Settings → Cloud/Integrations). Não é urgente.
