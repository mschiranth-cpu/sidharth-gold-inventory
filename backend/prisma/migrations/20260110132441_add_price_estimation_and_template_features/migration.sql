-- AlterTable
ALTER TABLE "order_details" ADD COLUMN     "clonedFromOrderId" TEXT,
ADD COLUMN     "estimatedGoldCost" DOUBLE PRECISION,
ADD COLUMN     "estimatedMakingCharges" DOUBLE PRECISION,
ADD COLUMN     "estimatedOtherCharges" DOUBLE PRECISION,
ADD COLUMN     "estimatedStoneCost" DOUBLE PRECISION,
ADD COLUMN     "estimatedTotalCost" DOUBLE PRECISION,
ADD COLUMN     "templateName" TEXT;
