# Passei — Concursos da Saúde (Angola)

Monorepo separado em 3 partes independentes, prontas para repositórios Git e
deploy distribuído:

```
.
├── src/            # Frontend (React + Vite)  → Vercel
├── server/         # Backend (Node + Express) → Render
└── database/       # Esquema Postgres (schema.sql + seed.sql) → DB própria
```

## 1. Base de dados (Postgres)
Crie uma base Postgres (Render, Neon, ou local) e aplique o esquema:

```bash
cd server
cp .env.example .env      # preencha DATABASE_URL
npm install
npm run migrate           # aplica ../database/schema.sql e seed.sql
```

## 2. Backend (Render)
```bash
cd server
npm install
npm run dev               # local em http://localhost:8787
```
Variáveis de ambiente: ver `server/.env.example`.
Deploy: use o `render.yaml` na raiz (Render → New → Blueprint) ou configure
manualmente com `rootDir: server`, build `npm install`, start `npm start`.

Segredos necessários no Render:
- `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAILS`, `CORS_ORIGINS`
- Push: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`
- Google (opcional): `GOOGLE_CLIENT_ID`

## 3. Frontend (Vercel)
```bash
cp .env.example .env      # defina VITE_API_URL (URL do backend no Render)
npm install
npm run dev
```
Deploy no Vercel: framework Vite (auto), `vercel.json` já incluído com rewrite
SPA. Defina `VITE_API_URL=https://seu-api.onrender.com` nas env vars do Vercel.

## Autenticação
O backend usa JWT próprio (`/auth/register`, `/auth/login`). O token é guardado
no `localStorage` do frontend e enviado como `Authorization: Bearer`. Os e-mails
em `ADMIN_EMAILS` recebem automaticamente o papel de administrador.

## Repositórios Git sugeridos
Pode manter tudo num só repositório (como está) ou separar:
- `passei-frontend` → tudo exceto `server/`
- `passei-backend` → pasta `server/` + `database/`
