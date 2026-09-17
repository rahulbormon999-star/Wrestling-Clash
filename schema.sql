-- Dev-Onix Wrestling Game — Neon Postgres schema (Phase 0/2)
-- Run this once in the Neon SQL editor (web-based, works fine from a phone browser).

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE,
  password_hash     TEXT,               -- null when auth_provider = 'dev_onix'
  dev_onix_user_id  TEXT UNIQUE,        -- null when auth_provider = 'email'
  auth_provider     TEXT NOT NULL CHECK (auth_provider IN ('email', 'dev_onix')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_profile (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level       INTEGER NOT NULL DEFAULT 1,
  xp          INTEGER NOT NULL DEFAULT 0,
  coins       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fighters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  fighter_type TEXT NOT NULL,        -- e.g. 'power', 'speed', 'technical', 'all_rounder'
  base_stats   JSONB NOT NULL,       -- { strength, speed, skill, endurance }
  is_active    BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS fighter_unlocks (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  fighter_id  UUID REFERENCES fighters(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, fighter_id)
);

CREATE TABLE IF NOT EXISTS clothing_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,       -- t_shirt, jacket, pants, shorts, boots, gloves, mask, accessory
  name          TEXT NOT NULL,
  coin_price    INTEGER NOT NULL,
  unlock_level  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS clothing_unlocks (
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id      UUID REFERENCES clothing_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  coin_price    INTEGER NOT NULL,
  unlock_level  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_unlocks (
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id   UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS taunts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  coin_price    INTEGER NOT NULL DEFAULT 0,
  unlock_level  INTEGER NOT NULL DEFAULT 1,
  is_starter    BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS taunt_unlocks (
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  taunt_id     UUID REFERENCES taunts(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, taunt_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type     TEXT NOT NULL,       -- '1v1', '2v2', 'custom', etc.
  ruleset        JSONB NOT NULL DEFAULT '{}',
  referee_type   TEXT NOT NULL CHECK (referee_type IN ('ai', 'human')),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at       TIMESTAMPTZ,
  winner_user_id UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS match_participants (
  match_id         UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL DEFAULT 'fighter', -- 'fighter' or 'referee'
  fighter_id       UUID REFERENCES fighters(id),
  final_health_pct NUMERIC,
  PRIMARY KEY (match_id, user_id)
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,        -- positive = earned, negative = spent
  reason     TEXT NOT NULL,           -- 'match_win', 'purchase_clothing', 'admin_grant', ...
  match_id   UUID REFERENCES matches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dev_onix_user_id TEXT UNIQUE NOT NULL,
  role             TEXT NOT NULL DEFAULT 'support', -- 'support' | 'content_manager' | 'superadmin'
  permissions      JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  UUID REFERENCES admin_users(id),
  action         TEXT NOT NULL,
  target_table   TEXT,
  target_id      TEXT,
  payload        JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user ON match_participants(user_id);
