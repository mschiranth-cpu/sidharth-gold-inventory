-- CreateTable
CREATE TABLE "department_work_data" (
    "id" TEXT NOT NULL,
    "departmentTrackingId" TEXT NOT NULL,
    "formData" JSONB,
    "uploadedFiles" JSONB,
    "uploadedPhotos" JSONB,
    "workStartedAt" TIMESTAMP(3),
    "workCompletedAt" TIMESTAMP(3),
    "timeSpent" DOUBLE PRECISION,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "validationErrors" JSONB,
    "lastSavedAt" TIMESTAMP(3),
    "autoSaveData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_work_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_work_data_departmentTrackingId_key" ON "department_work_data"("departmentTrackingId");

-- CreateIndex
CREATE INDEX "department_work_data_departmentTrackingId_idx" ON "department_work_data"("departmentTrackingId");

-- CreateIndex
CREATE INDEX "department_work_data_isComplete_idx" ON "department_work_data"("isComplete");

-- CreateIndex
CREATE INDEX "department_work_data_isDraft_idx" ON "department_work_data"("isDraft");

-- CreateIndex
CREATE INDEX "department_work_data_workCompletedAt_idx" ON "department_work_data"("workCompletedAt");

-- AddForeignKey
ALTER TABLE "department_work_data" ADD CONSTRAINT "department_work_data_departmentTrackingId_fkey" FOREIGN KEY ("departmentTrackingId") REFERENCES "department_tracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
