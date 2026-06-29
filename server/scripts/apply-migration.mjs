// apply-migration.mjs — apply a single SQL migration file to DATABASE_URL.
// Usage (from server/):  node scripts/apply-migration.mjs ../database/migrations/001_attempts_and_trial.sql
// Works against local Docker and Neon (set DATABASE_SSL=true for Neon).
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to.sql>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url, ssl });

const sql = readFileSync(resolve(file), "utf8");
try {
  await client.connect();
  console.log(`→ Applying ${file} ...`);
  await client.query(sql);
  console.log("✓ Migration applied.");
} catch (e) {
  console.error("❌ Migration failed:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
