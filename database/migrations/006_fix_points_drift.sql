-- Migration 006 — repair points drift.
-- The lifetime total (pontos_globais) must always be >= the spendable balance
-- (pontos). A deploy gap let some balances grow without the total, so a few
-- users showed "disponíveis > totais" even without trading. greatest() repairs
-- that without touching legitimate traders (where total > balance). Idempotent.
update profiles set pontos_globais = greatest(pontos_globais, pontos)
 where pontos_globais < pontos;
