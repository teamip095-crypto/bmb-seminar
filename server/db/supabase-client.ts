/**
 * Postgres pool for Supabase — used for stateful data that must persist
 * across Vercel cold starts (admin_users, audit_logs, etc.).
 *
 * Connection: process.env.DATABASE_URL (set in Vercel env vars)
 * Falls back gracefully — if DATABASE_URL is not set or connection fails,
 * callers should fall back to the in-memory store (which is still useful
 * for read-only seed data and local dev).
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
      max: 5, // small pool — Vercel serverless concurrency is low per-instance
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
      // Supabase pooler requires SSL — pg handles it automatically via connection string
    });
    return pool;
  } catch (err) {
    initError = `Failed to initialize pool: ${(err as Error).message}`;
    console.error("[supabase-client] " + initError);
    return null;
  }
}

/** Run a parameterized query. Returns null on error (so callers can fall back). */
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

/** True if DATABASE_URL is set AND pool initialised without error. */
export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL) && !initError && getPool() !== null;
}

/** Run a one-time migration check — ensure admin_users table exists. */
let migrationChecked = false;
export async function ensureSchema(): Promise<void> {
  if (migrationChecked) return;
  const result = await query(`
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

    -- Scholarship Quiz tables (002_scholarship_quiz.sql)
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

    CREATE TABLE IF NOT EXISTS scholarship_winners (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL REFERENCES scholarship_attempts(id) ON DELETE CASCADE,
      participant_id TEXT NOT NULL,
      participant_name TEXT,
      participant_phone TEXT,
      participant_city TEXT,
      rank INTEGER NOT NULL,
      prize_type TEXT NOT NULL CHECK (prize_type IN ('cash','gift')),
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

    -- Seminar registrations (003_seminar_registrations.sql)
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
  `);
  if (result === null) {
    console.warn("[supabase-client] ensureSchema failed — Postgres not available");
  } else {
    console.log("[supabase-client] schema ensured (admin + scholarship + registrations)");
  }
  migrationChecked = true;
}
