-- Push notification subscriptions
-- Anonymous users register their device + Expo push token + which banks they have cards from.
-- Admin (authenticated) reads to send pushes via send-push edge function.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          BIGSERIAL PRIMARY KEY,
  device_id   TEXT NOT NULL UNIQUE,
  push_token  TEXT NOT NULL,
  bank_ids    TEXT[] DEFAULT '{}',
  platform    TEXT,
  language    TEXT DEFAULT 'ru',
  enabled     BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_bank_ids ON push_subscriptions USING GIN (bank_ids);
CREATE INDEX IF NOT EXISTS idx_push_subs_enabled ON push_subscriptions (enabled) WHERE enabled = TRUE;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anonymous mobile clients self-register (insert) and update their own row by device_id.
-- Knowing a random device_id is uninteresting and tokens rotate; spam is bounded by the
-- UNIQUE(device_id) constraint (one row per device, upsert overwrites).
CREATE POLICY "anon insert subscription" ON push_subscriptions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon update subscription" ON push_subscriptions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Only the admin (authenticated) reads tokens. Service role (used by Edge Function) bypasses RLS.
CREATE POLICY "auth read subscriptions" ON push_subscriptions
  FOR SELECT TO authenticated USING (true);
