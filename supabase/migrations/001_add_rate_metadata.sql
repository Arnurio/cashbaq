-- ============================================
-- Migration 001: Add metadata to bank_rates
-- ============================================
-- Adds two trust-signal fields to each cashback rate:
--   updated_at — when the rate was last verified by an admin
--   source_url — link to the bank's source page (transparency)
--
-- Both fields are nullable initially. updated_at gets a default of now()
-- so existing rates are stamped at migration time.
-- ============================================

ALTER TABLE bank_rates
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Auto-update updated_at on every row UPDATE
CREATE OR REPLACE FUNCTION bank_rates_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bank_rates_updated_at_trigger ON bank_rates;
CREATE TRIGGER bank_rates_updated_at_trigger
  BEFORE UPDATE ON bank_rates
  FOR EACH ROW
  EXECUTE FUNCTION bank_rates_touch_updated_at();
