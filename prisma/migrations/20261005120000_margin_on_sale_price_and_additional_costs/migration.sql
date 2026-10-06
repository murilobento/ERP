-- AlterTable: custos adicionais por produto (frete e embalagem)
ALTER TABLE "Product" ADD COLUMN "freightCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "packagingCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- A margem passa a ser sobre o preço de venda (era markup sobre custo).
-- Converte a margem salva preservando o preço de venda atual:
--   antigo: venda = custo * (1 + m/100)     (markup)
--   novo:   venda = custo / (1 - m'/100)    (margem)
--   m' = (m/100) / (1 + m/100) * 100 = m / (1 + m/100)
UPDATE "Product"
SET "margin" = CASE
  WHEN "margin" <= -100 THEN 0
  ELSE "margin" / (1 + "margin" / 100.0)
END;