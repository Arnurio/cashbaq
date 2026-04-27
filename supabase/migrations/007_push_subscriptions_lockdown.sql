-- Tighten push_subscriptions: per-device RLS via Supabase anonymous auth + size caps.
--
-- Mobile app now calls supabase.auth.signInAnonymously() and uses auth.uid() as device_id.
-- This means each device can only modify ITS OWN row — no token hijacking via shared anon key.
-- Service role (used by send-push edge function) bypasses these policies.

-- Drop the wide-open anon policies
DROP POLICY IF EXISTS "anon insert subscription"  ON push_subscriptions;
DROP POLICY IF EXISTS "anon update subscription"  ON push_subscriptions;

-- New policies: authenticated users (incl. anonymous-auth) can only touch their own row
CREATE POLICY "auth insert own subscription" ON push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (device_id = (auth.uid())::text);

CREATE POLICY "auth update own subscription" ON push_subscriptions
  FOR UPDATE TO authenticated
  USING (device_id = (auth.uid())::text)
  WITH CHECK (device_id = (auth.uid())::text);

-- Size caps to prevent storage abuse
ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_token_format
  CHECK (length(push_token) BETWEEN 10 AND 200);

ALTER TABLE push_subscriptions
  ADD CONSTRAINT device_id_size
  CHECK (length(device_id) BETWEEN 8 AND 100);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION touch_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_subscriptions_touch_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_touch_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION touch_push_subscriptions_updated_at();
