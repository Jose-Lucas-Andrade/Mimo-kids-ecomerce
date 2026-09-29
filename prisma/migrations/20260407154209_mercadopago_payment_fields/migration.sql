-- AlterTable
ALTER TABLE "Order" ADD COLUMN "merchantOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentPreferenceId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT DEFAULT 'PENDING';
