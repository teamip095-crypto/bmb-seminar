-- 003_seminar_registrations.sql
-- Persist seminar registrations across Vercel cold starts.
-- Critical: without this, /api/quiz/start returns "Invalid or unauthorized participant token"
-- because in-memory state resets on every cold start.

CREATE TABLE IF NOT EXISTS seminar_registrations (
  id TEXT PRIMARY KEY,
  seminar_event_id TEXT NOT NULL,
  registration_id TEXT NOT NULL UNIQUE, -- BMB-YYYYMMDD-XXXX
  seat_number TEXT,
  name TEXT NOT NULL,
  full_address TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  education TEXT,
  occupation TEXT,
  age_group TEXT,
  city TEXT,
  district TEXT,
  whatsapp_consent BOOLEAN NOT NULL DEFAULT TRUE,
  display_name TEXT NOT NULL,
  secure_token_hash TEXT NOT NULL, -- SHA-256 of participant token
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seminar_reg_token_hash ON seminar_registrations (secure_token_hash);
CREATE INDEX IF NOT EXISTS idx_seminar_reg_phone_event ON seminar_registrations (whatsapp_number, seminar_event_id);
CREATE INDEX IF NOT EXISTS idx_seminar_reg_event ON seminar_registrations (seminar_event_id);

CREATE OR REPLACE FUNCTION set_reg_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seminar_reg_updated_at ON seminar_registrations;
CREATE TRIGGER trg_seminar_reg_updated_at
  BEFORE UPDATE ON seminar_registrations
  FOR EACH ROW EXECUTE FUNCTION set_reg_updated_at();
