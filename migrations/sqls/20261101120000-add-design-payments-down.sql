DROP INDEX IF EXISTS idx_design_projects_stripe_session;
DROP INDEX IF EXISTS idx_design_projects_payment_status;

ALTER TABLE design_projects DROP COLUMN IF EXISTS paid_at;
ALTER TABLE design_projects DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE design_projects DROP COLUMN IF EXISTS stripe_session_id;
ALTER TABLE design_projects DROP COLUMN IF EXISTS payment_status;
