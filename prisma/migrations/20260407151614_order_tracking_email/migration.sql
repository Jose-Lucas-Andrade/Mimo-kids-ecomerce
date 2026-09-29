-- AlterTable
ALTER TABLE "Order" ADD COLUMN "lastEmailSentAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "shippedAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "trackingCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingUrl" TEXT;
