-- Add `deals_in` text-array column to vendors:
-- which inventory categories this vendor supplies. Drives the
-- VendorSelector filter on each Receive form.
-- Tokens: 'METAL' | 'DIAMOND' | 'REAL_STONE' | 'STONE_PACKET'
ALTER TABLE "vendors"
  ADD COLUMN "deals_in" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill: every existing vendor was created without category info, so
-- mark them as supplying ALL 4 categories. This keeps them visible in
-- every Receive form on day-1 (no behavioural regression). New vendors
-- created after this migration will start from the form's UI default
-- (also all 4 pre-checked) but can be narrowed by the user.
UPDATE "vendors"
   SET "deals_in" = ARRAY['METAL', 'DIAMOND', 'REAL_STONE', 'STONE_PACKET']
 WHERE "deals_in" = ARRAY[]::TEXT[];

-- GIN index for fast `dealsIn { has: '<token>' }` queries on the
-- /api/vendors?dealsIn=METAL filter (Postgres array containment).
CREATE INDEX "vendors_deals_in_idx" ON "vendors" USING GIN ("deals_in");
