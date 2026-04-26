-- ============================================
-- Migration 002: rate_reports table for crowdsourced moderation
-- ============================================
-- Allows users to report inaccurate cashback rates from the mobile app.
-- Anonymous reports allowed (user_id is nullable since MVP has no auth).
-- Admin moderates via admin panel.
-- ============================================

CREATE TABLE IF NOT EXISTS rate_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id TEXT NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  current_rate NUMERIC(5,2),
  suggested_rate NUMERIC(5,2),
  comment TEXT,
  source_url TEXT,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_reports_status_created_idx
  ON rate_reports (status, created_at DESC);

ALTER TABLE rate_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit a report
DROP POLICY IF EXISTS "rate_reports_insert" ON rate_reports;
CREATE POLICY "rate_reports_insert" ON rate_reports
  FOR INSERT WITH CHECK (true);

-- Open SELECT/UPDATE/DELETE for admin panel (uses anon key, no auth in MVP)
DROP POLICY IF EXISTS "rate_reports_select" ON rate_reports;
CREATE POLICY "rate_reports_select" ON rate_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "rate_reports_update" ON rate_reports;
CREATE POLICY "rate_reports_update" ON rate_reports FOR UPDATE USING (true);

DROP POLICY IF EXISTS "rate_reports_delete" ON rate_reports;
CREATE POLICY "rate_reports_delete" ON rate_reports FOR DELETE USING (true);
