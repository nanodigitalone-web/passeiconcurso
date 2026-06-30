-- Migration 005 — friend referrals.
-- Tracks who invited each user (set once) so the +100 points reward is granted
-- exactly once per new signup.
alter table profiles add column if not exists referred_by uuid references users(id) on delete set null;
