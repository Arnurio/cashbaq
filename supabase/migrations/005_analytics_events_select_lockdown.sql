-- Restrict analytics_events SELECT to authenticated users only.
-- Admin panel now requires Supabase Auth login, so anon SELECT is safe to drop.
DROP POLICY IF EXISTS "anyone can select events" ON analytics_events;

CREATE POLICY "authenticated can select events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (true);
