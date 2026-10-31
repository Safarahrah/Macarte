-- Centralised graphic projects (pockets, logos, flyers, posters, social designs, other).
-- Digital cards (`cards`) and printable cards (`printable_cards`) keep their own tables.
CREATE TABLE IF NOT EXISTS design_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organisation_id TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  title TEXT NOT NULL,
  format TEXT,
  dimensions TEXT,
  data TEXT NOT NULL,
  thumbnail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_design_projects_user_type ON design_projects(user_id, type);
CREATE INDEX IF NOT EXISTS idx_design_projects_org_type ON design_projects(organisation_id, type);
CREATE INDEX IF NOT EXISTS idx_design_projects_updated ON design_projects(updated_at);
