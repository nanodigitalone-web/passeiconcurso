// generate-interests.mjs — gera questões para TODAS as disciplinas de saúde
// da taxonomia de interesses (disciplinas.ts), usando o slug como campo `disciplina`.
// Isto permite que o filtro de interesses funcione: a BD terá questões com
// disciplina="anatomia-humana-sistemica" que o sistema de interesses procura.
//
// Mapeamento: cada área de saúde → concurso/categoria mais adequada
//   Medicina        → minsa/medico
//   Enfermagem      → minsa/enfermeiro
//   Fisioterapia    → minsa/fisioterapeuta
//   Farmácia        → minsa/farmaceutico
//   Análises Clínicas → minsa/laboratorio
//
// Uso (a partir de server/):
//   ANTHROPIC_API_KEY=... DATABASE_URL=<neon> DATABASE_SSL=true \
//     node scripts/generate-interests.mjs [questoes_por_disciplina]
import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";

const PER_DISC = Number(process.argv[2]) || 30; // questões por disciplina
const BATCH = 15;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const PACE_MS = GEMINI_KEY ? 4500 : 800;

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL não definido"); process.exit(1); }
if (!GEMINI_KEY && !ANTHROPIC_KEY) { console.error("Define GEMINI_API_KEY ou ANTHROPIC_API_KEY"); process.exit(1); }
console.log(`Provider: ${GEMINI_KEY ? "Gemini (" + GEMINI_MODEL + ")" : "Anthropic Haiku"}`);
console.log(`Alvo: ${PER_DISC} questões por disciplina\n`);

const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
const db = new pg.Pool({ connectionString: url, ssl, max: 2, idleTimeoutMillis: 10000 });
db.on("error", (e) => console.log(`  (pool: ${e.message})`));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Slugify replicando a lógica de disciplinas.ts
function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Disciplinas de saúde com mapeamento concurso/categoria
const TARGETS = [
  // Medicina → minsa/medico
  ...([
    "Anatomia Humana Sistémica", "Neuroanatomia", "Histologia e Embriologia",
    "Fisiologia Humana Integrada", "Patologia Especial e Órgãos",
    "Semiologia Médica I e II", "Farmacologia Médica e Terapêutica",
    "Genética Médica e Genómica", "Imunologia Clínica", "Microbiologia Médica",
    "Parasitologia Médica", "Epidemiologia e Bioestatística",
    "Saúde Coletiva e de Família", "Ginecologia e Obstetrícia",
    "Pediatria e Neonatologia", "Cirurgia Geral e Trauma",
    "Clínica Médica (Cardio, Pneumo, Gastro)", "Psiquiatria e Saúde Mental",
    "Dermatologia", "Neurologia Clínica", "Ortopedia e Traumatologia",
    "Oftalmologia e Otorrinolaringologia", "Oncologia Clínica",
    "Medicina de Urgência e Emergência", "Medicina Legal e Bioética",
  ].map((nome) => ({ nome, slug: slugify(nome), concurso_id: "minsa", categoria_id: "medico", area: "Medicina" }))),

  // Enfermagem → minsa/enfermeiro
  ...([
    "Fundamentos de Enfermagem", "Bioética e Deontologia de Enfermagem",
    "Enfermagem em Saúde Comunitária", "Enfermagem na Saúde do Adulto",
    "Enfermagem na Saúde do Idoso (Geriatria)", "Enfermagem em Cuidados Paliativos",
    "Enfermagem Médico-Cirúrgica", "Enfermagem em Unidade de Cuidados Intensivos (UCI)",
    "Enfermagem Materno-Infantil e Obstetrícia", "Enfermagem Pediátrica",
    "Enfermagem em Saúde Mental e Psiquiatria", "Gestão e Administração em Enfermagem",
    "Semiotécnica Aplicada à Enfermagem", "Enfermagem em Urgência e Emergência Hospitalar",
    "Nutrição e Dietética Aplicada",
  ].map((nome) => ({ nome, slug: slugify(nome), concurso_id: "minsa", categoria_id: "enfermeiro", area: "Enfermagem" }))),

  // Fisioterapia → minsa/fisioterapeuta
  ...([
    "Cinesiologia Geral", "Biomecânica Humana",
    "Fisioterapia em Ortopedia e Traumatologia",
    "Fisioterapia Neurofuncional (Adulto e Pediátrica)",
    "Fisioterapia Cardiorespiratória", "Fisioterapia em Unidade de Cuidados Intensivos",
    "Cinesioterapia e Mecanoterapia", "Eletrotermofototerapia",
    "Fisioterapia Dermatofuncional", "Fisioterapia Desportiva",
    "Fisioterapia na Saúde da Mulher e do Homem", "Ergonomia e Saúde do Trabalhador",
    "Fisioterapia em Geriatria e Gerontologia", "Hidroterapia (Fisioterapia Aquática)",
    "Diagnóstico por Imagem para Fisioterapia",
  ].map((nome) => ({ nome, slug: slugify(nome), concurso_id: "minsa", categoria_id: "fisioterapeuta", area: "Fisioterapia" }))),

  // Farmácia → minsa/farmaceutico
  ...([
    "Química Orgânica Medicinal", "Farmacognosia e Fitoterapia",
    "Farmacocinética e Farmacodinâmica",
    "Tecnologia Farmacêutica (Sólidos, Líquidos e Semissólidos)",
    "Farmácia Galénica", "Química Farmacêutica", "Bromatologia e Análise de Alimentos",
    "Cosmetologia e Estética Farmacêutica", "Farmácia Clínica e Cuidados Farmacêuticos",
    "Farmacoepidemiologia e Farmacovigilância", "Gestão e Marketing Farmacêutico",
    "Biotecnologia Farmacêutica", "Controle de Qualidade de Medicamentos",
    "Toxicologia Geral e Ocupacional", "Dispositivos Médicos e Assuntos Regulamentares",
  ].map((nome) => ({ nome, slug: slugify(nome), concurso_id: "minsa", categoria_id: "farmaceutico", area: "Farmácia" }))),

  // Análises Clínicas → minsa/laboratorio
  ...([
    "Bioquímica Clínica I e II", "Hematologia Clínica e Hemostase",
    "Imuno-hematologia e Banco de Sangue",
    "Microbiologia Clínica (Bacteriologia e Micologia)", "Virologia Clínica",
    "Parasitologia Humana Laboratorial", "Imunodiagnóstico Humano",
    "Uroanálise e Líquidos Biológicos", "Citopatologia e Histopatologia Laboratorial",
    "Biologia Molecular Aplicada ao Diagnóstico", "Endocrinologia Laboratorial",
    "Gestão da Qualidade no Laboratório Clínico", "Instrumentação e Automação Laboratorial",
    "Toxicologia Analítica e Forense", "Genética Laboratorial e Citogenética",
  ].map((nome) => ({ nome, slug: slugify(nome), concurso_id: "minsa", categoria_id: "laboratorio", area: "Análises Clínicas" }))),
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
    model: "claude-haiku-4-5-20251001", max_tokens: 4000, system,
    messages: [{ role: "user", content: prompt }],
  });
  return r.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

