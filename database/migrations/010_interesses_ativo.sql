-- Migration 010 — interruptor para personalizar Aprender/Simulado pelos interesses.
-- Quando true, as trilhas GERAIS (Aprender e Simulado) usam a categoria
-- virtual "interesses" em vez da categoria normal do utilizador.
alter table profiles add column if not exists interesses_ativo boolean not null default false;
