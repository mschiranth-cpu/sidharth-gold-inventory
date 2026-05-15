-- 2026-05-15 — Phase 3: Diamond sieve master + sieveSizeId FKs.
--
-- Idempotent: safe to re-run. Wrapped in a single transaction.
-- Adds:
--   1. sieve_sizes table (33 MESH + 8 SINGLE rows)
--   2. diamonds.sieve_size_id FK
--   3. diamond_transactions.sieve_size_id FK
--   4. Seed data populated via INSERT … ON CONFLICT (code) DO NOTHING.

BEGIN;

-- 1. master table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sieve_sizes (
  id                    serial      PRIMARY KEY,
  kind                  text        NOT NULL,
  code                  text        NOT NULL UNIQUE,
  sieve_code_from       text,
  sieve_code_to         text,
  size_label            text,
  pieces_per_carat_avg  double precision,
  weight_per_piece_ct   double precision,
  mm_from               double precision NOT NULL,
  mm_to                 double precision NOT NULL,
  display_order         integer     NOT NULL DEFAULT 0,
  is_active             boolean     NOT NULL DEFAULT TRUE,
  created_at            timestamp(3) NOT NULL DEFAULT NOW(),
  updated_at            timestamp(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sieve_sizes_kind_display_order_idx
  ON sieve_sizes (kind, display_order);
CREATE INDEX IF NOT EXISTS sieve_sizes_is_active_idx
  ON sieve_sizes (is_active);

-- 2. FK columns on existing tables ------------------------------------------
ALTER TABLE diamonds
  ADD COLUMN IF NOT EXISTS sieve_size_id integer;

ALTER TABLE diamond_transactions
  ADD COLUMN IF NOT EXISTS sieve_size_id integer;

-- Add FK constraints only if they don't already exist. Naming matches what
-- Prisma 5 produces so a future migrate-from-introspect won't see a drift.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diamonds_sieve_size_id_fkey'
  ) THEN
    ALTER TABLE diamonds
      ADD CONSTRAINT diamonds_sieve_size_id_fkey
      FOREIGN KEY (sieve_size_id) REFERENCES sieve_sizes(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diamond_transactions_sieve_size_id_fkey'
  ) THEN
    ALTER TABLE diamond_transactions
      ADD CONSTRAINT diamond_transactions_sieve_size_id_fkey
      FOREIGN KEY (sieve_size_id) REFERENCES sieve_sizes(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS diamonds_sieve_size_id_idx
  ON diamonds (sieve_size_id);
CREATE INDEX IF NOT EXISTS diamond_transactions_sieve_size_id_idx
  ON diamond_transactions (sieve_size_id);

-- 3. Seed sieve master data -------------------------------------------------
-- MESH rows (33). Each has both `code` (e.g. "+11/-11.5") and the from/to
-- pieces-per-carat as published in the user's chart. ON CONFLICT keeps
-- re-runs safe.
INSERT INTO sieve_sizes (
  kind, code, sieve_code_from, sieve_code_to,
  pieces_per_carat_avg, weight_per_piece_ct, mm_from, mm_to, display_order
) VALUES
  ('MESH','+000/-00','+000','-00',215,0.004,0.90,1.00,1),
  ('MESH','+00/-0','+00','-0',200,0.005,1.00,1.10,2),
  ('MESH','+0/-1','+0','-1',175,0.006,1.10,1.15,3),
  ('MESH','+1/-1.5','+1','-1.5',150,0.007,1.15,1.20,4),
  ('MESH','+1.5/-2','+1.5','-2',120,0.008,1.20,1.25,5),
  ('MESH','+2/-2.5','+2','-2.5',110,0.009,1.25,1.30,6),
  ('MESH','+2.5/-3','+2.5','-3',110,0.010,1.30,1.35,7),
  ('MESH','+3/-3.5','+3','-3.5',110,0.011,1.35,1.40,8),
  ('MESH','+3.5/-4','+3.5','-4',80,0.012,1.40,1.45,9),
  ('MESH','+4/-4.5','+4','-4.5',80,0.013,1.45,1.50,10),
  ('MESH','+4.5/-5','+4.5','-5',70,0.014,1.50,1.55,11),
  ('MESH','+5/-5.5','+5','-5.5',60,0.016,1.55,1.60,12),
  ('MESH','+5.5/-6','+5.5','-6',50,0.018,1.60,1.70,13),
  ('MESH','+6/-6.5','+6','-6.5',50,0.021,1.70,1.80,14),
  ('MESH','+6.5/-7','+6.5','-7',40,0.025,1.80,1.90,15),
  ('MESH','+7/-7.5','+7','-7.5',30,0.029,1.90,2.00,16),
  ('MESH','+7.5/-8','+7.5','-8',30,0.035,2.00,2.10,17),
  ('MESH','+8/-8.5','+8','-8.5',25,0.039,2.10,2.20,18),
  ('MESH','+8.5/-9','+8.5','-9',25,0.044,2.20,2.30,19),
  ('MESH','+9/-9.5','+9','-9.5',20,0.052,2.30,2.40,20),
  ('MESH','+9.5/-10','+9.5','-10',20,0.058,2.40,2.50,21),
  ('MESH','+10/-10.5','+10','-10.5',15,0.069,2.50,2.60,22),
  ('MESH','+10.5/-11','+10.5','-11',15,0.074,2.60,2.70,23),
  ('MESH','+11/-11.5','+11','-11.5',12,0.078,2.70,2.80,24),
  ('MESH','+11.5/-12','+11.5','-12',12,0.086,2.80,2.90,25),
  ('MESH','+12/-12.5','+12','-12.5',10,0.095,2.90,3.00,26),
  ('MESH','+12.5/-13','+12.5','-13',10,0.108,3.00,3.10,27),
  ('MESH','+13/-13.5','+13','-13.5',8,0.116,3.10,3.20,28),
  ('MESH','+13.5/-14','+13.5','-14',8,0.125,3.20,3.30,29),
  ('MESH','+14/-14.5','+14','-14.5',7,0.135,3.30,3.40,30),
  ('MESH','+14.5/-15','+14.5','-15',7,0.146,3.40,3.50,31),
  ('MESH','+15/-15.5','+15','-15.5',6,0.159,3.50,3.60,32),
  ('MESH','+15.5/-16','+15.5','-16',6,0.175,3.60,3.70,33)
ON CONFLICT (code) DO NOTHING;

-- SINGLE rows (8) — single-stone size buckets, one stone == carats column.
INSERT INTO sieve_sizes (
  kind, code, size_label, weight_per_piece_ct, mm_from, mm_to, display_order
) VALUES
  ('SINGLE','0.20Ct','0.20 Cts',0.20,3.60,3.80,101),
  ('SINGLE','0.25Ct','0.25 Cts',0.25,3.80,4.20,102),
  ('SINGLE','0.30Ct','0.30 Cts',0.30,4.20,4.60,103),
  ('SINGLE','0.40Ct','0.40 Cts',0.40,4.60,5.00,104),
  ('SINGLE','0.50Ct','0.50 Cts',0.50,5.00,5.30,105),
  ('SINGLE','0.60Ct','0.60 Cts',0.60,5.30,5.60,106),
  ('SINGLE','0.70Ct','0.70 Cts',0.70,5.60,5.90,107),
  ('SINGLE','0.80Ct','0.80 Cts',0.80,5.90,6.10,108)
ON CONFLICT (code) DO NOTHING;

COMMIT;
