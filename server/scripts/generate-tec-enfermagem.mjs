// generate-tec-enfermagem.mjs — gera 500+ questões para minsa/tec-enfermagem.
// Usa ANTHROPIC_API_KEY (ou GEMINI_API_KEY se definida).
//
// Uso (a partir de server/):
//   ANTHROPIC_API_KEY=... DATABASE_URL=<neon> DATABASE_SSL=true \
//     node scripts/generate-tec-enfermagem.mjs
import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";

const CONCURSO = "minsa";
const CATEGORIA = "tec-enfermagem";
const ADD_TARGET = 500; // gera este número adicional
const BATCH = 15;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const PACE_MS = GEMINI_KEY ? 4500 : 800;

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL não definido"); process.exit(1); }
if (!GEMINI_KEY && !ANTHROPIC_KEY) { console.error("Define GEMINI_API_KEY ou ANTHROPIC_API_KEY"); process.exit(1); }
console.log(`Provider: ${GEMINI_KEY ? "Gemini (" + GEMINI_MODEL + ")" : "Anthropic Haiku"}`);

const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
const db = new pg.Pool({ connectionString: url, ssl, max: 2, idleTimeoutMillis: 10000 });
db.on("error", (e) => console.log(`  (pool: ${e.message})`));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Disciplinas para técnico de enfermagem — as já existentes + novas relevantes
const DISCIPLINAS = [
  "Procedimentos de Enfermagem",
  "Emergências em Enfermagem",
  "Saúde Pública e Epidemiologia",
  "Farmacologia para Técnicos de Enfermagem",
  "Ética e Deontologia de Enfermagem",
  "Sinais Vitais e Monitorização",
  "Medicamentos e Vias de Administração",
  "Anatomia e Fisiologia Básica",
  "Microbiologia e Controlo de Infecção",
  "Semiologia Básica de Enfermagem",
  "Saúde Materno-Infantil",
  "Cuidados de Feridas e Pensos",
  "Nutrição e Dietética Básica",
  "Saúde Mental e Psiquiatria Básica",
  "Doenças Crónicas e Não Transmissíveis",
  "Doenças Tropicais e Endémicas em Angola",
];

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

async function genBatch(disciplina) {
  const system =
    "És um especialista em concursos públicos de saúde em Angola, especificamente para " +
    "Técnicos de Enfermagem do MINSA. Geras questões de escolha múltipla rigorosas, " +
    "corretas, sem ambiguidade, em português angolano, no estilo de provas reais do MINSA. " +
    "Responde APENAS com JSON válido.";
  const prompt =
    `Gera ${BATCH} questões de escolha múltipla sobre "${disciplina}" ` +
    `para concurso de Técnico de Enfermagem do MINSA Angola. ` +
    `Cada questão deve ter exatamente 4 opções, 1 correta, e um comentário explicativo curto. ` +
    `Varia a posição da resposta correta (não seja sempre a opção A). ` +
    `As questões devem cobrir situações práticas do dia-a-dia hospitalar. ` +
    `Formato (array JSON puro, nada mais): ` +
    `[{"enunciado":"...","opcoes":["...","...","...","..."],"correta":0,"comentario":"..."}]`;
  const text = await callModel(system, prompt);
  const arr = extractJsonArray(text);
  return Array.isArray(arr) ? arr : [];
}

async function main() {
  const { rows: [{ n: startCount }] } = await db.query(
    "select count(*)::int n from questions where concurso_id=$1 and categoria_id=$2 and active",
    [CONCURSO, CATEGORIA]
  );
  console.log(`Início: ${startCount} questões em ${CONCURSO}/${CATEGORIA}`);
  console.log(`Alvo: +${ADD_TARGET} questões adicionais = ~${startCount + ADD_TARGET} total\n`);

  // Carrega enunciados existentes para deduplicação
  const { rows: existing } = await db.query(
    "select lower(trim(enunciado)) e from questions where concurso_id=$1 and categoria_id=$2",
    [CONCURSO, CATEGORIA]
  );
  const seen = new Set(existing.map((r) => r.e));

  let added = 0;
  let fails = 0;
  let discIndex = 0;

  while (added < ADD_TARGET) {
    const disciplina = DISCIPLINAS[discIndex % DISCIPLINAS.length];
    discIndex++;

    let drafts;
    try {
      drafts = await genBatch(disciplina);
    } catch (e) {
      fails++;
      const wait = Math.min(60000, 3000 * fails);
      console.log(`  erro na geração (${e.message}); aguardar ${wait}ms`);
      await sleep(wait);
      if (fails > 20) { console.error("Demasiados erros, a parar."); break; }
      continue;
    }
    fails = 0;

    let inserted = 0;
    try {
      for (const q of drafts) {
        if (!q || typeof q.enunciado !== "string" || !q.enunciado.trim()) continue;
        if (!Array.isArray(q.opcoes) || q.opcoes.length < 2) continue;
        if (!q.opcoes.every((o) => typeof o === "string" && o.trim())) continue;
        if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta >= q.opcoes.length) continue;
        const key = q.enunciado.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        await db.query(
          `insert into questions (id,concurso_id,categoria_id,disciplina,enunciado,opcoes,correta,comentario,source)
           values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'ai') on conflict (id) do nothing`,
          [
            "ai-" + randomUUID().slice(0, 12),
            CONCURSO, CATEGORIA, disciplina,
            q.enunciado.trim(),
            JSON.stringify(q.opcoes.map((o) => o.trim())),
            q.correta,
            typeof q.comentario === "string" ? q.comentario.trim() : null,
          ],
        );
        inserted++;
        added++;
        if (added >= ADD_TARGET) break;
      }
    } catch (e) {
      console.log(`  (db erro: ${e.message}); a continuar`);
      await sleep(2000);
      continue;
    }
    const total = startCount + added;
    console.log(`  [+${added}/${ADD_TARGET} | total ~${total}] +${inserted} — ${disciplina}`);
    await sleep(PACE_MS);
  }

  const { rows: [{ n: finalCount }] } = await db.query(
    "select count(*)::int n from questions where concurso_id=$1 and categoria_id=$2 and active",
    [CONCURSO, CATEGORIA]
  );
  console.log(`\n✅ Concluído: ${finalCount} questões em ${CONCURSO}/${CATEGORIA} (+${finalCount - startCount} nesta execução)`);
  await db.end();
}

main().catch((e) => { console.error("❌", e.message); process.exitCode = 1; });
