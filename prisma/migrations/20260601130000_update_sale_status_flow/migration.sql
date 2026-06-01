UPDATE "Sale" SET status = 'in_preparation' WHERE status = 'pending';
UPDATE "Sale" SET status = 'ready_for_delivery' WHERE status = 'in_production';
UPDATE "Sale" SET status = 'completed' WHERE status = 'paid';
UPDATE "Sale" SET completed_at = NOW() WHERE status = 'completed' AND completed_at IS NULL;
