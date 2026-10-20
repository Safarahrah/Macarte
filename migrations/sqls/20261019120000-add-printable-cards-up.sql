CREATE TABLE IF NOT EXISTS printable_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  digital_card_slug TEXT,
  digital_card_user_id TEXT,
  config TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_printable_cards_user_id ON printable_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_printable_cards_digital_slug ON printable_cards(digital_card_slug);
