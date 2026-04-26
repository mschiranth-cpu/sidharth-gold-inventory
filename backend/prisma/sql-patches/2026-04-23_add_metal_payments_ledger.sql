-- ============================================================
-- 2026-04-23  Create metal_payments ledger table (append-only
--             history of partial payment settlements against
--             a billable metal transaction).
-- ============================================================
-- Local applied via `npx prisma db push`. This file is for prod.
-- Apply with: psql -U postgres -d gold_inventory_db -f <this file>
-- (Set PGPASSWORD inline before running on prod.)

BEGIN;

CREATE TABLE IF NOT EXISTS metal_payments (
  id              TEXT             PRIMARY KEY,
  transaction_id  TEXT             NOT NULL,
  amount          DOUBLE PRECISION NOT NULL,
  payment_mode    TEXT             NOT NULL,        -- 'CASH' | 'NEFT' | 'BOTH'
  cash_amount     DOUBLE PRECISION,
  neft_amount     DOUBLE PRECISION,
  neft_utr        TEXT,
  neft_bank       TEXT,
  neft_date       TIMESTAMP(3),
  notes           TEXT,
  recorded_by_id  TEXT             NOT NULL,
  recorded_at     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FK: cascade delete payments when the parent transaction is removed.
ALTER TABLE metal_payments
  DROP CONSTRAINT IF EXISTS metal_payments_transaction_id_fkey;
ALTER TABLE metal_payments
  ADD CONSTRAINT metal_payments_transaction_id_fkey
  FOREIGN KEY (transaction_id) REFERENCES metal_transactions(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

-- FK to recording user (no cascade — keep the audit trail if user deleted).
ALTER TABLE metal_payments
  DROP CONSTRAINT IF EXISTS metal_payments_recorded_by_id_fkey;
ALTER TABLE metal_payments
  ADD CONSTRAINT metal_payments_recorded_by_id_fkey
  FOREIGN KEY (recorded_by_id) REFERENCES users(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS metal_payments_transaction_id_idx
  ON metal_payments(transaction_id);
CREATE INDEX IF NOT EXISTS metal_payments_recorded_at_idx
  ON metal_payments(recorded_at);

COMMIT;
