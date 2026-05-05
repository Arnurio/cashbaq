-- ============================================
-- Migration 004: Verification metadata + bank activation
-- ============================================
-- Applied directly to Supabase on 2026-05-01 as part of the
-- "May 2026 Revision" (data integrity pivot to 3 verified banks).
-- This file documents the schema changes for reproducibility.
--
-- Changes:
--   bank_rates: verified_by, verified_at, verified_note
--   banks:      is_active
--   Data:       all existing 24 rates → ai_estimate
--               Forte/BCC/Bereke/Alatau City → is_active=false
-- ============================================

-- 1. Verification metadata on bank_rates
ALTER TABLE bank_rates
  ADD COLUMN IF NOT EXISTS verified_by TEXT NOT NULL DEFAULT 'ai_estimate'
    CHECK (verified_by IN ('user', 'community', 'bank_site', 'ai_estimate')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_note TEXT;

-- 2. Active flag on banks
ALTER TABLE banks
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 3. Mark all existing rates as AI-generated (not verified)
UPDATE bank_rates SET verified_by = 'ai_estimate' WHERE verified_by IS NULL OR verified_by = 'ai_estimate';

-- 4. Deactivate banks where owner has no personal account to verify rates
UPDATE banks SET is_active = false WHERE id IN ('forte', 'bcc', 'bereke', 'jusan');
