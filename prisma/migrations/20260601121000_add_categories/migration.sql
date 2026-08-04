CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

INSERT INTO "Category" ("id", "name", "status", "createdAt", "updatedAt")
VALUES ('default_category', 'Sem categoria', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

UPDATE "Product"
SET "categoryId" = 'default_category'
WHERE "categoryId" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
