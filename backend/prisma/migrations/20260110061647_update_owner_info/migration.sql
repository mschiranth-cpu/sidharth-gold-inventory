-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'IN_FACTORY', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DepartmentName" AS ENUM ('CAD', 'PRINT', 'CASTING', 'FILLING', 'MEENA', 'POLISH_1', 'SETTING', 'POLISH_2', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "StoneType" AS ENUM ('DIAMOND', 'RUBY', 'EMERALD', 'SAPPHIRE', 'PEARL', 'KUNDAN', 'POLKI', 'CZ', 'AMERICAN_DIAMOND', 'SEMI_PRECIOUS', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DEPARTMENT_WORKER',
    "department" "DepartmentName",
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "productPhotoUrl" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_details" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "goldWeightInitial" DOUBLE PRECISION NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "goldColor" TEXT,
    "size" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "productType" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "additionalDescription" TEXT,
    "specialInstructions" TEXT,
    "referenceImages" TEXT[],
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stones" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stoneType" "StoneType" NOT NULL,
    "stoneName" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT,
    "clarity" TEXT,
    "cut" TEXT,
    "shape" TEXT,
    "setting" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_tracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "departmentName" "DepartmentName" NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "status" "DepartmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "assignedToId" TEXT,
    "goldWeightIn" DOUBLE PRECISION,
    "goldWeightOut" DOUBLE PRECISION,
    "goldLoss" DOUBLE PRECISION,
    "estimatedHours" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "photos" TEXT[],
    "issues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_submissions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "finalGoldWeight" DOUBLE PRECISION NOT NULL,
    "finalStoneWeight" DOUBLE PRECISION NOT NULL,
    "finalPurity" DOUBLE PRECISION NOT NULL,
    "numberOfPieces" INTEGER NOT NULL DEFAULT 1,
    "totalWeight" DOUBLE PRECISION,
    "qualityGrade" TEXT,
    "qualityNotes" TEXT,
    "completionPhotos" TEXT[],
    "certificateUrl" TEXT,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvalDate" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "final_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_department_idx" ON "users"("department");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_department_isActive_idx" ON "users"("department", "isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_customerName_idx" ON "orders"("customerName");

-- CreateIndex
CREATE INDEX "orders_createdById_idx" ON "orders"("createdById");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_priority_idx" ON "orders"("priority" DESC);

-- CreateIndex
CREATE INDEX "orders_status_priority_idx" ON "orders"("status", "priority" DESC);

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_createdById_status_idx" ON "orders"("createdById", "status");

-- CreateIndex
CREATE INDEX "orders_updatedAt_idx" ON "orders"("updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "order_details_orderId_key" ON "order_details"("orderId");

-- CreateIndex
CREATE INDEX "order_details_orderId_idx" ON "order_details"("orderId");

-- CreateIndex
CREATE INDEX "order_details_dueDate_idx" ON "order_details"("dueDate");

-- CreateIndex
CREATE INDEX "order_details_productType_idx" ON "order_details"("productType");

-- CreateIndex
CREATE INDEX "order_details_purity_idx" ON "order_details"("purity");

-- CreateIndex
CREATE INDEX "order_details_enteredById_idx" ON "order_details"("enteredById");

-- CreateIndex
CREATE INDEX "stones_orderId_idx" ON "stones"("orderId");

-- CreateIndex
CREATE INDEX "stones_stoneType_idx" ON "stones"("stoneType");

-- CreateIndex
CREATE INDEX "stones_orderId_stoneType_idx" ON "stones"("orderId", "stoneType");

-- CreateIndex
CREATE INDEX "stones_shape_idx" ON "stones"("shape");

-- CreateIndex
CREATE INDEX "stones_setting_idx" ON "stones"("setting");

-- CreateIndex
CREATE INDEX "department_tracking_orderId_idx" ON "department_tracking"("orderId");

-- CreateIndex
CREATE INDEX "department_tracking_departmentName_idx" ON "department_tracking"("departmentName");

-- CreateIndex
CREATE INDEX "department_tracking_status_idx" ON "department_tracking"("status");

-- CreateIndex
CREATE INDEX "department_tracking_assignedToId_idx" ON "department_tracking"("assignedToId");

-- CreateIndex
CREATE INDEX "department_tracking_startedAt_idx" ON "department_tracking"("startedAt");

-- CreateIndex
CREATE INDEX "department_tracking_departmentName_status_idx" ON "department_tracking"("departmentName", "status");

-- CreateIndex
CREATE INDEX "department_tracking_assignedToId_status_idx" ON "department_tracking"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "department_tracking_status_startedAt_idx" ON "department_tracking"("status", "startedAt");

-- CreateIndex
CREATE INDEX "department_tracking_completedAt_idx" ON "department_tracking"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "department_tracking_orderId_departmentName_key" ON "department_tracking"("orderId", "departmentName");

-- CreateIndex
CREATE UNIQUE INDEX "final_submissions_orderId_key" ON "final_submissions"("orderId");

-- CreateIndex
CREATE INDEX "final_submissions_orderId_idx" ON "final_submissions"("orderId");

-- CreateIndex
CREATE INDEX "final_submissions_submittedById_idx" ON "final_submissions"("submittedById");

-- CreateIndex
CREATE INDEX "final_submissions_submittedAt_idx" ON "final_submissions"("submittedAt" DESC);

-- CreateIndex
CREATE INDEX "final_submissions_customerApproved_idx" ON "final_submissions"("customerApproved");

-- CreateIndex
CREATE INDEX "final_submissions_qualityGrade_idx" ON "final_submissions"("qualityGrade");

-- CreateIndex
CREATE INDEX "final_submissions_submittedById_submittedAt_idx" ON "final_submissions"("submittedById", "submittedAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_createdAt_idx" ON "audit_logs"("entityType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_relatedId_idx" ON "notifications"("relatedId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stones" ADD CONSTRAINT "stones_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_tracking" ADD CONSTRAINT "department_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_tracking" ADD CONSTRAINT "department_tracking_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_submissions" ADD CONSTRAINT "final_submissions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_submissions" ADD CONSTRAINT "final_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
