-- CreateTable
CREATE TABLE "SpecificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "specifications" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecificationTemplate_userId_idx" ON "SpecificationTemplate"("userId");
CREATE INDEX "SpecificationTemplate_productType_idx" ON "SpecificationTemplate"("productType");

-- AddForeignKey
ALTER TABLE "SpecificationTemplate" ADD CONSTRAINT "SpecificationTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
