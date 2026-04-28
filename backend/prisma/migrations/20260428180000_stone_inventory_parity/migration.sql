-- AlterTable
ALTER TABLE "diamonds" ALTER COLUMN "category" SET DATA TYPE TEXT,
ALTER COLUMN "color_band" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "real_stone_transactions" ADD COLUMN     "amount_paid" DOUBLE PRECISION,
ADD COLUMN     "carat_weight" DOUBLE PRECISION,
ADD COLUMN     "cash_amount" DOUBLE PRECISION,
ADD COLUMN     "credit_applied" DOUBLE PRECISION,
ADD COLUMN     "credit_generated" DOUBLE PRECISION,
ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "from_location" TEXT,
ADD COLUMN     "is_billable" BOOLEAN,
ADD COLUMN     "neft_amount" DOUBLE PRECISION,
ADD COLUMN     "neft_bank" TEXT,
ADD COLUMN     "neft_date" TIMESTAMP(3),
ADD COLUMN     "neft_utr" TEXT,
ADD COLUMN     "payment_mode" TEXT,
ADD COLUMN     "payment_status" TEXT,
ADD COLUMN     "price_per_carat" DOUBLE PRECISION,
ADD COLUMN     "reference_number" TEXT,
ADD COLUMN     "to_location" TEXT,
ADD COLUMN     "total_value" DOUBLE PRECISION,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendor_id" TEXT,
ADD COLUMN     "worker_id" TEXT;

-- AlterTable
ALTER TABLE "stone_packet_transactions" ADD COLUMN     "amount_paid" DOUBLE PRECISION,
ADD COLUMN     "cash_amount" DOUBLE PRECISION,
ADD COLUMN     "credit_applied" DOUBLE PRECISION,
ADD COLUMN     "credit_generated" DOUBLE PRECISION,
ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "from_location" TEXT,
ADD COLUMN     "is_billable" BOOLEAN,
ADD COLUMN     "neft_amount" DOUBLE PRECISION,
ADD COLUMN     "neft_bank" TEXT,
ADD COLUMN     "neft_date" TIMESTAMP(3),
ADD COLUMN     "neft_utr" TEXT,
ADD COLUMN     "payment_mode" TEXT,
ADD COLUMN     "payment_status" TEXT,
ADD COLUMN     "price_per_unit" DOUBLE PRECISION,
ADD COLUMN     "reference_number" TEXT,
ADD COLUMN     "to_location" TEXT,
ADD COLUMN     "total_value" DOUBLE PRECISION,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendor_id" TEXT;

-- CreateTable
CREATE TABLE "real_stone_payments" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_mode" TEXT NOT NULL,
    "cash_amount" DOUBLE PRECISION,
    "neft_amount" DOUBLE PRECISION,
    "neft_utr" TEXT,
    "neft_bank" TEXT,
    "neft_date" TIMESTAMP(3),
    "credit_applied" DOUBLE PRECISION,
    "credit_generated" DOUBLE PRECISION,
    "notes" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "real_stone_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_stone_rates" (
    "id" TEXT NOT NULL,
    "stone_type" "RealStoneType" NOT NULL,
    "quality" TEXT,
    "carat_from" DOUBLE PRECISION NOT NULL,
    "carat_to" DOUBLE PRECISION NOT NULL,
    "price_per_carat" DOUBLE PRECISION NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "real_stone_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stone_packet_payments" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_mode" TEXT NOT NULL,
    "cash_amount" DOUBLE PRECISION,
    "neft_amount" DOUBLE PRECISION,
    "neft_utr" TEXT,
    "neft_bank" TEXT,
    "neft_date" TIMESTAMP(3),
    "credit_applied" DOUBLE PRECISION,
    "credit_generated" DOUBLE PRECISION,
    "notes" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stone_packet_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "real_stone_payments_transaction_id_idx" ON "real_stone_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "real_stone_payments_recorded_at_idx" ON "real_stone_payments"("recorded_at");

-- CreateIndex
CREATE INDEX "real_stone_rates_stone_type_quality_effective_date_idx" ON "real_stone_rates"("stone_type", "quality", "effective_date");

-- CreateIndex
CREATE INDEX "stone_packet_payments_transaction_id_idx" ON "stone_packet_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "stone_packet_payments_recorded_at_idx" ON "stone_packet_payments"("recorded_at");

-- CreateIndex
CREATE INDEX "real_stone_transactions_vendor_id_idx" ON "real_stone_transactions"("vendor_id");

-- CreateIndex
CREATE INDEX "real_stone_transactions_is_billable_idx" ON "real_stone_transactions"("is_billable");

-- CreateIndex
CREATE INDEX "real_stone_transactions_payment_status_idx" ON "real_stone_transactions"("payment_status");

-- CreateIndex
CREATE INDEX "stone_packet_transactions_vendor_id_idx" ON "stone_packet_transactions"("vendor_id");

-- CreateIndex
CREATE INDEX "stone_packet_transactions_is_billable_idx" ON "stone_packet_transactions"("is_billable");

-- CreateIndex
CREATE INDEX "stone_packet_transactions_payment_status_idx" ON "stone_packet_transactions"("payment_status");

-- AddForeignKey
ALTER TABLE "real_stone_transactions" ADD CONSTRAINT "real_stone_transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_stone_payments" ADD CONSTRAINT "real_stone_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_stone_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_stone_payments" ADD CONSTRAINT "real_stone_payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_stone_rates" ADD CONSTRAINT "real_stone_rates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stone_packet_transactions" ADD CONSTRAINT "stone_packet_transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stone_packet_payments" ADD CONSTRAINT "stone_packet_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "stone_packet_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stone_packet_payments" ADD CONSTRAINT "stone_packet_payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

