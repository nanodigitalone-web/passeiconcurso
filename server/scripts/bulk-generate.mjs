// bulk-generate.mjs — fill the `questions` table toward a target.
// Provider: Google Gemini (GEMINI_API_KEY) by default, else Anthropic Claude
// Haiku (ANTHROPIC_API_KEY). Resumable, prioritizes the smallest categories,
// validates + dedups before inserting (source='ai').
//
// Usage (from server/):
//   GEMINI_API_KEY=... DATABASE_URL=<neon> DATABASE_SSL=true \
//     node scripts/bulk-generate.mjs <target_total> [per_batch]
import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";

const TARGET = Number(process.argv[2]) || 10000;
const BATCH = Number(process.argv[3]) || 15;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
// Gemini free tier is ~15 req/min → pace ~4.5s between calls; Anthropic faster.
const PACE_MS = GEMINI_KEY ? 4500 : 600;

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
if (!GEMINI_KEY && !ANTHROPIC_KEY) { console.error("Set GEMINI_API_KEY or ANTHROPIC_API_KEY"); process.exit(1); }
console.log(`Provider: ${GEMINI_KEY ? "Gemini (" + GEMINI_MODEL + ")" : "Anthropic Haiku"}`);
const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
// Pool (not a single Client) so dropped connections (Neon closes long-lived
// ones) are transparently replaced instead of crashing the whole run.
const db = new pg.Pool({ connectionString: url, ssl, max: 2, idleTimeoutMillis: 10000 });
db.on("error", (e) => console.log(`  (pool warning: ${e.message})`));

let anthropic = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractJsonArray(text) {
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const s = t.indexOf("["), e = t.lastIndexOf("]");
  if (s !== -1 && e !== -1 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

async function callModel(system, prompt) {
  if (GEMINI_KEY) {
    const u = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
    const resp = await fetch(u, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.9, responseMimeType: "application/json" },
      }),
    });
    if (!resp.ok) throw new Error(`gemini_${resp.status}: ${(await resp.text()).slice(0, 160)}`);
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
  }
  if (!anthropic) anthropic = new (await import("@anthropic-ai/sdk")).default();
  const r = await anthropic.messages.create({
    model: "claude-haiku-4-5", max_tokens: 4000, system,
    messages: [{ role: "user", content: prompt }],
  });
  return r.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

async function genOne(target) {
  const system =
    "És um especialista em concursos públicos da saúde em Angola. Geras questões de " +
    "escolha múltipla rigorosas, corretas, sem ambiguidade, em português de Angola, " +
    "no mesmo estilo de provas anteriores. Responde APENAS com JSON válido.";
  const prompt =
    `Gera ${BATCH} questões de escolha múltipla sobre "${target.disciplina}" ` +
    `(concurso "${target.concurso_id}", categoria "${target.categoria_id}"). ` +
    `Cada questão: exatamente 4 opções, 1 correta, e um comentário curto. ` +
    `Varia a posição da resposta correta. ` +
    `Formato (array JSON, nada mais): ` +
    `[{"enunciado":"...","opcoes":["...","...","...","..."],"correta":0,"comentario":"..."}]`;
  const text = await callModel(system, prompt);
  const arr = extractJsonArray(text);
  return Array.isArray(arr) ? arr : [];
}

// Pick the category with the FEWEST active questions, then its smallest
// disciplina. This fills small categories first, which is where users hit
// repeats. Recomputed each batch so everything balances over time.
async function pickSmallestTarget() {
  const cat = (
    await db.query(
      `select concurso_id, categoria_id from questions where active
        group by 1,2 order by count(*) asc, random() limit 1`,
    )
  ).rows[0];
  if (!cat) return null;
  const disc = (
    await db.query(
      `select coalesce(disciplina,'Geral') disciplina from questions
        where concurso_id=$1 and categoria_id=$2 and disciplina is not null
        group by 1 order by count(*) asc, random() limit 1`,
      [cat.concurso_id, cat.categoria_id],
    )
  ).rows[0];
  return {
    concurso_id: cat.concurso_id,
    categoria_id: cat.categoria_id,
    disciplina: disc?.disciplina || "Geral",
  };
}

async function main() {
  let total = Number((await db.query("select count(*)::int c from questions")).rows[0].c);
  console.log(`Início: ${total} questões na BD | alvo: ${TARGET}`);

  let fails = 0;
  while (total < TARGET) {
    const target = await pickSmallestTarget();
    if (!target) break;
    let drafts;
    try {
      drafts = await genOne(target);
    } catch (e) {
      fails++;
      const wait = Math.min(60000, 3000 * fails);
      console.log(`  erro (${e.message}); a aguardar ${wait}ms`);
      await sleep(wait);
      if (fails > 20) { console.error("Demasiados erros seguidos, a parar."); break; }
      continue;
    }
    fails = 0;

    let inserted = 0;
    try {
      const existing = new Set(
        (
          await db.query(
            "select lower(trim(enunciado)) e from questions where concurso_id=$1 and categoria_id=$2",
            [target.concurso_id, target.categoria_id],
          )
        ).rows.map((r) => r.e),
      );
      for (const q of drafts) {
        if (!q || typeof q.enunciado !== "string" || !q.enunciado.trim()) continue;
        if (!Array.isArray(q.opcoes) || q.opcoes.length < 2) continue;
        if (!q.opcoes.every((o) => typeof o === "string" && o.trim())) continue;
        if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta >= q.opcoes.length) continue;
        const key = q.enunciado.toLowerCase().trim();
        if (existing.has(key)) continue;
        existing.add(key);
        await db.query(
          `insert into questions (id,concurso_id,categoria_id,disciplina,enunciado,opcoes,correta,comentario,source)
           values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'ai') on conflict (id) do nothing`,
          [
            "ai-" + randomUUID().slice(0, 12),
            target.concurso_id,
            target.categoria_id,
            target.disciplina,
            q.enunciado.trim(),
            JSON.stringify(q.opcoes.map((o) => o.trim())),
            q.correta,
            typeof q.comentario === "string" ? q.comentario.trim() : null,
          ],
        );
        inserted++;
        total++;
      }
    } catch (e) {
      console.log(`  (db erro: ${e.message}); a continuar`);
      await sleep(2000);
      continue;
    }
    console.log(`  [${total}/${TARGET}] +${inserted} (${target.concurso_id}/${target.categoria_id}/${target.disciplina})`);
    await sleep(PACE_MS); // pacing (respeita o limite grátis do Gemini)
  }
  console.log(`✅ Concluído: ${total} questões.`);
  await db.end();
}

main().catch((e) => { console.error("❌", e.message); process.exitCode = 1; });
