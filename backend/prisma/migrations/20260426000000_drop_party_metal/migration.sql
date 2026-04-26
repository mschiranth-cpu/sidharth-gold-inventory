-- DropForeignKey
ALTER TABLE "party_metal_accounts" DROP CONSTRAINT IF EXISTS "party_metal_accounts_party_id_fkey";

-- DropForeignKey
ALTER TABLE "party_metal_transactions" DROP CONSTRAINT IF EXISTS "party_metal_transactions_party_id_fkey";

-- DropForeignKey
ALTER TABLE "party_metal_transactions" DROP CONSTRAINT IF EXISTS "party_metal_transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "party_metal_transactions" DROP CONSTRAINT IF EXISTS "party_metal_transactions_created_by_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "party_metal_transactions";

-- DropTable
DROP TABLE IF EXISTS "party_metal_accounts";

-- DropTable
DROP TABLE IF EXISTS "parties";

-- Remove feature module record (idempotent)
DELETE FROM "feature_modules" WHERE name = 'party_metal';
