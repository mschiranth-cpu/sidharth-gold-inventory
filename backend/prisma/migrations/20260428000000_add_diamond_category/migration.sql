-- Diamond inventory: split into Loose Pieces vs Solitaires.
--
--  • category    : 'LOOSE' or 'SOLITAIRE' (default SOLITAIRE for back-compat)
--  • color_band  : color band string for LOOSE pieces (e.g. 'D/E', 'E/F',
--                  'F/G', 'G/H', 'H/I', 'I/J', 'J/K'). Null for solitaires.
--
-- Existing rows keep their single-grade `color` and become category=SOLITAIRE
-- automatically via the default. No data backfill required.

ALTER TABLE "diamonds" ADD COLUMN "category" VARCHAR(20) NOT NULL DEFAULT 'SOLITAIRE';
ALTER TABLE "diamonds" ADD COLUMN "color_band" VARCHAR(10);

CREATE INDEX "diamonds_category_idx" ON "diamonds"("category");
