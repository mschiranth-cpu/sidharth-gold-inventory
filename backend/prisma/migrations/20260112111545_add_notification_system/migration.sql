/*
  Warnings:

  - You are about to drop the column `relatedId` on the `notifications` table. All the data in the column will be lost.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_ASSIGNMENT', 'WORK_APPROVED', 'WORK_REJECTED', 'URGENT_ASSIGNMENT', 'ORDER_CANCELLED', 'COMMENT_ADDED', 'NEW_ORDER_CREATED', 'ORDER_COMPLETED', 'WORK_SUBMITTED', 'QUALITY_ISSUE', 'ORDER_DELAYED', 'DEPARTMENT_BLOCKED', 'WORKER_IDLE', 'PAYMENT_RECEIVED', 'DAILY_SUMMARY', 'CUSTOMER_INQUIRY', 'ORDER_READY', 'DUE_DATE_APPROACHING', 'PAYMENT_PENDING', 'DELIVERY_SCHEDULED', 'DEPARTMENT_OVERLOAD', 'EQUIPMENT_ISSUE', 'WORKFLOW_CHANGE');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('CRITICAL', 'IMPORTANT', 'INFO', 'SUCCESS');

-- DropIndex
DROP INDEX "notifications_relatedId_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "relatedId",
ADD COLUMN     "actionLabel" TEXT,
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'INFO',
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_orderId_idx" ON "notifications"("orderId");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
