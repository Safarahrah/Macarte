ALTER TABLE printable_cards ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE printable_cards ADD COLUMN stripe_session_id TEXT;
ALTER TABLE printable_cards ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE printable_cards ADD COLUMN paid_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_printable_cards_payment_status ON printable_cards(payment_status);
CREATE INDEX IF NOT EXISTS idx_printable_cards_stripe_session ON printable_cards(stripe_session_id);
