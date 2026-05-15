-- 2026-05-16 — Follow-up to Phase 4: add due_date_overridden flag.
--
-- Why:
--   placeDiamondPO must recompute due_date against the actual placedAt
--   timestamp UNLESS the user supplied an explicit override at PO creation.
--   We need a stable signal to distinguish those two cases on the PLACE
--   transition; otherwise a DRAFT created today and placed in two weeks
--   would still carry an outdated dueDate (computed against the draft
--   creation time, not the real place time).
--
-- Rule:
--   * created with explicit data.dueDate  → due_date_overridden = TRUE,
--                                           PLACE preserves dueDate verbatim.
--   * auto-computed from vendor defaults  → due_date_overridden = FALSE,
--                                           PLACE recomputes against placedAt.
--
-- Idempotent (DO $$ guard, so safe to re-run).

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'diamond_purchase_orders'
      AND column_name = 'due_date_overridden'
  ) THEN
    ALTER TABLE diamond_purchase_orders
      ADD COLUMN due_date_overridden boolean NOT NULL DEFAULT FALSE;
  END IF;
END$$;

COMMIT;
