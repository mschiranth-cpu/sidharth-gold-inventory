-- ============================================
-- PHASE 3: DIAMOND, REAL STONE, AND STONE INVENTORY
-- Migration: 20260114_add_stone_inventory
-- ============================================

-- ============================================
-- ENUMS FOR DIAMOND INVENTORY
-- ============================================

CREATE TYPE "DiamondShape" AS ENUM (
  'ROUND', 'PRINCESS', 'OVAL', 'MARQUISE', 'PEAR', 'CUSHION',
  'EMERALD', 'ASSCHER', 'RADIANT', 'HEART', 'OTHER'
);

CREATE TYPE "DiamondClarity" AS ENUM (
  'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 
  'SI1', 'SI2', 'I1', 'I2', 'I3'
);

CREATE TYPE "DiamondColor" AS ENUM (
  'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N_Z', 'FANCY'
);

CREATE TYPE "DiamondCut" AS ENUM (
  'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'
);

-- ============================================
-- DIAMOND LOT TABLE
-- ============================================

CREATE TABLE "diamond_lots" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "lot_number" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "total_pieces" INTEGER NOT NULL,
  "total_carats" DOUBLE PRECISION NOT NULL,
  "avg_price_per_carat" DOUBLE PRECISION,
  "supplier_id" TEXT,
  "purchase_date" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "diamond_lots_lot_number_idx" ON "diamond_lots"("lot_number");

-- ============================================
-- DIAMONDS TABLE
-- ============================================

CREATE TABLE "diamonds" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "stock_number" TEXT NOT NULL UNIQUE,
  "carat_weight" DOUBLE PRECISION NOT NULL,
  "color" "DiamondColor" NOT NULL,
  "clarity" "DiamondClarity" NOT NULL,
  "cut" "DiamondCut",
  "shape" "DiamondShape" NOT NULL,
  "measurements" TEXT,
  "depth_percent" DOUBLE PRECISION,
  "table_percent" DOUBLE PRECISION,
  "polish" TEXT,
  "symmetry" TEXT,
  "fluorescence" TEXT,
  "certification_lab" TEXT,
  "cert_number" TEXT,
  "cert_date" TIMESTAMP(3),
  "cert_url" TEXT,
  "price_per_carat" DOUBLE PRECISION,
  "total_price" DOUBLE PRECISION,
  "lot_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
  "current_location" TEXT,
  "issued_to_order_id" TEXT,
  "issued_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "diamonds_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "diamond_lots"("id") ON DELETE SET NULL,
  CONSTRAINT "diamonds_issued_to_order_id_fkey" FOREIGN KEY ("issued_to_order_id") REFERENCES "orders"("id") ON DELETE SET NULL
);

CREATE INDEX "diamonds_status_idx" ON "diamonds"("status");
CREATE INDEX "diamonds_shape_color_clarity_idx" ON "diamonds"("shape", "color", "clarity");
CREATE INDEX "diamonds_stock_number_idx" ON "diamonds"("stock_number");

-- ============================================
-- DIAMOND TRANSACTIONS TABLE
-- ============================================

CREATE TABLE "diamond_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "diamond_id" TEXT NOT NULL,
  "transaction_type" TEXT NOT NULL,
  "from_location" TEXT,
  "to_location" TEXT,
  "order_id" TEXT,
  "worker_id" TEXT,
  "notes" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "diamond_transactions_diamond_id_fkey" FOREIGN KEY ("diamond_id") REFERENCES "diamonds"("id") ON DELETE CASCADE,
  CONSTRAINT "diamond_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
  CONSTRAINT "diamond_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);

CREATE INDEX "diamond_transactions_diamond_id_idx" ON "diamond_transactions"("diamond_id");
CREATE INDEX "diamond_transactions_created_at_idx" ON "diamond_transactions"("created_at" DESC);

-- ============================================
-- REAL STONE INVENTORY
-- ============================================

