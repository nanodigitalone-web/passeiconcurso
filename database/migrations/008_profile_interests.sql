-- Migration 008 — perfil académico + áreas de interesse.
-- A app passa a adaptar-se às disciplinas/temas de interesse do utilizador.
alter table profiles add column if not exists universidade text;
alter table profiles add column if not exists curso text;
alter table profiles add column if not exists ano text;
alter table profiles add column if not exists interesses jsonb not null default '[]'::jsonb;
