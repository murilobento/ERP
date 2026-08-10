-- deliveryDate is a calendar date. Older records were stored at UTC midnight
-- by the application, while the canonical representation is midnight in
-- America/Sao_Paulo (03:00 in the current fixed offset).
UPDATE "Sale"
SET "deliveryDate" = "deliveryDate" + INTERVAL '3 hours'
WHERE "deliveryDate" IS NOT NULL
  AND "deliveryDate"::time = TIME '00:00:00';