async function genBatch(target, n) {
  const system =
    "És um especialista em concursos públicos da área da saúde em Angola. " +
    "Geras questões de escolha múltipla rigorosas, corretas, sem ambiguidade, " +
    "em português de Angola. Responde APENAS com JSON válido.";
  const prompt =
    `Gera ${n} questões de escolha múltipla sobre "${target.nome}" (área: ${target.area}) ` +
    `para estudantes e profissionais de saúde em Angola. ` +
    `As questões devem ser variadas: conceitos teóricos, aplicação clínica, situações práticas. ` +
    `Cada questão: exatamente 4 opções, 1 correta, comentário explicativo curto. ` +
    `Varia a posição da resposta correta. ` +
    `Formato (array JSON puro, nada mais): ` +
    `[{"enunciado":"...","opcoes":["...","...","...","..."],"correta":0,"comentario":"..."}]`;
  const text = await callModel(system, prompt);
  const arr = extractJsonArray(text);
  return Array.isArray(arr) ? arr : [];
}

async function main() {
  const { rows: [{ n: totalStart }] } = await db.query("select count(*)::int n from questions where active");
  console.log(`Total inicial na BD: ${totalStart}`);
  console.log(`Disciplinas a processar: ${TARGETS.length}`);
  console.log(`Questões alvo por disciplina: ${PER_DISC}`);
  console.log(`Total esperado gerado: ~${TARGETS.length * PER_DISC}\n`);

  let grandTotal = 0;

  for (const [i, target] of TARGETS.entries()) {
    // Conta quantas já existem com este slug (disciplina)
    const { rows: [{ n: existingCount }] } = await db.query(
      "select count(*)::int n from questions where concurso_id=$1 and categoria_id=$2 and disciplina=$3 and active",
      [target.concurso_id, target.categoria_id, target.slug]
    );

    const needed = Math.max(0, PER_DISC - existingCount);
    if (needed === 0) {
      console.log(`  [${i + 1}/${TARGETS.length}] ✓ já tem ${existingCount} — ${target.nome}`);
      continue;
    }

    // Carrega enunciados existentes desta disciplina para deduplicação
    const { rows: existing } = await db.query(
      "select lower(trim(enunciado)) e from questions where concurso_id=$1 and categoria_id=$2 and disciplina=$3",
      [target.concurso_id, target.categoria_id, target.slug]
    );
    const seen = new Set(existing.map((r) => r.e));

    let added = 0;
    let fails = 0;

    while (added < needed) {
      const batchN = Math.min(BATCH, needed - added);
      let drafts;
      try {
        drafts = await genBatch(target, batchN);
      } catch (e) {
        fails++;
        const wait = Math.min(60000, 3000 * fails);
        console.log(`    erro (${e.message}); aguardar ${wait}ms`);
        await sleep(wait);
        if (fails > 10) { console.log(`    muitos erros para "${target.nome}", a passar`); break; }
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
              target.concurso_id, target.categoria_id,
              target.slug,  // slug estável para o sistema de interesses
              q.enunciado.trim(),
              JSON.stringify(q.opcoes.map((o) => o.trim())),
              q.correta,
              typeof q.comentario === "string" ? q.comentario.trim() : null,
            ],
          );
          inserted++;
          added++;
          grandTotal++;
          if (added >= needed) break;
        }
      } catch (e) {
        console.log(`    (db: ${e.message}); a continuar`);
        await sleep(2000);
        continue;
      }
      await sleep(PACE_MS);
    }

    console.log(`  [${i + 1}/${TARGETS.length}] +${added} — ${target.nome} (${target.area})`);
  }

  const { rows: [{ n: totalEnd }] } = await db.query("select count(*)::int n from questions where active");
  console.log(`\n✅ Concluído: ${totalEnd} questões na BD (+${totalEnd - totalStart} nesta execução)`);
  console.log(`   Disciplinas de interesses agora cobertas com slugs correctos.`);
  await db.end();
}

main().catch((e) => { console.error("❌", e.message); process.exitCode = 1; });
