-- AlterTable
ALTER TABLE "department_tracking" ADD COLUMN     "queuePosition" INTEGER,
ADD COLUMN     "queuedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "availabilityStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "lastAssignedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "department_tracking_queuePosition_idx" ON "department_tracking"("queuePosition");

-- CreateIndex
CREATE INDEX "department_tracking_departmentName_queuePosition_idx" ON "department_tracking"("departmentName", "queuePosition");
