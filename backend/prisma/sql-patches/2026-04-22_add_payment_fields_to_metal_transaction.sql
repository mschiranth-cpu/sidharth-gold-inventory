-- ============================================================
-- 2026-04-22  Add payment tracking fields to metal_transactions.
-- ============================================================
-- Local applied via `npx prisma db push`. This file is for prod.
-- Apply with: psql -U postgres -d gold_inventory_db -f <this file>
-- (Set PGPASSWORD inline before running on prod.)

BEGIN;

-- Payment fields. All nullable — only PURCHASE rows from ReceiveMetalPage
-- ever set these. ISSUE_TO_DEPARTMENT and other transaction types remain NULL.
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS is_billable    BOOLEAN;
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS payment_mode   TEXT;        -- 'CASH' | 'NEFT' | 'BOTH'
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS payment_status TEXT;        -- 'COMPLETE' | 'HALF' | 'PENDING'
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS amount_paid    DOUBLE PRECISION;
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS cash_amount    DOUBLE PRECISION;
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS neft_amount    DOUBLE PRECISION;
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS neft_utr       TEXT;
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS neft_bank      TEXT;
ALTER TABLE metal_transactions ADD COLUMN IF NOT EXISTS neft_date      TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS metal_transactions_is_billable_idx
  ON metal_transactions(is_billable);
CREATE INDEX IF NOT EXISTS metal_transactions_payment_status_idx
  ON metal_transactions(payment_status);

COMMIT;
