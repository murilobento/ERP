CREATE TABLE "ProductionItem" (
  "id" TEXT NOT NULL,
  "productionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,

  CONSTRAINT "ProductionItem_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProductionItem" ("id", "productionId", "productId", "quantity")
SELECT 'legacy_' || "id", "id", "productId", "quantity"
FROM "Production"
ON CONFLICT ("id") DO NOTHING;

CREATE UNIQUE INDEX "ProductionItem_productionId_productId_key"
ON "ProductionItem"("productionId", "productId");

ALTER TABLE "ProductionItem"
ADD CONSTRAINT "ProductionItem_productionId_fkey"
FOREIGN KEY ("productionId") REFERENCES "Production"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductionItem"
ADD CONSTRAINT "ProductionItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
