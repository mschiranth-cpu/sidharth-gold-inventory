-- 2026-05-15 — Add Vendor.payment_due_days + due_date column on all 4 transaction
-- tables. Backfills due_date for historic PURCHASE rows from
-- (transaction_date + COALESCE(vendor.payment_due_days, 0)).
-- Idempotent: safe to re-run. Wrapped in BEGIN/COMMIT — any failure rolls back.

BEGIN;

-- 1. vendors.payment_due_days  (default credit period in days)
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS payment_due_days integer DEFAULT 0;

-- 2. due_date column on each PURCHASE-bearing transaction table
ALTER TABLE metal_transactions
  ADD COLUMN IF NOT EXISTS due_date timestamp(3);

ALTER TABLE diamond_transactions
  ADD COLUMN IF NOT EXISTS due_date timestamp(3);

ALTER TABLE real_stone_transactions
  ADD COLUMN IF NOT EXISTS due_date timestamp(3);

ALTER TABLE stone_packet_transactions
  ADD COLUMN IF NOT EXISTS due_date timestamp(3);

-- 3. Indexes — required because the aging endpoint scans / orders / buckets by
--    due_date across UNION ALL of all 4 transaction tables. Without these the
--    query degrades to full-table scans per arm.
CREATE INDEX IF NOT EXISTS metal_transactions_due_date_idx
  ON metal_transactions (due_date);
CREATE INDEX IF NOT EXISTS diamond_transactions_due_date_idx
  ON diamond_transactions (due_date);
CREATE INDEX IF NOT EXISTS real_stone_transactions_due_date_idx
  ON real_stone_transactions (due_date);
CREATE INDEX IF NOT EXISTS stone_packet_transactions_due_date_idx
  ON stone_packet_transactions (due_date);

-- 4. Backfill historic PURCHASE rows. Orphan rows (no vendor link) fall back to
--    transaction_date (effectively due-on-receipt). Skip rows that already have
--    a due_date so re-running is safe.
--    NOTE: chunk via a procedural loop on tables with millions of rows; for
--    Sidharth's volumes the single UPDATE is fast enough.
UPDATE metal_transactions t
SET due_date = t.created_at + (COALESCE(v.payment_due_days, 0) || ' days')::interval
FROM vendors v
WHERE t.vendor_id = v.id
  AND t.due_date IS NULL
  AND t.transaction_type = 'PURCHASE';

UPDATE metal_transactions
SET due_date = created_at
WHERE due_date IS NULL
  AND transaction_type = 'PURCHASE'
  AND vendor_id IS NULL;

UPDATE diamond_transactions t
SET due_date = t.created_at + (COALESCE(v.payment_due_days, 0) || ' days')::interval
FROM vendors v
WHERE t.vendor_id = v.id
  AND t.due_date IS NULL
  AND t.transaction_type = 'PURCHASE';

UPDATE diamond_transactions
SET due_date = created_at
WHERE due_date IS NULL
  AND transaction_type = 'PURCHASE'
  AND vendor_id IS NULL;

UPDATE real_stone_transactions t
SET due_date = t.created_at + (COALESCE(v.payment_due_days, 0) || ' days')::interval
FROM vendors v
WHERE t.vendor_id = v.id
  AND t.due_date IS NULL
  AND t.transaction_type = 'PURCHASE';

UPDATE real_stone_transactions
SET due_date = created_at
WHERE due_date IS NULL
  AND transaction_type = 'PURCHASE'
  AND vendor_id IS NULL;

UPDATE stone_packet_transactions t
SET due_date = t.created_at + (COALESCE(v.payment_due_days, 0) || ' days')::interval
FROM vendors v
WHERE t.vendor_id = v.id
  AND t.due_date IS NULL
  AND t.transaction_type = 'PURCHASE';

UPDATE stone_packet_transactions
SET due_date = created_at
WHERE due_date IS NULL
  AND transaction_type = 'PURCHASE'
  AND vendor_id IS NULL;

COMMIT;
