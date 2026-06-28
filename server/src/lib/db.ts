import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

export const query = <T = any>(text: string, params?: any[]) =>
  pool.query<T>(text, params);

/** Convenience: first row or null. */
export async function one<T = any>(
  text: string,
  params?: any[],
): Promise<T | null> {
  const r = await pool.query<T>(text, params);
  return r.rows[0] ?? null;
}
