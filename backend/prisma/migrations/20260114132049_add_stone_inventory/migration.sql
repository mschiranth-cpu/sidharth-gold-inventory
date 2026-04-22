/*
  Warnings:

  - You are about to drop the column `approval_status` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `approved_at` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `approved_by_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_source` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `rejection_reason` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `SpecificationTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpecificationTemplate" DROP CONSTRAINT "SpecificationTemplate_userId_fkey";

-- DropForeignKey
ALTER TABLE "diamond_transactions" DROP CONSTRAINT "diamond_transactions_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "diamond_transactions" DROP CONSTRAINT "diamond_transactions_diamond_id_fkey";

-- DropForeignKey
ALTER TABLE "diamond_transactions" DROP CONSTRAINT "diamond_transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "diamonds" DROP CONSTRAINT "diamonds_issued_to_order_id_fkey";

-- DropForeignKey
ALTER TABLE "diamonds" DROP CONSTRAINT "diamonds_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "melting_batches" DROP CONSTRAINT "melting_batches_melted_by_id_fkey";

-- DropForeignKey
ALTER TABLE "metal_rates" DROP CONSTRAINT "metal_rates_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "metal_transactions" DROP CONSTRAINT "metal_transactions_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "metal_transactions" DROP CONSTRAINT "metal_transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "metal_transactions" DROP CONSTRAINT "metal_transactions_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_client_id_fkey";

-- DropForeignKey
ALTER TABLE "party_metal_accounts" DROP CONSTRAINT "party_metal_accounts_party_id_fkey";

-- DropForeignKey
ALTER TABLE "party_metal_transactions" DROP CONSTRAINT "party_metal_transactions_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "party_metal_transactions" DROP CONSTRAINT "party_metal_transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "party_metal_transactions" DROP CONSTRAINT "party_metal_transactions_party_id_fkey";

-- DropForeignKey
ALTER TABLE "real_stone_transactions" DROP CONSTRAINT "real_stone_transactions_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "real_stone_transactions" DROP CONSTRAINT "real_stone_transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "real_stone_transactions" DROP CONSTRAINT "real_stone_transactions_stone_id_fkey";

-- DropForeignKey
ALTER TABLE "stone_packet_transactions" DROP CONSTRAINT "stone_packet_transactions_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "stone_packet_transactions" DROP CONSTRAINT "stone_packet_transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "stone_packet_transactions" DROP CONSTRAINT "stone_packet_transactions_packet_id_fkey";

-- DropIndex
DROP INDEX "clients_user_id_idx";

-- DropIndex
DROP INDEX "diamond_transactions_created_at_idx";

-- DropIndex
DROP INDEX "melting_batches_melted_at_idx";

-- DropIndex
DROP INDEX "metal_rates_effective_date_idx";

-- DropIndex
DROP INDEX "metal_rates_metal_type_purity_effective_date_idx";

-- DropIndex
DROP INDEX "metal_transactions_created_at_idx";

-- DropIndex
DROP INDEX "notification_queue_order_id_idx";

-- DropIndex
DROP INDEX "order_comments_is_internal_idx";

-- DropIndex
DROP INDEX "orders_approval_status_idx";

-- DropIndex
DROP INDEX "orders_client_id_idx";

-- DropIndex
DROP INDEX "orders_order_source_idx";

-- DropIndex
DROP INDEX "party_metal_transactions_created_at_idx";

-- DropIndex
DROP INDEX "party_metal_transactions_party_id_created_at_idx";

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "diamond_lots" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "diamonds" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "feature_modules" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "metal_stock" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_comments" ALTER COLUMN "attachments" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "approval_status",
DROP COLUMN "approved_at",
DROP COLUMN "approved_by_id",
DROP COLUMN "client_id",
DROP COLUMN "order_source",
DROP COLUMN "rejection_reason",
ADD COLUMN     "approvalStatus" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "orderSource" TEXT NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "parties" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "party_metal_accounts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "real_stones" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stone_packets" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "SpecificationTemplate";

-- CreateTable
CREATE TABLE "specification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "specifications" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "specification_templates_userId_idx" ON "specification_templates"("userId");

-- CreateIndex
CREATE INDEX "specification_templates_productType_idx" ON "specification_templates"("productType");

-- CreateIndex
CREATE INDEX "specification_templates_isPublic_idx" ON "specification_templates"("isPublic");

-- CreateIndex
CREATE INDEX "diamond_transactions_created_at_idx" ON "diamond_transactions"("created_at");

-- CreateIndex
CREATE INDEX "melting_batches_melted_at_idx" ON "melting_batches"("melted_at");

-- CreateIndex
CREATE INDEX "metal_rates_effective_date_idx" ON "metal_rates"("effective_date");

-- CreateIndex
CREATE INDEX "metal_rates_metal_type_purity_effective_date_idx" ON "metal_rates"("metal_type", "purity", "effective_date");

-- CreateIndex
CREATE INDEX "metal_transactions_created_at_idx" ON "metal_transactions"("created_at");

-- CreateIndex
CREATE INDEX "party_metal_transactions_created_at_idx" ON "party_metal_transactions"("created_at");

-- CreateIndex
CREATE INDEX "party_metal_transactions_party_id_created_at_idx" ON "party_metal_transactions"("party_id", "created_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specification_templates" ADD CONSTRAINT "specification_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_transactions" ADD CONSTRAINT "metal_transactions_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "metal_stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_transactions" ADD CONSTRAINT "metal_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_transactions" ADD CONSTRAINT "metal_transactions_melting_batch_id_fkey" FOREIGN KEY ("melting_batch_id") REFERENCES "melting_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_transactions" ADD CONSTRAINT "metal_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "melting_batches" ADD CONSTRAINT "melting_batches_melted_by_id_fkey" FOREIGN KEY ("melted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_rates" ADD CONSTRAINT "metal_rates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_metal_accounts" ADD CONSTRAINT "party_metal_accounts_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_metal_transactions" ADD CONSTRAINT "party_metal_transactions_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_metal_transactions" ADD CONSTRAINT "party_metal_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_metal_transactions" ADD CONSTRAINT "party_metal_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diamonds" ADD CONSTRAINT "diamonds_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "diamond_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diamonds" ADD CONSTRAINT "diamonds_issued_to_order_id_fkey" FOREIGN KEY ("issued_to_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diamond_transactions" ADD CONSTRAINT "diamond_transactions_diamond_id_fkey" FOREIGN KEY ("diamond_id") REFERENCES "diamonds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diamond_transactions" ADD CONSTRAINT "diamond_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diamond_transactions" ADD CONSTRAINT "diamond_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_stone_transactions" ADD CONSTRAINT "real_stone_transactions_stone_id_fkey" FOREIGN KEY ("stone_id") REFERENCES "real_stones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_stone_transactions" ADD CONSTRAINT "real_stone_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_stone_transactions" ADD CONSTRAINT "real_stone_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stone_packet_transactions" ADD CONSTRAINT "stone_packet_transactions_packet_id_fkey" FOREIGN KEY ("packet_id") REFERENCES "stone_packets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stone_packet_transactions" ADD CONSTRAINT "stone_packet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stone_packet_transactions" ADD CONSTRAINT "stone_packet_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
