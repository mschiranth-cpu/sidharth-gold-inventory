-- 2026-05-15 — Phase 4: Diamond Purchase Order tables.
--
-- Idempotent (CREATE … IF NOT EXISTS / DO $$ guards). Wrapped in a single
-- transaction. Adds:
--   1. diamond_purchase_orders
--   2. diamond_purchase_order_lines
--   3. diamond_transactions.purchase_order_id + .purchase_order_line_id FKs

BEGIN;

-- 1. PO header --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diamond_purchase_orders (
  id                       text         PRIMARY KEY,
  po_number                text         NOT NULL UNIQUE,
  vendor_id                text         NOT NULL,
  status                   text         NOT NULL DEFAULT 'DRAFT',
  placed_at                timestamp(3),
  expected_delivery_date   timestamp(3),
  due_date                 timestamp(3),
  notes                    text,
  created_by_id            text         NOT NULL,
  cancelled_at             timestamp(3),
  cancelled_by_id          text,
  cancel_reason            text,
  created_at               timestamp(3) NOT NULL DEFAULT NOW(),
  updated_at               timestamp(3) NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diamond_purchase_orders_vendor_id_fkey'
  ) THEN
    ALTER TABLE diamond_purchase_orders
      ADD CONSTRAINT diamond_purchase_orders_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diamond_purchase_orders_created_by_id_fkey'
  ) THEN
    ALTER TABLE diamond_purchase_orders
      ADD CONSTRAINT diamond_purchase_orders_created_by_id_fkey
      FOREIGN KEY (created_by_id) REFERENCES users(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS diamond_purchase_orders_vendor_id_idx
  ON diamond_purchase_orders (vendor_id);
CREATE INDEX IF NOT EXISTS diamond_purchase_orders_status_idx
  ON diamond_purchase_orders (status);
CREATE INDEX IF NOT EXISTS diamond_purchase_orders_due_date_idx
  ON diamond_purchase_orders (due_date);
CREATE INDEX IF NOT EXISTS diamond_purchase_orders_placed_at_idx
  ON diamond_purchase_orders (placed_at);

-- 2. PO lines ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diamond_purchase_order_lines (
  id                  text         PRIMARY KEY,
  po_id               text         NOT NULL,
  sieve_size_id       integer      NOT NULL,
  shape               text,
  color               text,
  color_band          text,
  clarity             text,
  expected_pieces     integer,
  expected_carats     double precision NOT NULL,
  expected_rate       double precision,
  expected_total      double precision,
  notes               text,
  created_at          timestamp(3) NOT NULL DEFAULT NOW(),
  updated_at          timestamp(3) NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diamond_purchase_order_lines_po_id_fkey'
  ) THEN
    ALTER TABLE diamond_purchase_order_lines
      ADD CONSTRAINT diamond_purchase_order_lines_po_id_fkey
      FOREIGN KEY (po_id) REFERENCES diamond_purchase_orders(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diamond_purchase_order_lines_sieve_size_id_fkey'
  ) THEN
    ALTER TABLE diamond_purchase_order_lines
      ADD CONSTRAINT diamond_purchase_order_lines_sieve_size_id_fkey
      FOREIGN KEY (sieve_size_id) REFERENCES sieve_sizes(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS diamond_purchase_order_lines_po_id_idx
  ON diamond_purchase_order_lines (po_id);
CREATE INDEX IF NOT EXISTS diamond_purchase_order_lines_sieve_size_id_idx
  ON diamond_purchase_order_lines (sieve_size_id);

-- 3. PO link columns on diamond_transactions --------------------------------
ALTER TABLE diamond_transactions
  ADD COLUMN IF NOT EXISTS purchase_order_id text,
  ADD COLUMN IF NOT EXISTS purchase_order_line_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diamond_transactions_purchase_order_id_fkey'
  ) THEN
    ALTER TABLE diamond_transactions
      ADD CONSTRAINT diamond_transactions_purchase_order_id_fkey
      FOREIGN KEY (purchase_order_id) REFERENCES diamond_purchase_orders(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diamond_transactions_purchase_order_line_id_fkey'
  ) THEN
    ALTER TABLE diamond_transactions
      ADD CONSTRAINT diamond_transactions_purchase_order_line_id_fkey
      FOREIGN KEY (purchase_order_line_id) REFERENCES diamond_purchase_order_lines(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS diamond_transactions_purchase_order_id_idx
  ON diamond_transactions (purchase_order_id);
CREATE INDEX IF NOT EXISTS diamond_transactions_purchase_order_line_id_idx
  ON diamond_transactions (purchase_order_line_id);

COMMIT;
