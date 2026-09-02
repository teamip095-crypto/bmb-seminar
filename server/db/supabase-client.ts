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
  `);
  if (result === null) {
    console.warn("[supabase-client] ensureSchema failed — Postgres not available");
  } else {
    console.log("[supabase-client] schema ensured");
  }
  migrationChecked = true;
}
