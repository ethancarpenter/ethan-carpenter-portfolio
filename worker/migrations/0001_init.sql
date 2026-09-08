-- Site-wide stats: a tiny key/value counter table. One row per stat.
CREATE TABLE IF NOT EXISTS site_stats (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

-- Seed the one counter this milestone needs. ON CONFLICT DO NOTHING keeps this
-- migration safe to run more than once without resetting an existing count.
INSERT INTO site_stats (key, value)
VALUES ('coffee_pots_brewed', 0)
ON CONFLICT (key) DO NOTHING;
