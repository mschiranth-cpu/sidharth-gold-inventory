-- AlterTable
ALTER TABLE "order_details" ADD COLUMN     "advancePercentage" DOUBLE PRECISION,
ADD COLUMN     "customerAddress" TEXT,
ADD COLUMN     "deliveryMethod" TEXT,
ADD COLUMN     "designCategory" TEXT,
ADD COLUMN     "exchangeAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expectedGoldRate" DOUBLE PRECISION,
ADD COLUMN     "goldRateLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occasion" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "warrantyPeriod" TEXT;
