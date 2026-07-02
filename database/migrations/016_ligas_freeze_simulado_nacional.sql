-- Migration 016: ligas semanais, streak freeze e Simulado Nacional

-- ---- Ligas semanais ---------------------------------------------------
-- Divisão do utilizador: 0=Bronze, 1=Prata, 2=Ouro, 3=Diamante, 4=Lenda.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS league integer NOT NULL DEFAULT 0;

-- Uma linha por semana já processada (promoções/despromoções aplicadas).
-- O rollover é lazy: o primeiro pedido a /ranking/league numa semana nova
-- processa a semana anterior (com advisory lock para não duplicar).
CREATE TABLE IF NOT EXISTS league_rollovers (
  week_start   date PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- ---- Streak freeze ----------------------------------------------------
-- Inventário de congelamentos (comprados com moedas; máx. 2 em posse).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freezes integer NOT NULL DEFAULT 0;

-- Dias em que um congelamento foi consumido (contam como dia activo no streak).
CREATE TABLE IF NOT EXISTS streak_freeze_uses (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day     date NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

-- ---- Simulado Nacional --------------------------------------------------
-- Evento cronometrado: todos respondem ao MESMO conjunto de questões
-- (congelado em question_ids na criação) dentro da janela starts_at..ends_at.
CREATE TABLE IF NOT EXISTS national_exams (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  description       text,
  concurso_id       text,                          -- null = geral (banco todo)
  categoria_id      text,
  question_ids      jsonb NOT NULL DEFAULT '[]',
  question_count    integer NOT NULL DEFAULT 50,
  duration_minutes  integer NOT NULL DEFAULT 45,
  entry_cost_moedas integer NOT NULL DEFAULT 0,    -- 0 = grátis
  prize_moedas      jsonb NOT NULL DEFAULT '[200,100,50]', -- prémios 1.º/2.º/3.º
  starts_at         timestamptz NOT NULL,
  ends_at           timestamptz NOT NULL,
  finalized         boolean NOT NULL DEFAULT false,
  created_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_national_exams_window ON national_exams(starts_at, ends_at);

CREATE TABLE IF NOT EXISTS national_exam_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id     uuid NOT NULL REFERENCES national_exams(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  started_at  timestamptz,
  finished_at timestamptz,
  score       integer,          -- nº de respostas certas
  total       integer,
  duration_ms integer,
  answers     jsonb,
  UNIQUE (exam_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_exam_entries_exam ON national_exam_entries(exam_id, score DESC, duration_ms ASC);
CREATE INDEX IF NOT EXISTS idx_exam_entries_user ON national_exam_entries(user_id);
