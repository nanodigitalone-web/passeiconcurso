-- Migration 001 — adaptive learning Phase 0
-- Idempotent: safe to run multiple times, against local Docker and Neon.
--   apply with: node server/scripts/apply-migration.mjs database/migrations/001_attempts_and_trial.sql

-- ---- 2-week trial for everyone --------------------------------------
alter table users add column if not exists trial_ends_at timestamptz;

-- Reset the trial for ALL existing users: a fresh 14-day window from now.
update users set trial_ends_at = now() + interval '14 days';

-- New users get a 14-day trial by default.
alter table users alter column trial_ends_at set default (now() + interval '14 days');

-- ---- per-question attempts ------------------------------------------
create table if not exists question_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  question_id   text not null,
  concurso_id   text not null,
  categoria_id  text not null,
  disciplina    text,
  correct       boolean not null,
  selected      integer,
  duration_ms   integer,
  answered_at   timestamptz not null default now()
);
create index if not exists idx_attempts_user_time on question_attempts(user_id, answered_at desc);
create index if not exists idx_attempts_user_q on question_attempts(user_id, question_id);
create index if not exists idx_attempts_user_disc on question_attempts(user_id, disciplina);
