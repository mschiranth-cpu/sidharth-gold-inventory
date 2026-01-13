-- AlterTable
ALTER TABLE "order_details" ADD COLUMN     "customFinish" TEXT,
ADD COLUMN     "metalFinish" TEXT,
ADD COLUMN     "metalType" TEXT DEFAULT 'GOLD';
