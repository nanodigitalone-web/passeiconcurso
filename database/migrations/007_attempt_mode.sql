-- Migration 007 — distinguish Aprender vs Simulado attempts.
-- Lets the infinite "Aprender" trail count its own questions for levels.
alter table question_attempts add column if not exists mode text not null default 'simulado';
create index if not exists idx_attempts_user_mode
  on question_attempts(user_id, concurso_id, categoria_id, mode);
