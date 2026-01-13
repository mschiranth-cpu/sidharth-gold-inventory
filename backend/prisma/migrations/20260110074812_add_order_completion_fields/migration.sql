-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "currentDepartment" "DepartmentName";

-- CreateIndex
CREATE INDEX "orders_currentDepartment_idx" ON "orders"("currentDepartment");

-- CreateIndex
CREATE INDEX "orders_completedAt_idx" ON "orders"("completedAt");
