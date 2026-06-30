-- Migration 004 — persistent lives for the "Aprender" mode.
-- Idempotent. 5 lives max; 1 recharges every 3 hours (logic in the backend).
alter table profiles add column if not exists vidas integer not null default 5;
alter table profiles add column if not exists vidas_updated_at timestamptz not null default now();
