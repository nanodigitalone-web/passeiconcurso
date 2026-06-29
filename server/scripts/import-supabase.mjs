// import-supabase.mjs — import the Supabase CSV export into the new Postgres DB.
//
// Usage (from the server/ folder):
//   node scripts/import-supabase.mjs "../dados dos usuarios/dados-usuarios/dados-usuarios"
//
// Idempotent: every insert uses ON CONFLICT (id) DO NOTHING, so it can be
// re-run safely. It first creates `users` rows from profiles.csv (the new
// schema's profiles.id references users.id, which Supabase exports do not have),
// then inserts the rest in FK-safe order, skipping/ nulling orphan references.
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const dataDir = resolve(process.argv[2] || "../dados dos usuarios/dados-usuarios/dados-usuarios");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to server/.env");
  process.exit(1);
}
const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url, ssl });

// ---- RFC4180 CSV parser (handles quotes, embedded commas/newlines) --------
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  // Strip a leading UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else if (c === "\r") {
      // ignore; handled by \n
    } else field += c;
  }
  // last field / row (if file does not end with newline)
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function readTable(name) {
  const path = resolve(dataDir, `${name}.csv`);
  if (!existsSync(path)) return { headers: [], rows: [] };
  const rows = parseCsv(readFileSync(path, "utf8"));
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0];
  const objs = rows.slice(1)
    // ignore fully-empty trailing rows
    .filter((r) => r.some((v) => v !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
  return { headers, rows: objs };
}

// Empty string -> null. Everything else passes through as text and Postgres
// casts it to the column type ('t'/'f' -> boolean, '0' -> int, json -> jsonb).
const v = (s) => (s === "" || s === undefined ? null : s);

async function insertRows(table, columns, rows, conflict = "(id) do nothing") {
  if (rows.length === 0) { console.log(`  ${table}: 0`); return 0; }
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const params = [];
    const valuesSql = slice
      .map((r) => {
        const placeholders = columns.map((c) => {
          params.push(v(r[c]));
          return `$${params.length}`;
        });
        return `(${placeholders.join(",")})`;
      })
      .join(",");
    const sql =
      `insert into ${table} (${columns.join(",")}) values ${valuesSql} ` +
      `on conflict ${conflict}`;
    const res = await client.query(sql, params);
    inserted += res.rowCount;
  }
  console.log(`  ${table}: +${inserted} (de ${rows.length})`);
  return inserted;
}

