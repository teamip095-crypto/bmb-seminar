-- 002_scholarship_quiz.sql
-- Scholarship Quiz tables — persisted across Vercel cold starts.
-- 20-question AI scholarship quiz with 10-min timer and cash prizes:
--   Rank 1: ₹1000, Rank 2: ₹500, Rank 3: ₹200, Ranks 4-10: attractive gift

CREATE TABLE IF NOT EXISTS scholarship_attempts (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  participant_name TEXT,
  participant_phone TEXT,
  participant_city TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','expired','timeout_auto_submitted')),
  answers_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholarship_attempts_participant ON scholarship_attempts (participant_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_attempts_score ON scholarship_attempts (score DESC, duration_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_scholarship_attempts_status ON scholarship_attempts (status);

CREATE TABLE IF NOT EXISTS scholarship_winners (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES scholarship_attempts(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  participant_name TEXT,
  participant_phone TEXT,
  participant_city TEXT,
  rank INTEGER NOT NULL,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('cash', 'gift')),
  prize_amount INTEGER NOT NULL DEFAULT 0,
  prize_label TEXT NOT NULL,
  score INTEGER NOT NULL,
  duration_seconds INTEGER,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_scholarship_winners_rank ON scholarship_winners (rank ASC);
CREATE INDEX IF NOT EXISTS idx_scholarship_winners_awarded ON scholarship_winners (awarded_at DESC);

CREATE OR REPLACE FUNCTION set_scholarship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scholarship_attempts_updated_at ON scholarship_attempts;
CREATE TRIGGER trg_scholarship_attempts_updated_at
  BEFORE UPDATE ON scholarship_attempts
  FOR EACH ROW EXECUTE FUNCTION set_scholarship_updated_at();
