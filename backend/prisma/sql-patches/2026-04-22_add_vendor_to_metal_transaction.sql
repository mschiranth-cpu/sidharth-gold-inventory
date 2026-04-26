-- ============================================================
-- 2026-04-22  Add vendor FK to metal_transactions; drop unused
--             supplier_id column on the same table.
-- ============================================================
-- Local applied via `npx prisma db push`. This file is for prod.
-- Apply with: psql -U postgres -d gold_inventory_db -f <this file>

BEGIN;

-- 1. Add the new vendor_id FK column (nullable, ON DELETE SET NULL)
ALTER TABLE metal_transactions
  ADD COLUMN IF NOT EXISTS vendor_id TEXT;

ALTER TABLE metal_transactions
  DROP CONSTRAINT IF EXISTS metal_transactions_vendor_id_fkey;

ALTER TABLE metal_transactions
  ADD CONSTRAINT metal_transactions_vendor_id_fkey
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS metal_transactions_vendor_id_idx
  ON metal_transactions(vendor_id);

-- 2. Drop the now-unused supplier_id column on metal_transactions only.
--    NOTE: diamond_lots.supplier_id is a separate column on a different
--    table and is NOT touched.
ALTER TABLE metal_transactions
  DROP COLUMN IF EXISTS supplier_id;

COMMIT;
