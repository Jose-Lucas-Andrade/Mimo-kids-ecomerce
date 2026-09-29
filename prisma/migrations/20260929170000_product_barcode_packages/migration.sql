ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;
ALTER TABLE "Product" ADD COLUMN "unitsPerPackage" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
