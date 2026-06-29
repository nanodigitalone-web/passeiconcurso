-- Migration 002 — questions in the DB (foundation for AI question generation)
-- Idempotent. apply: node server/scripts/apply-migration.mjs database/migrations/002_questions.sql
-- Then seed the existing bank: node server/scripts/seed-questions.mjs

create table if not exists questions (
  id            text primary key,            -- keeps the bank's existing ids (e.g. "md1")
  concurso_id   text not null,
  categoria_id  text not null,
  disciplina    text,
  enunciado     text not null,
  opcoes        jsonb not null,              -- array of option strings
  correta       integer not null,            -- index of the correct option
  comentario    text,
  source        text not null default 'seed',-- 'seed' (imported bank) | 'ai' (generated)
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_questions_cat
  on questions(concurso_id, categoria_id) where active;
