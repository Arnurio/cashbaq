-- Analytics events table for tracking user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
  id         BIGSERIAL PRIMARY KEY,
  event      TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by event type and time range
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events (event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events (created_at);

-- Public insert (anonymous analytics, no auth required)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert events"
  ON analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anyone can select events"
  ON analytics_events FOR SELECT
  TO anon, authenticated
  USING (true);
