// migrate.mjs — apply database/schema.sql then database/seed.sql to DATABASE_URL.
// Usage (from the server/ folder):  npm run migrate
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to server/.env");
  process.exit(1);
}

const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url, ssl });

const run = async (file) => {
  const path = resolve(root, "database", file);
  const sql = readFileSync(path, "utf8");
  console.log(`→ Applying ${file} ...`);
  await client.query(sql);
  console.log(`✓ ${file} applied`);
};

try {
  await client.connect();
  await run("schema.sql");
  await run("seed.sql");
  console.log("✅ Migration complete.");
} catch (e) {
  console.error("❌ Migration failed:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
