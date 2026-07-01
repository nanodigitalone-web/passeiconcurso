-- 014_payment_amount.sql
-- Add amount_aoa to payment_requests so revenue can be tracked per subscription
-- (existing approved rows stay at 0 — admin will backfill manually if needed)
ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS amount_aoa integer NOT NULL DEFAULT 0;
