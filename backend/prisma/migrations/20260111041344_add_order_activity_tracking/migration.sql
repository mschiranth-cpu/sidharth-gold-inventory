-- CreateTable
CREATE TABLE "order_activities" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_activities_orderId_idx" ON "order_activities"("orderId");

-- CreateIndex
CREATE INDEX "order_activities_userId_idx" ON "order_activities"("userId");

-- CreateIndex
CREATE INDEX "order_activities_action_idx" ON "order_activities"("action");

-- CreateIndex
CREATE INDEX "order_activities_createdAt_idx" ON "order_activities"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "order_activities_orderId_createdAt_idx" ON "order_activities"("orderId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "order_activities" ADD CONSTRAINT "order_activities_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_activities" ADD CONSTRAINT "order_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
