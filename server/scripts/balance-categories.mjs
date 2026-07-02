// balance-categories.mjs — equilibra o banco por CATEGORIA: gera questões para
// todas as categorias reais com menos de 500 questões até chegarem às 500,
// começando pelas mais pequenas. Nunca gera para categorias que já têm ≥500.
//
// Complementa o generate-interests.mjs (que trabalha por disciplina): este
// script cobre as categorias que ficaram para trás (ex: minsa/psicologia,
// uan/medicina, licenciatura-medicina/gineco-obstetricia).
//
// Uso (a partir de server/): node scripts/balance-categories.mjs [alvo=500]
import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";

const TARGET_PER_CAT = Number(process.argv[2]) || 500;
const BATCH = 15;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const PACE_MS = GEMINI_KEY ? 4500 : 800;

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL não definido"); process.exit(1); }
if (!GEMINI_KEY && !ANTHROPIC_KEY) { console.error("Define GEMINI_API_KEY ou ANTHROPIC_API_KEY"); process.exit(1); }
console.log(`Provider: ${GEMINI_KEY ? "Gemini (" + GEMINI_MODEL + ")" : "Anthropic Haiku"}`);
console.log(`Alvo: ${TARGET_PER_CAT} questões por categoria\n`);

const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
const db = new pg.Pool({ connectionString: url, ssl, max: 2, idleTimeoutMillis: 10000 });
db.on("error", (e) => console.log(`  (pool: ${e.message})`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractJsonArray(text) {
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const s = t.indexOf("["), e = t.lastIndexOf("]");
  if (s !== -1 && e !== -1 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

let anthropic = null;
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

async function genBatch(cat, disciplina, n) {
  const system =
    "És um especialista em concursos públicos da área da saúde em Angola. " +
    "Geras questões de escolha múltipla rigorosas, corretas, sem ambiguidade, " +
    "em português de Angola, no estilo de provas reais. Responde APENAS com JSON válido.";
  const prompt =
    `Gera ${n} questões de escolha múltipla sobre "${disciplina}" ` +
    `para o concurso "${cat.concurso_id}", categoria profissional "${cat.categoria_id}". ` +
    `Questões variadas: conceitos, aplicação clínica e situações práticas. ` +
    `Cada questão: exatamente 4 opções, 1 correta, comentário explicativo curto. ` +
    `Varia a posição da resposta correta. ` +
    `Formato (array JSON puro, nada mais): ` +
    `[{"enunciado":"...","opcoes":["...","...","...","..."],"correta":0,"comentario":"..."}]`;
  const text = await callModel(system, prompt);
  const arr = extractJsonArray(text);
  return Array.isArray(arr) ? arr : [];
}

async function main() {
  // Categorias reais abaixo do alvo (geral/geral é do worker de disciplinas).
  const { rows: cats } = await db.query(
    `select concurso_id, categoria_id, count(*)::int n from questions
      where active and concurso_id <> 'geral'
      group by 1, 2 having count(*) < $1 order by n asc`,
    [TARGET_PER_CAT],
  );
  if (cats.length === 0) {
    console.log("✅ Todas as categorias já têm o alvo. Nada a fazer.");
    await db.end();
    return;
  }
  console.log(`Categorias abaixo de ${TARGET_PER_CAT}: ${cats.map(c => `${c.concurso_id}/${c.categoria_id}(${c.n})`).join(", ")}\n`);

  for (const cat of cats) {
    // Dedup por categoria
    const { rows: existing } = await db.query(
      "select lower(trim(enunciado)) e from questions where concurso_id=$1 and categoria_id=$2",
      [cat.concurso_id, cat.categoria_id],
    );
    const seen = new Set(existing.map((r) => r.e));

    let fails = 0;
    for (;;) {
      const { rows: [{ n: current }] } = await db.query(
        "select count(*)::int n from questions where concurso_id=$1 and categoria_id=$2 and active",
        [cat.concurso_id, cat.categoria_id],
      );
      const needed = TARGET_PER_CAT - current;
      if (needed <= 0) break;

      // Disciplina com menos questões DENTRO desta categoria (equilíbrio interno)
      const { rows: [small] } = await db.query(
        `select coalesce(disciplina, 'Conhecimentos Gerais da Categoria') d, count(*)::int n
           from questions where concurso_id=$1 and categoria_id=$2 and active
          group by 1 order by n asc, random() limit 1`,
        [cat.concurso_id, cat.categoria_id],
      );
      const disciplina = small?.d ?? "Conhecimentos Gerais da Categoria";

      let drafts;
      try {
        drafts = await genBatch(cat, disciplina, Math.min(BATCH, needed));
        fails = 0;
      } catch (e) {
        fails++;
        const wait = Math.min(300000, 5000 * Math.pow(2, Math.min(fails - 1, 6)));
        console.log(`    [erro ${fails}] ${e.message} — aguardar ${Math.round(wait / 1000)}s`);
        await sleep(wait);
        continue;
      }

      let added = 0;
      for (const q of drafts) {
        if (!q || typeof q.enunciado !== "string" || !q.enunciado.trim()) continue;
        if (!Array.isArray(q.opcoes) || q.opcoes.length < 2) continue;
        if (!q.opcoes.every((o) => typeof o === "string" && o.trim())) continue;
        if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta >= q.opcoes.length) continue;
        const key = q.enunciado.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        try {
          await db.query(
            `insert into questions (id,concurso_id,categoria_id,disciplina,enunciado,opcoes,correta,comentario,source)
             values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'ai') on conflict (id) do nothing`,
            [
              "ai-" + randomUUID().slice(0, 12),
              cat.concurso_id, cat.categoria_id, disciplina,
              q.enunciado.trim(),
              JSON.stringify(q.opcoes.map((o) => o.trim())),
              q.correta,
              typeof q.comentario === "string" ? q.comentario.trim() : null,
            ],
          );
          added++;
        } catch (e) {
          console.log(`    (db: ${e.message})`);
          await sleep(3000);
        }
      }
      console.log(`  ${cat.concurso_id}/${cat.categoria_id} · ${disciplina}: +${added} (${current + added}/${TARGET_PER_CAT})`);
      await sleep(PACE_MS);
    }
    console.log(`✓ ${cat.concurso_id}/${cat.categoria_id} atingiu ${TARGET_PER_CAT}\n`);
  }

  console.log("✅ Equilíbrio de categorias concluído.");
  await db.end();
}

main().catch((e) => { console.error("❌", e.message); process.exitCode = 1; });
