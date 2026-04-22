-- ============================================
-- PHASE 1: FEATURE TOGGLE SYSTEM & CLIENT PORTAL
-- Migration: 20260114_add_feature_toggle_and_client_portal
-- ============================================

-- Add CLIENT role to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CLIENT';

-- ============================================
-- FEATURE TOGGLE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "feature_modules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "display_name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "is_global" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "feature_permissions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "feature_id" TEXT NOT NULL,
  "user_id" TEXT,
  "role" "UserRole",
  "department_id" TEXT,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "can_read" BOOLEAN NOT NULL DEFAULT true,
  "can_write" BOOLEAN NOT NULL DEFAULT false,
  "can_delete" BOOLEAN NOT NULL DEFAULT false,
  "enabled_by_id" TEXT,
  "enabled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "feature_permissions_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "feature_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "feature_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "feature_permissions_feature_id_user_id_key" UNIQUE ("feature_id", "user_id"),
  CONSTRAINT "feature_permissions_feature_id_role_key" UNIQUE ("feature_id", "role")
);

CREATE INDEX IF NOT EXISTS "feature_permissions_feature_id_idx" ON "feature_permissions"("feature_id");
CREATE INDEX IF NOT EXISTS "feature_permissions_user_id_idx" ON "feature_permissions"("user_id");
CREATE INDEX IF NOT EXISTS "feature_permissions_role_idx" ON "feature_permissions"("role");

-- ============================================
-- CLIENT PORTAL
-- ============================================

CREATE TABLE IF NOT EXISTS "clients" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL UNIQUE,
  "business_name" TEXT,
  "business_type" TEXT,
  "gst_number" TEXT,
  "pan_number" TEXT,
  "contact_person" TEXT,
  "phone" TEXT,
  "alternate_phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "pincode" TEXT,
  "registration_method" TEXT NOT NULL DEFAULT 'ADMIN_CREATED',
  "approval_status" TEXT NOT NULL DEFAULT 'PENDING',
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "notify_by_email" BOOLEAN NOT NULL DEFAULT true,
  "notify_by_sms" BOOLEAN NOT NULL DEFAULT false,
  "notify_by_whatsapp" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "clients_approval_status_idx" ON "clients"("approval_status");
CREATE INDEX IF NOT EXISTS "clients_business_name_idx" ON "clients"("business_name");
CREATE INDEX IF NOT EXISTS "clients_user_id_idx" ON "clients"("user_id");

-- ============================================
-- ORDER ENHANCEMENTS FOR CLIENT PORTAL
-- ============================================

-- Add client-related columns to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "client_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_source" TEXT NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "approval_status" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "approved_by_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

-- Add foreign key constraint for client_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_client_id_fkey'
  ) THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_fkey" 
      FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "orders_client_id_idx" ON "orders"("client_id");
CREATE INDEX IF NOT EXISTS "orders_order_source_idx" ON "orders"("order_source");
CREATE INDEX IF NOT EXISTS "orders_approval_status_idx" ON "orders"("approval_status");

-- ============================================
-- ORDER COMMENTS (Two-way chat)
-- ============================================

CREATE TABLE IF NOT EXISTS "order_comments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "order_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "is_internal" BOOLEAN NOT NULL DEFAULT false,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "order_comments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "order_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "order_comments_order_id_created_at_idx" ON "order_comments"("order_id", "created_at");
CREATE INDEX IF NOT EXISTS "order_comments_user_id_idx" ON "order_comments"("user_id");
CREATE INDEX IF NOT EXISTS "order_comments_is_internal_idx" ON "order_comments"("is_internal");

-- ============================================
-- NOTIFICATION QUEUE (Future: Email/WhatsApp)
-- ============================================

CREATE TABLE IF NOT EXISTS "notification_queue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recipient_id" TEXT NOT NULL,
  "recipient_type" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "template_id" TEXT,
  "template_data" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "last_attempt_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "error_message" TEXT,
  "order_id" TEXT,
  "scheduled_for" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "notification_queue_status_channel_idx" ON "notification_queue"("status", "channel");
CREATE INDEX IF NOT EXISTS "notification_queue_recipient_id_idx" ON "notification_queue"("recipient_id");
CREATE INDEX IF NOT EXISTS "notification_queue_scheduled_for_idx" ON "notification_queue"("scheduled_for");
CREATE INDEX IF NOT EXISTS "notification_queue_order_id_idx" ON "notification_queue"("order_id");

-- ============================================
-- SEED DEFAULT FEATURE MODULES
-- ============================================

INSERT INTO "feature_modules" ("id", "name", "display_name", "description", "icon", "is_global") VALUES
  (gen_random_uuid()::text, 'CLIENT_PORTAL', 'Client Portal', 'Allow clients to place and track orders', 'Users', false),
  (gen_random_uuid()::text, 'METAL_INVENTORY', 'Metal Inventory', 'Track gold, silver, platinum inventory', 'Package', false),
  (gen_random_uuid()::text, 'PARTY_METAL_INVENTORY', 'Party Metal Inventory', 'Track customer metal for job work', 'UserCheck', false),
  (gen_random_uuid()::text, 'DIAMOND_INVENTORY', 'Diamond Inventory', 'Manage diamond stock with 4C grading', 'Gem', false),
  (gen_random_uuid()::text, 'REAL_STONE_INVENTORY', 'Real Stone Inventory', 'Track precious stones (Ruby, Emerald, Sapphire)', 'Sparkles', false),
  (gen_random_uuid()::text, 'STONE_INVENTORY', 'Stone Inventory', 'Manage CZ, Kundan, Polki stones', 'Circle', false),
  (gen_random_uuid()::text, 'FACTORY_INVENTORY', 'Factory Inventory', 'Track tools, consumables, equipment', 'Wrench', false),
  (gen_random_uuid()::text, 'ATTENDANCE', 'Attendance System', 'Employee attendance with photo check-in', 'Calendar', false),
  (gen_random_uuid()::text, 'PAYROLL', 'Payroll System', 'Salary calculation and payslip generation', 'DollarSign', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ENABLE CLIENT PORTAL FOR ADMIN BY DEFAULT
-- Note: This will be done via backend service after migration
-- ============================================

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "feature_modules" IS 'Feature toggle system - defines available modules';
COMMENT ON TABLE "feature_permissions" IS 'Feature permissions per user/role/department';
COMMENT ON TABLE "clients" IS 'Client/customer accounts for portal access';
COMMENT ON TABLE "order_comments" IS 'Two-way communication on orders';
COMMENT ON TABLE "notification_queue" IS 'Queue for future email/SMS/WhatsApp notifications';
