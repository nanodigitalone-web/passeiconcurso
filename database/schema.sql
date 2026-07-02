-- =====================================================================
-- Passei Concurso — Postgres schema (self-hosted / Render / Neon / etc.)
-- Plain Postgres. No Supabase, no RLS — authorization is enforced by the
-- backend API (apps server) which validates the JWT on every request.
--
-- Run once on a fresh database:
--   psql "$DATABASE_URL" -f database/schema.sql
--   psql "$DATABASE_URL" -f database/seed.sql
-- =====================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------- enums -----------------------------------------------------
do $$ begin
  create type app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type access_code_status as enum ('available', 'used');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_request_status as enum ('pending', 'awaiting_review', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

-- ---------- users (replaces Supabase auth.users) ---------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text,                       -- null for Google-only accounts
  google_id     text unique,
  -- Free trial window. Access to gated content is granted while now() < this.
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at    timestamptz not null default now()
);

-- ---------- profiles --------------------------------------------------
create table if not exists profiles (
  id             uuid primary key references users(id) on delete cascade,
  nome           text not null default 'Candidato',
  avatar_url     text,
  bio            text,
  pontos         integer not null default 0,   -- spendable balance (drops on convert)
  pontos_globais integer not null default 0,   -- lifetime earned (never drops; ranking)
  streak         integer not null default 0,
  concurso_id    text,
  categoria_id   text,
  categoria_nome text,
  blocked        boolean not null default false,
  hidden         boolean not null default false,
  email          text,
  last_seen      timestamptz,
  friend_code    text unique,
  moedas         integer not null default 0,
  iban           text,
  vidas          integer not null default 5,           -- "Aprender" lives
  vidas_updated_at timestamptz not null default now(), -- recharge clock
  referred_by    uuid references users(id) on delete set null, -- who invited (set once)
  universidade   text,                                 -- perfil académico
  curso          text,
  ano            text,
  interesses     jsonb default null,                   -- ids de disciplinas de interesse (null = nunca configurou)
  interesses_ativo boolean not null default false,     -- personaliza Aprender/Simulado pelos interesses
  interesses_max int not null default 0,               -- 0=free/5, 10=básico (1000 AOA), 30=pro (2000 AOA)
  league         integer not null default 0,           -- liga semanal: 0=Bronze,1=Prata,2=Ouro,3=Diamante,4=Lenda
  streak_freezes integer not null default 0,           -- congelamentos de streak em posse (máx. 2)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ---------- user_roles ------------------------------------------------
create table if not exists user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  role       app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ---------- access_codes ----------------------------------------------
create table if not exists access_codes (
  id           uuid primary key default gen_random_uuid(),
  concurso_id  text not null,
  categoria_id text not null,
  code         text not null,
  status       access_code_status not null default 'available',
  used_by      uuid references users(id) on delete set null,
  used_at      timestamptz,
  created_at   timestamptz not null default now(),
  unique (concurso_id, categoria_id, code)
);

-- ---------- category_access ------------------------------------------
create table if not exists category_access (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  concurso_id  text not null,
  categoria_id text not null,
  code         text,
  activated_at timestamptz not null default now(),
  expires_at   timestamptz default (now() + interval '4 months'),
  unique (user_id, concurso_id, categoria_id)
);

-- ---------- battles ---------------------------------------------------
create table if not exists battles (
  id               uuid primary key default gen_random_uuid(),
  challenger_id    uuid not null references users(id) on delete cascade,
  opponent_id      uuid not null references users(id) on delete cascade,
  concurso_id      text not null,
  categoria_id     text not null,
  question_ids     jsonb not null,
  status           text not null default 'pending',
  challenger_score integer,
  opponent_score   integer,
  challenger_done  boolean not null default false,
  opponent_done    boolean not null default false,
  winner_id        uuid references users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_battles_updated before update on battles
  for each row execute function set_updated_at();

-- ---------- friendships ----------------------------------------------
create table if not exists friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references users(id) on delete cascade,
  addressee_id uuid not null references users(id) on delete cascade,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- ---------- notifications --------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,  -- null = broadcast
  title      text not null,
  body       text not null,
  read       boolean not null default false,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- payment_requests -----------------------------------------
create table if not exists payment_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  email           text not null,
  concurso_id     text not null,
  categoria_id    text not null,
  categoria_nome  text,
  comprovativo_url text,
  status          payment_request_status not null default 'pending',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_payment_requests_updated before update on payment_requests
  for each row execute function set_updated_at();

-- ---------- coin_topup_requests --------------------------------------
create table if not exists coin_topup_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  email           text,
  amount_aoa      integer not null,
  moedas          integer not null,
  comprovativo_url text not null,
  status          text not null default 'awaiting_review',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_coin_topup_updated before update on coin_topup_requests
  for each row execute function set_updated_at();

-- ---------- coin_transactions ----------------------------------------
create table if not exists coin_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  tipo       text not null,
  amount     integer not null,
  descricao  text,
  meta       jsonb,
  created_at timestamptz not null default now()
);

-- ---------- withdrawal_requests --------------------------------------
create table if not exists withdrawal_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  email      text,
  moedas     integer not null,
  aoa        integer not null,
  iban       text not null,
  status     text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_withdrawal_updated before update on withdrawal_requests
  for each row execute function set_updated_at();

-- ---------- points_log -----------------------------------------------
create table if not exists points_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  delta      integer not null,
  created_at timestamptz not null default now()
);

