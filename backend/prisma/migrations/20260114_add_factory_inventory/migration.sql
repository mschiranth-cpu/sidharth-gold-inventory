-- ============================================
-- PHASE 4: FACTORY INVENTORY
-- Migration: 20260114_add_factory_inventory
-- ============================================

-- ============================================
-- FACTORY ITEM CATEGORIES
-- ============================================

CREATE TABLE "factory_item_categories" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "parent_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "factory_item_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "factory_item_categories"("id") ON DELETE SET NULL
);

CREATE INDEX "factory_item_categories_parent_id_idx" ON "factory_item_categories"("parent_id");
CREATE INDEX "factory_item_categories_name_idx" ON "factory_item_categories"("name");

-- ============================================
-- FACTORY ITEMS
-- ============================================

CREATE TABLE "factory_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "item_code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category_id" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "current_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "min_stock" DOUBLE PRECISION,
  "max_stock" DOUBLE PRECISION,
  "reorder_qty" DOUBLE PRECISION,
  "last_purchase_price" DOUBLE PRECISION,
  "avg_price" DOUBLE PRECISION,
  "location" TEXT,
  "is_equipment" BOOLEAN NOT NULL DEFAULT false,
  "serial_number" TEXT,
  "purchase_date" TIMESTAMP(3),
  "warranty_end" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "factory_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "factory_item_categories"("id")
);

CREATE INDEX "factory_items_item_code_idx" ON "factory_items"("item_code");
CREATE INDEX "factory_items_category_id_idx" ON "factory_items"("category_id");
CREATE INDEX "factory_items_is_equipment_idx" ON "factory_items"("is_equipment");

-- ============================================
-- FACTORY ITEM TRANSACTIONS
-- ============================================

CREATE TABLE "factory_item_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "item_id" TEXT NOT NULL,
  "transaction_type" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "rate" DOUBLE PRECISION,
  "total_value" DOUBLE PRECISION,
  "department_id" TEXT,
  "worker_id" TEXT,
  "vendor_id" TEXT,
  "reference_number" TEXT,
  "notes" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "factory_item_transactions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "factory_items"("id") ON DELETE CASCADE,
  CONSTRAINT "factory_item_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);

CREATE INDEX "factory_item_transactions_item_id_idx" ON "factory_item_transactions"("item_id");
CREATE INDEX "factory_item_transactions_created_at_idx" ON "factory_item_transactions"("created_at" DESC);

-- ============================================
-- EQUIPMENT MAINTENANCE
-- ============================================

CREATE TABLE "equipment_maintenance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "equipment_id" TEXT NOT NULL,
  "maintenance_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "cost" DOUBLE PRECISION,
  "performed_by" TEXT,
  "performed_at" TIMESTAMP(3) NOT NULL,
  "next_due_date" TIMESTAMP(3),
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "equipment_maintenance_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "factory_items"("id") ON DELETE CASCADE,
  CONSTRAINT "equipment_maintenance_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);

CREATE INDEX "equipment_maintenance_equipment_id_idx" ON "equipment_maintenance"("equipment_id");
CREATE INDEX "equipment_maintenance_performed_at_idx" ON "equipment_maintenance"("performed_at" DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "factory_item_categories" IS 'Factory inventory item categories';
COMMENT ON TABLE "factory_items" IS 'Factory tools, consumables, and equipment';
COMMENT ON TABLE "factory_item_transactions" IS 'Factory item transaction history';
COMMENT ON TABLE "equipment_maintenance" IS 'Equipment maintenance records';
