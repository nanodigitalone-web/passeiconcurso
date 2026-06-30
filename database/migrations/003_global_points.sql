-- Migration 003 — fair ranking: lifetime points that never decrease.
-- Idempotent. apply: node server/scripts/apply-migration.mjs database/migrations/003_global_points.sql
--
-- `pontos`         = spendable balance (drops when converted to coins).
-- `pontos_globais` = lifetime earned, NEVER decreases → used by the ranking.

alter table profiles add column if not exists pontos_globais integer not null default 0;

-- Backfill (idempotent via greatest): lifetime = current balance + points
-- already converted to coins. convert stores coins (amount); 1000 pts = 200
-- coins, so points spent = coins * 5.
update profiles p
   set pontos_globais = greatest(
     p.pontos_globais,
     p.pontos + coalesce((
       select sum(c.amount) * 5
         from coin_transactions c
        where c.user_id = p.id and c.tipo = 'convert' and c.amount > 0
     ), 0)
   );

create index if not exists idx_profiles_globais on profiles(pontos_globais desc);