CREATE TYPE "RealStoneType" AS ENUM (
  'RUBY', 'EMERALD', 'BLUE_SAPPHIRE', 'YELLOW_SAPPHIRE', 'PINK_SAPPHIRE',
  'ALEXANDRITE', 'TANZANITE', 'TOURMALINE', 'SPINEL', 'GARNET',
  'AQUAMARINE', 'TOPAZ', 'OPAL', 'PEARL', 'CORAL', 'OTHER'
);

CREATE TABLE "real_stones" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "stock_number" TEXT NOT NULL UNIQUE,
  "stone_type" "RealStoneType" NOT NULL,
  "carat_weight" DOUBLE PRECISION NOT NULL,
  "shape" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "clarity" TEXT,
  "cut" TEXT,
  "origin" TEXT,
  "treatment" TEXT,
  "treatment_notes" TEXT,
  "cert_lab" TEXT,
  "cert_number" TEXT,
  "cert_date" TIMESTAMP(3),
  "price_per_carat" DOUBLE PRECISION,
  "total_price" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "real_stones_status_idx" ON "real_stones"("status");
CREATE INDEX "real_stones_stone_type_idx" ON "real_stones"("stone_type");
CREATE INDEX "real_stones_stock_number_idx" ON "real_stones"("stock_number");

CREATE TABLE "real_stone_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "stone_id" TEXT NOT NULL,
  "transaction_type" TEXT NOT NULL,
  "order_id" TEXT,
  "notes" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "real_stone_transactions_stone_id_fkey" FOREIGN KEY ("stone_id") REFERENCES "real_stones"("id") ON DELETE CASCADE,
  CONSTRAINT "real_stone_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
  CONSTRAINT "real_stone_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);

CREATE INDEX "real_stone_transactions_stone_id_idx" ON "real_stone_transactions"("stone_id");

-- ============================================
-- STONE INVENTORY (Synthetic/Semi-Precious)
-- ============================================

CREATE TYPE "SyntheticStoneType" AS ENUM (
  'CZ', 'AMERICAN_DIAMOND', 'KUNDAN', 'POLKI', 'MOISSANITE',
  'GLASS', 'SYNTHETIC_RUBY', 'SYNTHETIC_EMERALD', 'SYNTHETIC_SAPPHIRE',
  'MARCASITE', 'OTHER'
);

CREATE TABLE "stone_packets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "packet_number" TEXT NOT NULL UNIQUE,
  "stone_type" "SyntheticStoneType" NOT NULL,
  "shape" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quality" TEXT,
  "total_pieces" INTEGER,
  "total_weight" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'CARAT',
  "current_pieces" INTEGER,
  "current_weight" DOUBLE PRECISION NOT NULL,
  "price_per_unit" DOUBLE PRECISION,
  "reorder_level" DOUBLE PRECISION,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "stone_packets_stone_type_size_color_idx" ON "stone_packets"("stone_type", "size", "color");
CREATE INDEX "stone_packets_packet_number_idx" ON "stone_packets"("packet_number");

CREATE TABLE "stone_packet_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "packet_id" TEXT NOT NULL,
  "transaction_type" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "order_id" TEXT,
  "worker_id" TEXT,
  "notes" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "stone_packet_transactions_packet_id_fkey" FOREIGN KEY ("packet_id") REFERENCES "stone_packets"("id") ON DELETE CASCADE,
  CONSTRAINT "stone_packet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
  CONSTRAINT "stone_packet_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);

CREATE INDEX "stone_packet_transactions_packet_id_idx" ON "stone_packet_transactions"("packet_id");

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "diamond_lots" IS 'Diamond lot/parcel management';
COMMENT ON TABLE "diamonds" IS 'Individual diamond records with 4C grading';
COMMENT ON TABLE "diamond_transactions" IS 'Diamond transaction history';
COMMENT ON TABLE "real_stones" IS 'Precious stone inventory (Ruby, Emerald, Sapphire, etc.)';
COMMENT ON TABLE "real_stone_transactions" IS 'Real stone transaction history';
COMMENT ON TABLE "stone_packets" IS 'Synthetic/semi-precious stone packets';
COMMENT ON TABLE "stone_packet_transactions" IS 'Stone packet transaction history';
