-- ============================================
-- PHASE 2: METAL INVENTORY & PARTY METAL INVENTORY
-- Migration: 20260114_add_metal_inventory
-- ============================================

-- ============================================
-- ENUMS FOR METAL INVENTORY
-- ============================================

CREATE TYPE "MetalType" AS ENUM ('GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM');
CREATE TYPE "MetalForm" AS ENUM ('BAR', 'WIRE', 'SHEET', 'GRAIN', 'SCRAP', 'FINISHED_PIECE', 'CUSTOMER_METAL');
CREATE TYPE "MetalTransactionType" AS ENUM (
  'PURCHASE',
  'SALE',
  'ISSUE_TO_DEPARTMENT',
  'RETURN_FROM_DEPARTMENT',
  'MELTING_IN',
  'MELTING_OUT',
  'WASTAGE',
  'ADJUSTMENT',
  'CUSTOMER_METAL_IN',
  'CUSTOMER_METAL_OUT'
);

-- ============================================
-- METAL STOCK TABLE
-- ============================================

CREATE TABLE "metal_stock" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "metal_type" "MetalType" NOT NULL,
  "purity" DOUBLE PRECISION NOT NULL,
  "form" "MetalForm" NOT NULL,
  "gross_weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pure_weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "location" TEXT,
  "batch_number" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "metal_stock_metal_type_idx" ON "metal_stock"("metal_type");
CREATE INDEX "metal_stock_purity_idx" ON "metal_stock"("purity");
CREATE INDEX "metal_stock_form_idx" ON "metal_stock"("form");
CREATE INDEX "metal_stock_metal_type_purity_idx" ON "metal_stock"("metal_type", "purity");

-- ============================================
-- METAL TRANSACTIONS TABLE
-- ============================================

CREATE TABLE "metal_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transaction_type" "MetalTransactionType" NOT NULL,
  "metal_type" "MetalType" NOT NULL,
  "purity" DOUBLE PRECISION NOT NULL,
  "form" "MetalForm" NOT NULL,
  "gross_weight" DOUBLE PRECISION NOT NULL,
  "pure_weight" DOUBLE PRECISION NOT NULL,
  "rate" DOUBLE PRECISION,
  "total_value" DOUBLE PRECISION,
  "stock_id" TEXT,
  "order_id" TEXT,
  "department_id" TEXT,
  "worker_id" TEXT,
  "supplier_id" TEXT,
  "melting_batch_id" TEXT,
  "notes" TEXT,
  "reference_number" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "metal_transactions_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "metal_stock"("id") ON DELETE SET NULL,
  CONSTRAINT "metal_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
  CONSTRAINT "metal_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);

CREATE INDEX "metal_transactions_metal_type_idx" ON "metal_transactions"("metal_type");
CREATE INDEX "metal_transactions_transaction_type_idx" ON "metal_transactions"("transaction_type");
CREATE INDEX "metal_transactions_created_at_idx" ON "metal_transactions"("created_at" DESC);
CREATE INDEX "metal_transactions_metal_type_transaction_type_idx" ON "metal_transactions"("metal_type", "transaction_type");

-- ============================================
-- MELTING BATCH TABLE
-- ============================================

CREATE TABLE "melting_batches" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "batch_number" TEXT NOT NULL UNIQUE,
  "input_metals" JSONB NOT NULL,
  "total_input_weight" DOUBLE PRECISION NOT NULL,
  "output_purity" DOUBLE PRECISION NOT NULL,
  "output_weight" DOUBLE PRECISION NOT NULL,
  "output_form" "MetalForm" NOT NULL,
  "wastage_weight" DOUBLE PRECISION NOT NULL,
  "wastage_percent" DOUBLE PRECISION NOT NULL,
  "melted_by_id" TEXT NOT NULL,
  "melted_at" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "melting_batches_melted_by_id_fkey" FOREIGN KEY ("melted_by_id") REFERENCES "users"("id")
);

CREATE INDEX "melting_batches_batch_number_idx" ON "melting_batches"("batch_number");
CREATE INDEX "melting_batches_melted_at_idx" ON "melting_batches"("melted_at" DESC);

-- ============================================
-- METAL RATES TABLE
-- ============================================

CREATE TABLE "metal_rates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "metal_type" "MetalType" NOT NULL,
  "purity" DOUBLE PRECISION NOT NULL,
  "rate_per_gram" DOUBLE PRECISION NOT NULL,
  "effective_date" TIMESTAMP(3) NOT NULL,
  "source" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "metal_rates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);

CREATE INDEX "metal_rates_metal_type_idx" ON "metal_rates"("metal_type");
CREATE INDEX "metal_rates_effective_date_idx" ON "metal_rates"("effective_date" DESC);
CREATE INDEX "metal_rates_metal_type_purity_effective_date_idx" ON "metal_rates"("metal_type", "purity", "effective_date" DESC);

-- ============================================
-- PARTY METAL INVENTORY
-- ============================================

CREATE TABLE "parties" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "gst_number" TEXT,
  "pan_number" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "parties_name_idx" ON "parties"("name");
CREATE INDEX "parties_type_idx" ON "parties"("type");

CREATE TABLE "party_metal_accounts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "party_id" TEXT NOT NULL,
  "metal_type" "MetalType" NOT NULL,
  "purity" DOUBLE PRECISION NOT NULL,
  "gross_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pure_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "party_metal_accounts_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE,
  CONSTRAINT "party_metal_accounts_party_id_metal_type_purity_key" UNIQUE ("party_id", "metal_type", "purity")
);

CREATE INDEX "party_metal_accounts_party_id_idx" ON "party_metal_accounts"("party_id");

CREATE TABLE "party_metal_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "party_id" TEXT NOT NULL,
  "transaction_type" TEXT NOT NULL,
  "metal_type" "MetalType" NOT NULL,
  "gross_weight" DOUBLE PRECISION NOT NULL,
  "tested_purity" DOUBLE PRECISION,
  "declared_purity" DOUBLE PRECISION NOT NULL,
  "pure_weight" DOUBLE PRECISION NOT NULL,
  "order_id" TEXT,
  "voucher_number" TEXT NOT NULL,
  "notes" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "party_metal_transactions_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE,
  CONSTRAINT "party_metal_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
  CONSTRAINT "party_metal_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);

CREATE INDEX "party_metal_transactions_party_id_idx" ON "party_metal_transactions"("party_id");
CREATE INDEX "party_metal_transactions_created_at_idx" ON "party_metal_transactions"("created_at" DESC);
CREATE INDEX "party_metal_transactions_party_id_created_at_idx" ON "party_metal_transactions"("party_id", "created_at" DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "metal_stock" IS 'Metal inventory stock register';
COMMENT ON TABLE "metal_transactions" IS 'All metal transactions (purchase, issue, return, etc.)';
COMMENT ON TABLE "melting_batches" IS 'Melting batch records with wastage tracking';
COMMENT ON TABLE "metal_rates" IS 'Metal rate history';
COMMENT ON TABLE "parties" IS 'Customer/supplier master for party metal';
COMMENT ON TABLE "party_metal_accounts" IS 'Party-wise metal balance accounts';
COMMENT ON TABLE "party_metal_transactions" IS 'Party metal transactions';
