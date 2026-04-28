-- Diamond inventory: full parity with Metal inventory.
--
-- Adds:
--   • diamonds.total_pieces           (parcel piece count for LOOSE; null for SOLITAIRE)
--   • diamond_transactions.*          (vendor link, snapshot fields, billing/payment block)
--   • diamond_payments                (settlement ledger — mirrors metal_payments)
--   • diamond_rates                   (per-shape/color/clarity dated price book)
--   • diamond_transactions vendor FK relation
--
-- Data fix:
--   • legacy transaction_type = 'ISSUE' rows are renamed to 'ISSUE_TO_DEPARTMENT'
--     so list filters / stat cards line up with the new vocabulary.
--
-- All ALTER TABLE columns are nullable / defaulted: no backfill required and
-- the migration is online-safe.

-- ----------------------------------------------------------------------
-- 1. diamonds.total_pieces
-- ----------------------------------------------------------------------
ALTER TABLE "diamonds" ADD COLUMN "total_pieces" INTEGER;

-- ----------------------------------------------------------------------
-- 2. diamond_transactions: snapshot + billing + vendor
-- ----------------------------------------------------------------------
ALTER TABLE "diamond_transactions" ADD COLUMN "department_id"     TEXT;
ALTER TABLE "diamond_transactions" ADD COLUMN "vendor_id"         TEXT;
ALTER TABLE "diamond_transactions" ADD COLUMN "reference_number"  TEXT;

-- Snapshot (linked Diamond row's pricing can change later)
ALTER TABLE "diamond_transactions" ADD COLUMN "carat_weight"      DOUBLE PRECISION;
ALTER TABLE "diamond_transactions" ADD COLUMN "price_per_carat"   DOUBLE PRECISION;
ALTER TABLE "diamond_transactions" ADD COLUMN "total_value"       DOUBLE PRECISION;
ALTER TABLE "diamond_transactions" ADD COLUMN "quantity_pieces"   INTEGER;

-- Payment / billing
ALTER TABLE "diamond_transactions" ADD COLUMN "is_billable"       BOOLEAN;
ALTER TABLE "diamond_transactions" ADD COLUMN "payment_mode"      TEXT;
ALTER TABLE "diamond_transactions" ADD COLUMN "payment_status"    TEXT;
ALTER TABLE "diamond_transactions" ADD COLUMN "amount_paid"       DOUBLE PRECISION;
ALTER TABLE "diamond_transactions" ADD COLUMN "cash_amount"       DOUBLE PRECISION;
ALTER TABLE "diamond_transactions" ADD COLUMN "neft_amount"       DOUBLE PRECISION;
ALTER TABLE "diamond_transactions" ADD COLUMN "neft_utr"          TEXT;
ALTER TABLE "diamond_transactions" ADD COLUMN "neft_bank"         TEXT;
ALTER TABLE "diamond_transactions" ADD COLUMN "neft_date"         TIMESTAMP(3);
ALTER TABLE "diamond_transactions" ADD COLUMN "credit_applied"    DOUBLE PRECISION;
ALTER TABLE "diamond_transactions" ADD COLUMN "credit_generated"  DOUBLE PRECISION;

-- Vendor FK (vendors table already exists)
ALTER TABLE "diamond_transactions"
    ADD CONSTRAINT "diamond_transactions_vendor_id_fkey"
    FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "diamond_transactions_transaction_type_idx" ON "diamond_transactions"("transaction_type");
CREATE INDEX "diamond_transactions_vendor_id_idx"        ON "diamond_transactions"("vendor_id");
CREATE INDEX "diamond_transactions_is_billable_idx"      ON "diamond_transactions"("is_billable");
CREATE INDEX "diamond_transactions_payment_status_idx"   ON "diamond_transactions"("payment_status");

-- ----------------------------------------------------------------------
-- 3. Legacy data fix: 'ISSUE' → 'ISSUE_TO_DEPARTMENT'
-- ----------------------------------------------------------------------
UPDATE "diamond_transactions"
   SET "transaction_type" = 'ISSUE_TO_DEPARTMENT'
 WHERE "transaction_type" = 'ISSUE';

-- ----------------------------------------------------------------------
-- 4. diamond_payments (mirror metal_payments)
-- ----------------------------------------------------------------------
CREATE TABLE "diamond_payments" (
    "id"               TEXT             NOT NULL,
    "transaction_id"   TEXT             NOT NULL,
    "amount"           DOUBLE PRECISION NOT NULL,
    "payment_mode"     TEXT             NOT NULL,
    "cash_amount"      DOUBLE PRECISION,
    "neft_amount"      DOUBLE PRECISION,
    "neft_utr"         TEXT,
    "neft_bank"        TEXT,
    "neft_date"        TIMESTAMP(3),
    "credit_applied"   DOUBLE PRECISION,
    "credit_generated" DOUBLE PRECISION,
    "notes"            TEXT,
    "recorded_by_id"   TEXT             NOT NULL,
    "recorded_at"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diamond_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "diamond_payments_transaction_id_idx" ON "diamond_payments"("transaction_id");
CREATE INDEX "diamond_payments_recorded_at_idx"    ON "diamond_payments"("recorded_at");

ALTER TABLE "diamond_payments"
    ADD CONSTRAINT "diamond_payments_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "diamond_transactions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "diamond_payments"
    ADD CONSTRAINT "diamond_payments_recorded_by_id_fkey"
    FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------------------------------------------------
-- 5. diamond_rates (per shape/color/clarity dated price book)
-- ----------------------------------------------------------------------
CREATE TABLE "diamond_rates" (
    "id"              TEXT             NOT NULL,
    "shape"           "DiamondShape"   NOT NULL,
    "color"           "DiamondColor"   NOT NULL,
    "clarity"         "DiamondClarity" NOT NULL,
    "carat_from"      DOUBLE PRECISION NOT NULL,
    "carat_to"        DOUBLE PRECISION NOT NULL,
    "price_per_carat" DOUBLE PRECISION NOT NULL,
    "effective_date"  TIMESTAMP(3)     NOT NULL,
    "source"          TEXT,
    "created_by_id"   TEXT             NOT NULL,
    "created_at"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diamond_rates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "diamond_rates_shape_color_clarity_effective_date_idx"
    ON "diamond_rates"("shape", "color", "clarity", "effective_date");
CREATE INDEX "diamond_rates_effective_date_idx" ON "diamond_rates"("effective_date");

ALTER TABLE "diamond_rates"
    ADD CONSTRAINT "diamond_rates_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
