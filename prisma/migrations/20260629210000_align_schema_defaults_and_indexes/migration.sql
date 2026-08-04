ALTER TABLE "Client" ALTER COLUMN "zipCode" SET DEFAULT '';
ALTER TABLE "Client" ALTER COLUMN "street" SET DEFAULT '';
ALTER TABLE "Client" ALTER COLUMN "number" SET DEFAULT '';
ALTER TABLE "Client" ALTER COLUMN "neighborhood" SET DEFAULT '';
ALTER TABLE "Client" ALTER COLUMN "city" SET DEFAULT '';
ALTER TABLE "Client" ALTER COLUMN "state" SET DEFAULT '';

ALTER TABLE "Sale" ALTER COLUMN "status" SET DEFAULT 'in_preparation';

DROP INDEX "KitItem_kitId_idx";
DROP INDEX "KitItem_productId_idx";
ALTER TABLE "KitItem"
RENAME CONSTRAINT "KitItem_kitId_productId_unique" TO "KitItem_kitId_productId_key";

DROP INDEX "SaleItem_kitId_idx";
DROP INDEX "SaleItem_saleId_productId_key";
ALTER TABLE "SaleItem"
DROP CONSTRAINT "SaleItem_saleId_productId_kitId_key";
