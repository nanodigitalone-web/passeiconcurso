// seed-questions.mjs — load the bundled quiz bank into the `questions` table.
// Idempotent (on conflict (id) do nothing), so re-running won't duplicate.
// Usage (from server/):  node scripts/seed-questions.mjs
// Neon:  DATABASE_URL=... DATABASE_SSL=true node scripts/seed-questions.mjs
import "dotenv/config";
import { createRequire } from "module";
import pg from "pg";

const require = createRequire(import.meta.url);
const bank = require("../data/quiz-bank.json");

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set."); process.exit(1); }
const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url, ssl });

// Flatten the nested bank into rows.
const rows = [];
for (const concurso of bank) {
  for (const cat of concurso.categorias || []) {
    for (const q of cat.questoes || []) {
      if (!q?.id || !q.enunciado || !Array.isArray(q.opcoes) || q.correta == null) continue;
      rows.push({
        id: q.id,
        concurso_id: concurso.id,
        categoria_id: cat.id,
        disciplina: q.disciplina ?? null,
        enunciado: q.enunciado,
        opcoes: JSON.stringify(q.opcoes),
        correta: q.correta,
        comentario: q.comentario ?? null,
      });
    }
  }
}

async function main() {
  await client.connect();
  const CHUNK = 300;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const params = [];
    const tuples = slice
      .map((r) => {
        params.push(r.id, r.concurso_id, r.categoria_id, r.disciplina, r.enunciado, r.opcoes, r.correta, r.comentario);
        const n = params.length;
        return `($${n - 7},$${n - 6},$${n - 5},$${n - 4},$${n - 3},$${n - 2}::jsonb,$${n - 1},$${n})`;
      })
      .join(",");
    const res = await client.query(
      `insert into questions
         (id, concurso_id, categoria_id, disciplina, enunciado, opcoes, correta, comentario)
       values ${tuples}
       on conflict (id) do nothing`,
      params,
    );
    inserted += res.rowCount;
  }
  console.log(`✓ questions seed: +${inserted} (de ${rows.length})`);
  await client.end();
}

main().catch((e) => { console.error("❌", e.message); process.exitCode = 1; });