-- ---------- cursos_preparatorios -------------------------------------
create table if not exists cursos_preparatorios (
  id           uuid primary key default gen_random_uuid(),
  concurso_id  text not null,
  nome         text not null,
  logo_url     text,
  contacto     text,
  link_externo text,
  descricao    text,
  ativo        boolean not null default true,
  ordem        integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_cursos_updated before update on cursos_preparatorios
  for each row execute function set_updated_at();

-- ---------- push_subscriptions ---------------------------------------
create table if not exists push_subscriptions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  endpoint         text not null,
  p256dh           text not null,
  auth             text not null,
  last_notified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, endpoint)
);
create trigger trg_push_updated before update on push_subscriptions
  for each row execute function set_updated_at();

-- ---------- questions (question bank — seedable + AI-generated) ------
create table if not exists questions (
  id            text primary key,
  concurso_id   text not null,
  categoria_id  text not null,
  disciplina    text,
  enunciado     text not null,
  opcoes        jsonb not null,
  correta       integer not null,
  comentario    text,
  source        text not null default 'seed',  -- 'seed' | 'ai'
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_questions_cat
  on questions(concurso_id, categoria_id) where active;

-- ---------- question_attempts (adaptive learning signal) -------------
-- One row per answered question. This is the raw data the recommendation /
-- spaced-repetition engine learns from (weak disciplinas, mastery, etc.).
create table if not exists question_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  question_id   text not null,
  concurso_id   text not null,
  categoria_id  text not null,
  disciplina    text,
  correct       boolean not null,
  selected      integer,                     -- chosen option index (-1 = none)
  duration_ms   integer,                     -- time spent on the question
  mode          text not null default 'simulado', -- 'simulado' | 'aprender'
  answered_at   timestamptz not null default now()
);

-- ---------- follows ---------------------------------------------------
create table if not exists follows (
  follower_id  uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);
create index if not exists idx_follows_follower  on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);

-- ---------- ligas semanais --------------------------------------------
-- Semanas já processadas (promoções/despromoções aplicadas; rollover lazy).
create table if not exists league_rollovers (
  week_start   date primary key,
  processed_at timestamptz not null default now()
);

-- ---------- streak freeze ---------------------------------------------
-- Dias em que um congelamento foi consumido (contam como dia activo).
create table if not exists streak_freeze_uses (
  user_id uuid not null references users(id) on delete cascade,
  day     date not null,
  used_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ---------- Simulado Nacional -----------------------------------------
-- Evento cronometrado: todos respondem ao mesmo conjunto de questões
-- (congelado em question_ids na criação) dentro da janela starts_at..ends_at.
create table if not exists national_exams (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  concurso_id       text,                          -- null = geral (banco todo)
  categoria_id      text,
  question_ids      jsonb not null default '[]',
  question_count    integer not null default 50,
  duration_minutes  integer not null default 45,
  entry_cost_moedas integer not null default 0,    -- 0 = grátis
  prize_moedas      jsonb not null default '[200,100,50]', -- prémios 1.º/2.º/3.º
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  finalized         boolean not null default false,
  created_by        uuid references users(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_national_exams_window on national_exams(starts_at, ends_at);

create table if not exists national_exam_entries (
  id          uuid primary key default gen_random_uuid(),
  exam_id     uuid not null references national_exams(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  started_at  timestamptz,
  finished_at timestamptz,
  score       integer,          -- nº de respostas certas
  total       integer,
  duration_ms integer,
  answers     jsonb,
  unique (exam_id, user_id)
);
create index if not exists idx_exam_entries_exam on national_exam_entries(exam_id, score desc, duration_ms asc);
create index if not exists idx_exam_entries_user on national_exam_entries(user_id);

-- ---------- promotions ------------------------------------------------
create table if not exists promotions (
  id          uuid primary key default gen_random_uuid(),
  label       text not null default 'Promoção',
  discount_pct int not null default 100 check (discount_pct between 0 and 100),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- indexes ---------------------------------------------------
create index if not exists idx_attempts_user_time on question_attempts(user_id, answered_at desc);
create index if not exists idx_attempts_user_q on question_attempts(user_id, question_id);
create index if not exists idx_attempts_user_disc on question_attempts(user_id, disciplina);
create index if not exists idx_category_access_user on category_access(user_id);
create index if not exists idx_points_log_user_time on points_log(user_id, created_at);
create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_coin_tx_user on coin_transactions(user_id, created_at desc);
create index if not exists idx_battles_players on battles(challenger_id, opponent_id);
