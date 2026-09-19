/**
 * Postgres pool for Supabase — used for stateful data that must persist
 * across Vercel cold starts (admin_users, seminar_registrations, scholarship tables).
 *
 * Connection: process.env.DATABASE_URL (set in Vercel env vars)
 * Falls back gracefully — if DATABASE_URL is not set or connection fails,
 * callers should fall back to the in-memory store.
 */
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

let pool: Pool | null = null;
let initError: string | null = null;

function getPool(): Pool | null {
  if (initError) return null;
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) {
    initError = "DATABASE_URL not set";
    return null;
  }

  try {
    pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });
    return pool;
  } catch (err) {
    initError = `Failed to initialize pool: ${(err as Error).message}`;
    console.error("[supabase-client] " + initError);
    return null;
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T> | null> {
  const p = getPool();
  if (!p) return null;
  let client: PoolClient | null = null;
  try {
    client = await p.connect();
    const result = await client.query<T>(text, params);
    return result;
  } catch (err) {
    console.error("[supabase-client] query error:", (err as Error).message);
    return null;
  } finally {
    if (client) client.release();
  }
}

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL) && !initError && getPool() !== null;
}

let migrationChecked = false;
export async function ensureSchema(): Promise<void> {
  if (migrationChecked) return;
  const result = await query(`
    -- Admin users
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      whatsapp_number TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin','admin','counselor')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
      reset_otp TEXT,
      reset_otp_expires_at TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_admin_users_email_lower ON admin_users (LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_admin_users_whatsapp ON admin_users (whatsapp_number);

    -- Seminar registrations (so /api/quiz/start works after cold start)
    CREATE TABLE IF NOT EXISTS seminar_registrations (
      id TEXT PRIMARY KEY,
      seminar_event_id TEXT NOT NULL,
      registration_id TEXT NOT NULL UNIQUE,
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
      secure_token_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_seminar_reg_token_hash ON seminar_registrations (secure_token_hash);
    CREATE INDEX IF NOT EXISTS idx_seminar_reg_phone_event ON seminar_registrations (whatsapp_number, seminar_event_id);
    CREATE INDEX IF NOT EXISTS idx_seminar_reg_event ON seminar_registrations (seminar_event_id);

    -- Scholarship attempts (Stage 2 scholarship quiz — 10 questions, 5 min)
    CREATE TABLE IF NOT EXISTS scholarship_attempts (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      seminar_event_id TEXT NOT NULL,
      attempt_token_hash TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      duration_seconds_limit INTEGER DEFAULT 300,
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','expired','timeout_auto_submitted')),
      questions_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_scholarship_att_participant ON scholarship_attempts (participant_id);
    CREATE INDEX IF NOT EXISTS idx_scholarship_att_event ON scholarship_attempts (seminar_event_id);
    CREATE INDEX IF NOT EXISTS idx_scholarship_att_status ON scholarship_attempts (status);

    -- Scholarship submissions (records scoring + prize)
    CREATE TABLE IF NOT EXISTS scholarship_submissions (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      seminar_event_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL DEFAULT 10,
      duration_seconds INTEGER NOT NULL,
      rank INTEGER,
      prize_text TEXT,
      prize_type TEXT,
      cash_prize INTEGER DEFAULT 0,
      scholarship_amount INTEGER DEFAULT 0,
      answers_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_schol_sub_participant ON scholarship_submissions (participant_id);
    CREATE INDEX IF NOT EXISTS idx_schol_sub_score ON scholarship_submissions (score DESC, duration_seconds ASC);
    CREATE INDEX IF NOT EXISTS idx_schol_sub_event ON scholarship_submissions (seminar_event_id);

    -- Seminar quiz results (2-min quiz scoring — persisted across cold starts)
    CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      seminar_event_id TEXT NOT NULL,
      registration_id TEXT,
      participant_name TEXT,
      whatsapp_number TEXT,
      city TEXT,
      display_name TEXT,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL DEFAULT 4,
      duration_seconds INTEGER NOT NULL,
      result_status TEXT NOT NULL DEFAULT 'participated',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (participant_id, seminar_event_id)
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_results_event ON quiz_results (seminar_event_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_results_score ON quiz_results (score DESC, duration_seconds ASC);
    CREATE INDEX IF NOT EXISTS idx_quiz_results_participant ON quiz_results (participant_id);

    -- Pass purchases (free pass winners + ₹199 paid passes) — persisted across cold starts
    CREATE TABLE IF NOT EXISTS pass_purchases (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      registration_id TEXT,
      participant_name TEXT,
      whatsapp_number TEXT,
      amount_paid INTEGER NOT NULL DEFAULT 0,
      original_amount INTEGER NOT NULL DEFAULT 500,
      payment_method TEXT NOT NULL DEFAULT 'free_pass',
      upi_id TEXT,
      utr_number TEXT,
      screenshot_url TEXT,
      screenshot_filename TEXT,
      verification_status TEXT NOT NULL DEFAULT 'verified',
      verified_at TIMESTAMPTZ,
      invoice_number TEXT,
      pass_type TEXT NOT NULL DEFAULT 'round1_winner_free',
      notes TEXT,
      whatsapp_sent BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (participant_id)
    );
    CREATE INDEX IF NOT EXISTS idx_pass_participant ON pass_purchases (participant_id);
    CREATE INDEX IF NOT EXISTS idx_pass_status ON pass_purchases (verification_status);
  `);
  if (result === null) {
    console.warn("[supabase-client] ensureSchema failed — Postgres not available");
  } else {
    console.log("[supabase-client] schema ensured (admin + registrations + scholarship + quiz_results + passes)");
  }
  migrationChecked = true;
}
