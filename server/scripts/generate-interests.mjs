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

  // Ciências Básicas e Línguas → geral/geral (não entram nos quizzes por
  // categoria; servem os interesses/planos, que filtram só por disciplina)
  ...([
    "Biologia", "Biologia Médica", "Química", "Química Orgânica", "Bioquímica",
    "Física", "Matemática", "Bioestatística", "Anatomia I (Aparelho Locomotor)",
    "Inglês", "Francês", "Espanhol",
  ].map((nome) => ({ nome, slug: slugify(nome), concurso_id: "geral", categoria_id: "geral", area: "Ciências Básicas e Línguas" }))),
];

// Áreas ainda "em breve" na app (Economia, Direito, Contabilidade, Gestão,
// Engenharias). Só entram na geração com INCLUDE_ALL_AREAS=1, para não gastar
// créditos de API em conteúdo que os utilizadores ainda não podem escolher.
if (process.env.INCLUDE_ALL_AREAS === "1") {
  const EXTRA = {
    "Economia": ["Introdução à Economia", "Microeconomia I", "Macroeconomia I", "História Económica Geral", "Econometria", "Desenvolvimento Económico", "Economia Internacional", "Moeda e Bancos", "Economia do Setor Público", "Teoria dos Jogos", "Economia Ambiental", "Finanças Públicas", "Pensamento Económico", "Economia Industrial"],
    "Direito": ["Introdução ao Estudo do Direito", "Direito Constitucional", "Direito Civil (Parte Geral)", "Direito Penal I", "Direito Processual Civil", "Direito do Trabalho", "Direito Administrativo", "Direito Comercial e Empresarial", "Direito Internacional Público", "Direito Fiscal e Tributário", "Direitos Humanos", "Filosofia do Direito", "Direito Processual Penal", "Direito do Ambiente"],
    "Contabilidade": ["Contabilidade Financeira I", "Contabilidade de Gestão", "Auditoria Financeira", "Contabilidade Avançada", "Fiscalidade Portuguesa/Internacional", "Consolidação de Contas", "Sistemas de Informação Contabilística", "Contabilidade Pública", "Análise de Demonstrações Financeiras", "Ética e Deontologia Contabilística", "Contabilidade de Sociedades", "Perícia Contábil", "Relato Financeiro", "Contabilidade Orçamental"],
    "Gestão": ["Princípios de Gestão", "Comportamento Organizacional", "Gestão de Recursos Humanos", "Marketing Estratégico", "Gestão Financeira", "Estratégia Empresarial", "Gestão de Operações e Logística", "Empreendedorismo", "Negociação e Gestão de Conflitos", "Gestão de Projetos", "Sistemas de Apoio à Decisão", "Gestão da Qualidade", "Negócios Internacionais", "Responsabilidade Social Corporativa"],
    "Engenharias": ["Cálculo Diferencial e Integral", "Álgebra Linear", "Física Mecânica", "Química Geral", "Geometria Descritiva", "Ciência e Engenharia dos Materiais", "Termodinâmica Aplicada", "Mecânica dos Fluidos", "Resistência dos Materiais", "Eletrotecnia Geral", "Programação e Computação", "Estatística e Probabilidades", "Investigação Operacional", "Fenómenos de Transferência"],
  };
  for (const [area, nomes] of Object.entries(EXTRA)) {
    const cid = slugify(area);
    TARGETS.push(...nomes.map((nome) => ({ nome, slug: slugify(nome), concurso_id: cid, categoria_id: cid, area })));
  }
}

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
  console.log(`Disciplinas: ${TARGETS.length} · alvo ${PER_DISC} cada`);
  console.log(`Estratégia: SUBIDA EM CONJUNTO — cada lote vai para a disciplina`);
  console.log(`com MENOS questões nesse momento. Nenhuma passa das ${PER_DISC} enquanto`);
  console.log(`houver outra abaixo.\n`);

  const slugs = TARGETS.map((t) => t.slug);
  const seenCache = new Map(); // slug → Set de enunciados (dedup)
  let grandTotal = 0;
  let fails = 0;

  for (;;) {
    // Reconta na BD a cada lote e escolhe a disciplina mais pobre AGORA.
    const { rows } = await db.query(
      `select disciplina, count(*)::int n from questions
        where active and disciplina = any($1::text[])
        group by disciplina`,
      [slugs],
    );
    const countMap = new Map(rows.map((r) => [r.disciplina, r.n]));
    let target = null;
    let min = Infinity;
    for (const t of TARGETS) {
      const n = countMap.get(t.slug) ?? 0;
      if (n < PER_DISC && n < min) { min = n; target = t; }
    }
    if (!target) break; // todas as disciplinas atingiram o alvo

    if (!seenCache.has(target.slug)) {
      const { rows: existing } = await db.query(
        "select lower(trim(enunciado)) e from questions where disciplina = $1",
        [target.slug],
      );
      seenCache.set(target.slug, new Set(existing.map((r) => r.e)));
    }
    const seen = seenCache.get(target.slug);

    let drafts;
    try {
      drafts = await genBatch(target, Math.min(BATCH, PER_DISC - min));
      fails = 0;
    } catch (e) {
      fails++;
      // Backoff exponencial: 5s, 10s, 20s... máx 5 min. NUNCA desiste.
      const wait = Math.min(300000, 5000 * Math.pow(2, Math.min(fails - 1, 6)));
      console.log(`  [erro ${fails}] ${e.message} — aguardar ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }

    let added = 0;
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
            target.slug,
            q.enunciado.trim(),
            JSON.stringify(q.opcoes.map((o) => o.trim())),
            q.correta,
            typeof q.comentario === "string" ? q.comentario.trim() : null,
          ],
        );
        added++;
        grandTotal++;
      }
    } catch (e) {
      console.log(`  (db: ${e.message}); a continuar`);
      await sleep(3000);
      continue;
    }
    console.log(`  ${target.nome} (${target.area}): +${added} → ${min + added}/${PER_DISC} · total gerado ${grandTotal}`);
    await sleep(PACE_MS);
  }

  const { rows: [{ n: totalEnd }] } = await db.query("select count(*)::int n from questions where active");
  console.log(`\n✅ Concluído: ${totalEnd} questões na BD (+${totalEnd - totalStart} nesta execução)`);
  console.log(`   Todas as ${TARGETS.length} disciplinas com ≥${PER_DISC} questões.`);
  await db.end();
}

main().catch((e) => { console.error("❌", e.message); process.exitCode = 1; });
