DROP INDEX IF EXISTS idx_printable_cards_payment_status;
DROP INDEX IF EXISTS idx_printable_cards_stripe_session;

ALTER TABLE printable_cards DROP COLUMN paid_at;
ALTER TABLE printable_cards DROP COLUMN stripe_payment_intent_id;
ALTER TABLE printable_cards DROP COLUMN stripe_session_id;
ALTER TABLE printable_cards DROP COLUMN payment_status;