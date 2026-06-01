CREATE TABLE "Sale" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "customer" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT NOT NULL DEFAULT '',
  "paymentMethod" TEXT NOT NULL DEFAULT '',
  "paidAt" TIMESTAMP(3),
  "paymentNotes" TEXT NOT NULL DEFAULT '',
  "reversalReason" TEXT NOT NULL DEFAULT '',
  "reversedBy" TEXT,
  "reversedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleItem" (
  "id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,

  CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaleItem_saleId_productId_key"
ON "SaleItem"("saleId", "productId");

ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_saleId_fkey"
FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
