UPDATE "Production" SET status = 'in_production' WHERE status = 'draft';

ALTER TABLE "Production" ALTER COLUMN status SET DEFAULT 'in_production';