async function main() {
  await client.connect();
  console.log(`Importando de: ${dataDir}\n`);

  const skipped = {};
  const note = (k, n) => { if (n) skipped[k] = (skipped[k] || 0) + n; };

  // 1) users (from profiles) ------------------------------------------------
  const profiles = readTable("profiles").rows;
  const seenEmail = new Set();
  const userRows = [];
  let noEmail = 0;
  for (const p of profiles) {
    const email = (p.email || "").trim().toLowerCase();
    if (!email) { noEmail++; continue; }
    if (seenEmail.has(email)) { note("perfis com email duplicado", 1); continue; }
    seenEmail.add(email);
    userRows.push({ id: p.id, email });
  }
  note("perfis sem email (ignorados)", noEmail);
  console.log("→ users");
  await insertRows("users", ["id", "email"], userRows, "do nothing");

  // Valid user-id set = whatever is actually in users now.
  const valid = new Set(
    (await client.query("select id from users")).rows.map((r) => r.id),
  );
  const inValid = (id) => id && valid.has(id);

  // 2) profiles -------------------------------------------------------------
  console.log("→ profiles");
  const profCols = ["id","nome","avatar_url","bio","pontos","streak","created_at","updated_at","concurso_id","categoria_id","categoria_nome","blocked","hidden","email","last_seen","friend_code","moedas","iban"];
  const profOk = profiles.filter((p) => inValid(p.id));
  note("perfis sem user correspondente", profiles.length - profOk.length - noEmail);
  await insertRows("profiles", profCols, profOk);

  // helper: filter rows by a required user column
  const reqUser = (rows, col, key) => {
    const ok = rows.filter((r) => inValid(r[col]));
    note(`${key}: linhas órfãs`, rows.length - ok.length);
    return ok;
  };
  // helper: null-out a nullable user column when the user is missing
  const nullUser = (rows, cols) =>
    rows.map((r) => {
      const c = { ...r };
      for (const col of cols) if (!inValid(c[col])) c[col] = "";
      return c;
    });

  // 3) user_roles -----------------------------------------------------------
  console.log("→ user_roles");
  await insertRows("user_roles", ["id","user_id","role","created_at"],
    reqUser(readTable("user_roles").rows, "user_id", "user_roles"));

  // 4) access_codes (used_by nullable) -------------------------------------
  console.log("→ access_codes");
  await insertRows("access_codes",
    ["id","concurso_id","categoria_id","code","status","used_by","used_at","created_at"],
    nullUser(readTable("access_codes").rows, ["used_by"]),
    "(concurso_id, categoria_id, code) do nothing");

  // 5) category_access ------------------------------------------------------
  console.log("→ category_access");
  await insertRows("category_access",
    ["id","user_id","concurso_id","categoria_id","code","activated_at","expires_at"],
    reqUser(readTable("category_access").rows, "user_id", "category_access"),
    "(user_id, concurso_id, categoria_id) do nothing");

  // 6) cursos_preparatorios (no user FK) -----------------------------------
  console.log("→ cursos_preparatorios");
  await insertRows("cursos_preparatorios",
    ["id","concurso_id","nome","logo_url","contacto","link_externo","descricao","ativo","ordem","created_at","updated_at"],
    readTable("cursos_preparatorios").rows);

  // 7) battles (challenger/opponent required, winner nullable) -------------
  console.log("→ battles");
  let battles = readTable("battles").rows
    .filter((r) => inValid(r.challenger_id) && inValid(r.opponent_id));
  battles = nullUser(battles, ["winner_id"]);
  await insertRows("battles",
    ["id","challenger_id","opponent_id","concurso_id","categoria_id","question_ids","status","challenger_score","opponent_score","challenger_done","opponent_done","winner_id","created_at","updated_at"],
    battles);

  // 8) friendships ----------------------------------------------------------
  console.log("→ friendships");
  const fr = readTable("friendships").rows
    .filter((r) => inValid(r.requester_id) && inValid(r.addressee_id));
  await insertRows("friendships",
    ["id","requester_id","addressee_id","status","created_at"], fr,
    "(requester_id, addressee_id) do nothing");

  // 9) notifications (user_id nullable = broadcast; created_by nullable) ----
  console.log("→ notifications");
  await insertRows("notifications",
    ["id","user_id","title","body","read","created_by","created_at"],
    nullUser(readTable("notifications").rows, ["user_id", "created_by"]));

  // 10) payment_requests ----------------------------------------------------
  console.log("→ payment_requests");
  await insertRows("payment_requests",
    ["id","user_id","email","concurso_id","categoria_id","categoria_nome","comprovativo_url","status","notes","created_at","updated_at"],
    reqUser(readTable("payment_requests").rows, "user_id", "payment_requests"));

  // 11) points_log ----------------------------------------------------------
  console.log("→ points_log");
  await insertRows("points_log", ["id","user_id","delta","created_at"],
    reqUser(readTable("points_log").rows, "user_id", "points_log"));

  // 12) coin_topup_requests -------------------------------------------------
  console.log("→ coin_topup_requests");
  await insertRows("coin_topup_requests",
    ["id","user_id","email","amount_aoa","moedas","comprovativo_url","status","created_at","updated_at"],
    reqUser(readTable("coin_topup_requests").rows, "user_id", "coin_topup_requests"));

  // 13) coin_transactions ---------------------------------------------------
  console.log("→ coin_transactions");
  await insertRows("coin_transactions",
    ["id","user_id","tipo","amount","descricao","meta","created_at"],
    reqUser(readTable("coin_transactions").rows, "user_id", "coin_transactions"));

  // 14) withdrawal_requests -------------------------------------------------
  console.log("→ withdrawal_requests");
  await insertRows("withdrawal_requests",
    ["id","user_id","email","moedas","aoa","iban","status","created_at","updated_at"],
    reqUser(readTable("withdrawal_requests").rows, "user_id", "withdrawal_requests"));

  // 15) push_subscriptions --------------------------------------------------
  console.log("→ push_subscriptions");
  await insertRows("push_subscriptions",
    ["id","user_id","endpoint","p256dh","auth","last_notified_at","created_at","updated_at"],
    reqUser(readTable("push_subscriptions").rows, "user_id", "push_subscriptions"),
    "(user_id, endpoint) do nothing");

  console.log("\n✅ Importação concluída.");
  if (Object.keys(skipped).length) {
    console.log("Avisos / linhas ignoradas:");
    for (const [k, n] of Object.entries(skipped)) console.log(`  - ${k}: ${n}`);
  }
}

main()
  .catch((e) => { console.error("❌ Falhou:", e.message); process.exitCode = 1; })
  .finally(() => client.end());
