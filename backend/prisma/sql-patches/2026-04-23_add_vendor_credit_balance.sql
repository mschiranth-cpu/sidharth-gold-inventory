-- 2026-04-23 — Vendor credit balance + per-transaction credit audit trail.
-- Excess paid on a billable PURCHASE is parked into Vendor.credit_balance and
-- auto-applied (deducted) from the next billable purchase from the same vendor.
-- Idempotent: safe to re-run.

BEGIN;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS credit_balance double precision NOT NULL DEFAULT 0;

ALTER TABLE metal_transactions
  ADD COLUMN IF NOT EXISTS credit_applied   double precision,
  ADD COLUMN IF NOT EXISTS credit_generated double precision;

ALTER TABLE metal_payments
  ADD COLUMN IF NOT EXISTS credit_applied   double precision,
  ADD COLUMN IF NOT EXISTS credit_generated double precision;

COMMIT;
