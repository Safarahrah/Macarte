ALTER TABLE design_projects ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE design_projects ADD COLUMN stripe_session_id TEXT;
ALTER TABLE design_projects ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE design_projects ADD COLUMN paid_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_design_projects_payment_status ON design_projects(payment_status);
CREATE INDEX IF NOT EXISTS idx_design_projects_stripe_session ON design_projects(stripe_session_id);
