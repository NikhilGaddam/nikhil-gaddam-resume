-- Run once to create the D1 database table
-- wrangler d1 execute resume-analytics --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS visits (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  time    TEXT NOT NULL,
  ip      TEXT NOT NULL,
  country TEXT DEFAULT '',
  ua      TEXT DEFAULT '',
  ref     TEXT DEFAULT '',
  page    TEXT DEFAULT '/',
  screen  TEXT DEFAULT '',
  lang    TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_visits_time ON visits (time);
CREATE INDEX IF NOT EXISTS idx_visits_ip   ON visits (ip);
