-- IF NOT EXISTS added 2026-09-02: the column was already live on production
-- (applied by an earlier deploy attempt) but drizzle.__drizzle_migrations
-- never recorded it, so every subsequent predeploy-migrate run failed the
-- build on "column already exists" and no code since PR #87 had shipped.
-- Idempotent going forward, and this run is what finally records the entry.
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "listed" boolean DEFAULT true NOT NULL;