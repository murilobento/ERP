CREATE TABLE "Kit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "discountType" TEXT NOT NULL DEFAULT 'fixed',
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KitItem" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "KitItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KitItem_kitId_idx" ON "KitItem"("kitId");
CREATE INDEX "KitItem_productId_idx" ON "KitItem"("productId");

ALTER TABLE "KitItem" ADD CONSTRAINT "KitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KitItem" ADD CONSTRAINT "KitItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "KitItem" ADD CONSTRAINT "KitItem_kitId_productId_unique" UNIQUE ("kitId", "productId");

ALTER TABLE "SaleItem" ADD COLUMN "kitId" TEXT;

CREATE INDEX "SaleItem_kitId_idx" ON "SaleItem"("kitId");

ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_productId_kitId_key" UNIQUE ("saleId", "productId", "kitId");
