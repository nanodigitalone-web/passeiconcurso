import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "node:child_process";
import webpush from "web-push";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { accessRouter } from "./routes/access.js";
import { contentRouter } from "./routes/content.js";
import { rankingRouter } from "./routes/ranking.js";
import { friendsRouter } from "./routes/friends.js";
import { battlesRouter } from "./routes/battles.js";
import { notificationsRouter } from "./routes/notifications.js";
import { coinsRouter } from "./routes/coins.js";
import { cursosRouter } from "./routes/cursos.js";
import { paymentsRouter } from "./routes/payments.js";
import { pushRouter } from "./routes/push.js";
import { adminRouter } from "./routes/admin.js";
import { promoRouter } from "./routes/promo.js";
import { subscriptionsRouter } from "./routes/subscriptions.js";
import { examsRouter } from "./routes/exams.js";
import { pool, query } from "./lib/db.js";

// Safety net: a single unhandled async error must never take the whole server
// down (Node crashes on unhandledRejection by default). Log and keep serving.
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));

const app = express();

// Behind Render's proxy — needed so rate-limit & req.ip see the real client IP.
app.set("trust proxy", 1);

// Security headers. crossOriginResourcePolicy is relaxed so the SPA on another
// origin (Vercel) can load uploaded proof images served from /uploads.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(express.json({ limit: "2mb" }));

// Throttle auth endpoints to blunt brute-force / credential-stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});

// Global ceiling per IP: generous for real users (a study session is a few
// dozen calls), hostile to scrapers hammering the question endpoints.
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 800,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
  skip: (req) => req.path === "/health" || req.path === "/",
});

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: origins.length ? origins : true,
    credentials: false,
  }),
);

// Serve uploaded proofs.
app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_DIR || "./uploads")));

// Root route so uptime monitors hitting the base URL get a 200 (not 404).
app.get("/", (_req, res) => res.json({ ok: true, service: "passei-api" }));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.use(apiLimiter);
app.use("/auth", authLimiter, authRouter);
app.use("/profile", profileRouter);
app.use("/access", accessRouter);
app.use("/content", contentRouter);
app.use("/ranking", rankingRouter);
app.use("/friends", friendsRouter);
app.use("/battles", battlesRouter);
app.use("/notifications", notificationsRouter);
app.use("/coins", coinsRouter);
app.use("/cursos", cursosRouter);
app.use("/payments", paymentsRouter);
app.use("/push", pushRouter);
app.use("/admin", adminRouter);
app.use("/promo", promoRouter);
app.use("/subscriptions", subscriptionsRouter);
app.use("/exams", examsRouter);

// ---- Push cron (call every 8h via Render Cron Job with the x-cron-secret header) ----
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@passeii.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

app.post("/cron/push", async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers["x-cron-secret"] !== process.env.CRON_SECRET)
    return res.status(401).json({ error: "Unauthorized" });

  const subs = (await query("select * from push_subscriptions")).rows;
  const payload = JSON.stringify({
    title: "Hora de praticar! 📚",
    body: "Faça um simulado rápido e mantenha o seu ritmo de estudo.",
    url: "/aprender",
  });
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      await query("update push_subscriptions set last_notified_at = now() where id = $1", [s.id]);
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await query("delete from push_subscriptions where id = $1", [s.id]);
      }
    }
  }
  res.json({ ok: true, sent });
});

// ---- Bulk question generation (triggered externally via x-cron-secret) ----
// Runs in background — returns immediately. Uses Claude Haiku (ANTHROPIC_API_KEY).
// Covers all 155 interest disciplines with correct slugs matching profiles.interesses.
app.post("/cron/generate-bulk", async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers["x-cron-secret"] !== process.env.CRON_SECRET)
    return res.status(401).json({ error: "unauthorized" });
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY)
    return res.status(501).json({ error: "no AI key configured" });

  res.json({ ok: true, message: "Geração iniciada em background (Claude Haiku)" });

  (async () => {
    const { generateQuestions } = await import("./lib/generateQuestions.js");

    // Each entry: [concursoId, categoriaId, disciplinaSlug, disciplinaNome]
    // slug = stored in DB and matched against profiles.interesses
    // nome = used in the AI prompt for quality
    const DISC: [string, string, string, string][] = [
      ["medicina","medicina","anatomia-humana-sistemica","Anatomia Humana Sistémica"],
      ["medicina","medicina","neuroanatomia","Neuroanatomia"],
      ["medicina","medicina","histologia-e-embriologia","Histologia e Embriologia"],
      ["medicina","medicina","fisiologia-humana-integrada","Fisiologia Humana Integrada"],
      ["medicina","medicina","patologia-especial-e-orgaos","Patologia Especial e Órgãos"],
      ["medicina","medicina","semiologia-medica-i-e-ii","Semiologia Médica I e II"],
      ["medicina","medicina","farmacologia-medica-e-terapeutica","Farmacologia Médica e Terapêutica"],
      ["medicina","medicina","genetica-medica-e-genomica","Genética Médica e Genómica"],
      ["medicina","medicina","imunologia-clinica","Imunologia Clínica"],
      ["medicina","medicina","microbiologia-medica","Microbiologia Médica"],
      ["medicina","medicina","parasitologia-medica","Parasitologia Médica"],
      ["medicina","medicina","epidemiologia-e-bioestatistica","Epidemiologia e Bioestatística"],
      ["medicina","medicina","saude-coletiva-e-de-familia","Saúde Coletiva e de Família"],
      ["medicina","medicina","ginecologia-e-obstetricia","Ginecologia e Obstetrícia"],
      ["medicina","medicina","pediatria-e-neonatologia","Pediatria e Neonatologia"],
      ["medicina","medicina","cirurgia-geral-e-trauma","Cirurgia Geral e Trauma"],
      ["medicina","medicina","clinica-medica-cardio-pneumo-gastro","Clínica Médica (Cardio, Pneumo, Gastro)"],
      ["medicina","medicina","psiquiatria-e-saude-mental","Psiquiatria e Saúde Mental"],
      ["medicina","medicina","dermatologia","Dermatologia"],
      ["medicina","medicina","neurologia-clinica","Neurologia Clínica"],
      ["medicina","medicina","ortopedia-e-traumatologia","Ortopedia e Traumatologia"],
      ["medicina","medicina","oftalmologia-e-otorrinolaringologia","Oftalmologia e Otorrinolaringologia"],
      ["medicina","medicina","oncologia-clinica","Oncologia Clínica"],
      ["medicina","medicina","medicina-de-urgencia-e-emergencia","Medicina de Urgência e Emergência"],
      ["medicina","medicina","medicina-legal-e-bioetica","Medicina Legal e Bioética"],
      ["enfermagem","enfermagem","fundamentos-de-enfermagem","Fundamentos de Enfermagem"],
      ["enfermagem","enfermagem","bioetica-e-deontologia-de-enfermagem","Bioética e Deontologia de Enfermagem"],
      ["enfermagem","enfermagem","enfermagem-em-saude-comunitaria","Enfermagem em Saúde Comunitária"],
      ["enfermagem","enfermagem","enfermagem-na-saude-do-adulto","Enfermagem na Saúde do Adulto"],
      ["enfermagem","enfermagem","enfermagem-na-saude-do-idoso-geriatria","Enfermagem na Saúde do Idoso (Geriatria)"],
      ["enfermagem","enfermagem","enfermagem-em-cuidados-paliativos","Enfermagem em Cuidados Paliativos"],
      ["enfermagem","enfermagem","enfermagem-medico-cirurgica","Enfermagem Médico-Cirúrgica"],
      ["enfermagem","enfermagem","enfermagem-em-unidade-de-cuidados-intensivos-uci","Enfermagem em Unidade de Cuidados Intensivos (UCI)"],
      ["enfermagem","enfermagem","enfermagem-materno-infantil-e-obstetricia","Enfermagem Materno-Infantil e Obstetrícia"],
      ["enfermagem","enfermagem","enfermagem-pediatrica","Enfermagem Pediátrica"],
      ["enfermagem","enfermagem","enfermagem-em-saude-mental-e-psiquiatria","Enfermagem em Saúde Mental e Psiquiatria"],
      ["enfermagem","enfermagem","gestao-e-administracao-em-enfermagem","Gestão e Administração em Enfermagem"],
      ["enfermagem","enfermagem","semiotecnica-aplicada-a-enfermagem","Semiotécnica Aplicada à Enfermagem"],
      ["enfermagem","enfermagem","enfermagem-em-urgencia-e-emergencia-hospitalar","Enfermagem em Urgência e Emergência Hospitalar"],
      ["enfermagem","enfermagem","nutricao-e-dietetica-aplicada","Nutrição e Dietética Aplicada"],
      ["fisioterapia","fisioterapia","cinesiologia-geral","Cinesiologia Geral"],
      ["fisioterapia","fisioterapia","biomecanica-humana","Biomecânica Humana"],
      ["fisioterapia","fisioterapia","fisioterapia-em-ortopedia-e-traumatologia","Fisioterapia em Ortopedia e Traumatologia"],
      ["fisioterapia","fisioterapia","fisioterapia-neurofuncional-adulto-e-pediatrica","Fisioterapia Neurofuncional (Adulto e Pediátrica)"],
      ["fisioterapia","fisioterapia","fisioterapia-cardiorespiratoria","Fisioterapia Cardiorespiratória"],
      ["fisioterapia","fisioterapia","fisioterapia-em-unidade-de-cuidados-intensivos","Fisioterapia em Unidade de Cuidados Intensivos"],
      ["fisioterapia","fisioterapia","cinesioterapia-e-mecanoterapia","Cinesioterapia e Mecanoterapia"],
      ["fisioterapia","fisioterapia","eletrotermofototerapia","Eletrotermofototerapia"],
      ["fisioterapia","fisioterapia","fisioterapia-dermatofuncional","Fisioterapia Dermatofuncional"],
      ["fisioterapia","fisioterapia","fisioterapia-desportiva","Fisioterapia Desportiva"],
      ["fisioterapia","fisioterapia","fisioterapia-na-saude-da-mulher-e-do-homem","Fisioterapia na Saúde da Mulher e do Homem"],
      ["fisioterapia","fisioterapia","ergonomia-e-saude-do-trabalhador","Ergonomia e Saúde do Trabalhador"],
      ["fisioterapia","fisioterapia","fisioterapia-em-geriatria-e-gerontologia","Fisioterapia em Geriatria e Gerontologia"],
      ["fisioterapia","fisioterapia","hidroterapia-fisioterapia-aquatica","Hidroterapia (Fisioterapia Aquática)"],
      ["fisioterapia","fisioterapia","diagnostico-por-imagem-para-fisioterapia","Diagnóstico por Imagem para Fisioterapia"],
      ["farmacia","farmacia","quimica-organica-medicinal","Química Orgânica Medicinal"],
      ["farmacia","farmacia","farmacognosia-e-fitoterapia","Farmacognosia e Fitoterapia"],
      ["farmacia","farmacia","farmacocinetica-e-farmacodinamica","Farmacocinética e Farmacodinâmica"],
      ["farmacia","farmacia","tecnologia-farmaceutica-solidos-liquidos-e-semissolidos","Tecnologia Farmacêutica (Sólidos, Líquidos e Semissólidos)"],
      ["farmacia","farmacia","farmacia-galenica","Farmácia Galénica"],
      ["farmacia","farmacia","quimica-farmaceutica","Química Farmacêutica"],
      ["farmacia","farmacia","bromatologia-e-analise-de-alimentos","Bromatologia e Análise de Alimentos"],
      ["farmacia","farmacia","cosmetologia-e-estetica-farmaceutica","Cosmetologia e Estética Farmacêutica"],
      ["farmacia","farmacia","farmacia-clinica-e-cuidados-farmaceuticos","Farmácia Clínica e Cuidados Farmacêuticos"],
      ["farmacia","farmacia","farmacoepidemiologia-e-farmacovigilancia","Farmacoepidemiologia e Farmacovigilância"],
      ["farmacia","farmacia","gestao-e-marketing-farmaceutico","Gestão e Marketing Farmacêutico"],
      ["farmacia","farmacia","biotecnologia-farmaceutica","Biotecnologia Farmacêutica"],
      ["farmacia","farmacia","controle-de-qualidade-de-medicamentos","Controle de Qualidade de Medicamentos"],
      ["farmacia","farmacia","toxicologia-geral-e-ocupacional","Toxicologia Geral e Ocupacional"],
      ["farmacia","farmacia","dispositivos-medicos-e-assuntos-regulamentares","Dispositivos Médicos e Assuntos Regulamentares"],
      ["analises-clinicas","analises-clinicas","bioquimica-clinica-i-e-ii","Bioquímica Clínica I e II"],
      ["analises-clinicas","analises-clinicas","hematologia-clinica-e-hemostase","Hematologia Clínica e Hemostase"],
      ["analises-clinicas","analises-clinicas","imuno-hematologia-e-banco-de-sangue","Imuno-hematologia e Banco de Sangue"],
      ["analises-clinicas","analises-clinicas","microbiologia-clinica-bacteriologia-e-micologia","Microbiologia Clínica (Bacteriologia e Micologia)"],
      ["analises-clinicas","analises-clinicas","virologia-clinica","Virologia Clínica"],
      ["analises-clinicas","analises-clinicas","parasitologia-humana-laboratorial","Parasitologia Humana Laboratorial"],
      ["analises-clinicas","analises-clinicas","imunodiagnostico-humano","Imunodiagnóstico Humano"],
      ["analises-clinicas","analises-clinicas","uroanalise-e-liquidos-biologicos","Uroanálise e Líquidos Biológicos"],
      ["analises-clinicas","analises-clinicas","citopatologia-e-histopatologia-laboratorial","Citopatologia e Histopatologia Laboratorial"],
      ["analises-clinicas","analises-clinicas","biologia-molecular-aplicada-ao-diagnostico","Biologia Molecular Aplicada ao Diagnóstico"],
      ["analises-clinicas","analises-clinicas","endocrinologia-laboratorial","Endocrinologia Laboratorial"],
      ["analises-clinicas","analises-clinicas","gestao-da-qualidade-no-laboratorio-clinico","Gestão da Qualidade no Laboratório Clínico"],
      ["analises-clinicas","analises-clinicas","instrumentacao-e-automacao-laboratorial","Instrumentação e Automação Laboratorial"],
      ["analises-clinicas","analises-clinicas","toxicologia-analitica-e-forense","Toxicologia Analítica e Forense"],
      ["analises-clinicas","analises-clinicas","genetica-laboratorial-e-citogenetica","Genética Laboratorial e Citogenética"],
      ["economia","economia","introducao-a-economia","Introdução à Economia"],
      ["economia","economia","microeconomia-i","Microeconomia I"],
      ["economia","economia","macroeconomia-i","Macroeconomia I"],
      ["economia","economia","historia-economica-geral","História Económica Geral"],
      ["economia","economia","econometria","Econometria"],
      ["economia","economia","desenvolvimento-economico","Desenvolvimento Económico"],
      ["economia","economia","economia-internacional","Economia Internacional"],
      ["economia","economia","moeda-e-bancos","Moeda e Bancos"],
      ["economia","economia","economia-do-setor-publico","Economia do Setor Público"],
      ["economia","economia","teoria-dos-jogos","Teoria dos Jogos"],
      ["economia","economia","economia-ambiental","Economia Ambiental"],
      ["economia","economia","financas-publicas","Finanças Públicas"],
      ["economia","economia","pensamento-economico","Pensamento Económico"],
      ["economia","economia","economia-industrial","Economia Industrial"],
      ["direito","direito","introducao-ao-estudo-do-direito","Introdução ao Estudo do Direito"],
      ["direito","direito","direito-constitucional","Direito Constitucional"],
      ["direito","direito","direito-civil-parte-geral","Direito Civil (Parte Geral)"],
      ["direito","direito","direito-penal-i","Direito Penal I"],
      ["direito","direito","direito-processual-civil","Direito Processual Civil"],
      ["direito","direito","direito-do-trabalho","Direito do Trabalho"],
      ["direito","direito","direito-administrativo","Direito Administrativo"],
      ["direito","direito","direito-comercial-e-empresarial","Direito Comercial e Empresarial"],
      ["direito","direito","direito-internacional-publico","Direito Internacional Público"],
      ["direito","direito","direito-fiscal-e-tributario","Direito Fiscal e Tributário"],
      ["direito","direito","direitos-humanos","Direitos Humanos"],
      ["direito","direito","filosofia-do-direito","Filosofia do Direito"],
      ["direito","direito","direito-processual-penal","Direito Processual Penal"],
      ["direito","direito","direito-do-ambiente","Direito do Ambiente"],
      ["contabilidade","contabilidade","contabilidade-financeira-i","Contabilidade Financeira I"],
      ["contabilidade","contabilidade","contabilidade-de-gestao","Contabilidade de Gestão"],
      ["contabilidade","contabilidade","auditoria-financeira","Auditoria Financeira"],
      ["contabilidade","contabilidade","contabilidade-avancada","Contabilidade Avançada"],
      ["contabilidade","contabilidade","fiscalidade-portuguesa-internacional","Fiscalidade Portuguesa/Internacional"],
      ["contabilidade","contabilidade","consolidacao-de-contas","Consolidação de Contas"],
      ["contabilidade","contabilidade","sistemas-de-informacao-contabilistica","Sistemas de Informação Contabilística"],
      ["contabilidade","contabilidade","contabilidade-publica","Contabilidade Pública"],
      ["contabilidade","contabilidade","analise-de-demonstracoes-financeiras","Análise de Demonstrações Financeiras"],
      ["contabilidade","contabilidade","etica-e-deontologia-contabilistica","Ética e Deontologia Contabilística"],
      ["contabilidade","contabilidade","contabilidade-de-sociedades","Contabilidade de Sociedades"],
      ["contabilidade","contabilidade","pericia-contabil","Perícia Contábil"],
      ["contabilidade","contabilidade","relato-financeiro","Relato Financeiro"],
      ["contabilidade","contabilidade","contabilidade-orcamental","Contabilidade Orçamental"],
      ["gestao","gestao","principios-de-gestao","Princípios de Gestão"],
      ["gestao","gestao","comportamento-organizacional","Comportamento Organizacional"],
      ["gestao","gestao","gestao-de-recursos-humanos","Gestão de Recursos Humanos"],
      ["gestao","gestao","marketing-estrategico","Marketing Estratégico"],
      ["gestao","gestao","gestao-financeira","Gestão Financeira"],
      ["gestao","gestao","estrategia-empresarial","Estratégia Empresarial"],
      ["gestao","gestao","gestao-de-operacoes-e-logistica","Gestão de Operações e Logística"],
      ["gestao","gestao","empreendedorismo","Empreendedorismo"],
      ["gestao","gestao","negociacao-e-gestao-de-conflitos","Negociação e Gestão de Conflitos"],
      ["gestao","gestao","gestao-de-projetos","Gestão de Projetos"],
      ["gestao","gestao","sistemas-de-apoio-a-decisao","Sistemas de Apoio à Decisão"],
      ["gestao","gestao","gestao-da-qualidade","Gestão da Qualidade"],
      ["gestao","gestao","negocios-internacionais","Negócios Internacionais"],
      ["gestao","gestao","responsabilidade-social-corporativa","Responsabilidade Social Corporativa"],
      ["engenharias","engenharias","calculo-diferencial-e-integral","Cálculo Diferencial e Integral"],
      ["engenharias","engenharias","algebra-linear","Álgebra Linear"],
      ["engenharias","engenharias","fisica-mecanica","Física Mecânica"],
      ["engenharias","engenharias","quimica-geral","Química Geral"],
      ["engenharias","engenharias","geometria-descritiva","Geometria Descritiva"],
      ["engenharias","engenharias","ciencia-e-engenharia-dos-materiais","Ciência e Engenharia dos Materiais"],
      ["engenharias","engenharias","termodinamica-aplicada","Termodinâmica Aplicada"],
      ["engenharias","engenharias","mecanica-dos-fluidos","Mecânica dos Fluidos"],
      ["engenharias","engenharias","resistencia-dos-materiais","Resistência dos Materiais"],
      ["engenharias","engenharias","eletrotecnia-geral","Eletrotecnia Geral"],
      ["engenharias","engenharias","programacao-e-computacao","Programação e Computação"],
      ["engenharias","engenharias","estatistica-e-probabilidades","Estatística e Probabilidades"],
      ["engenharias","engenharias","investigacao-operacional","Investigação Operacional"],
      ["engenharias","engenharias","fenomenos-de-transferencia","Fenómenos de Transferência"],
    ];

    let totalInserted = 0;
    const BATCHES = 4;    // 4 × 20 = 80 questões por disciplina → ~12.400 no total
    const DELAY_MS = 1500; // Claude Haiku é rápido; 1.5s entre chamadas

    for (const [concursoId, categoriaId, slug, nome] of DISC) {
      for (let b = 0; b < BATCHES; b++) {
        let wait = 10000;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const r = await generateQuestions({
              concursoId, categoriaId,
              disciplina: slug,
              disciplinaNome: nome,
              count: 20,
            });
            totalInserted += r.inserted;
            console.log(`[bulk] ${slug} batch${b+1} +${r.inserted} (total: ${totalInserted})`);
            await new Promise((s) => setTimeout(s, DELAY_MS));
            break;
          } catch (e: any) {
            console.error(`[bulk] erro ${slug}:`, e?.message?.slice(0, 80));
            await new Promise((s) => setTimeout(s, wait));
            wait = Math.min(wait * 2, 60_000);
          }
        }
      }
    }
    console.log(`[bulk] CONCLUÍDO. Total inserido: ${totalInserted}`);
  })().catch((e) => console.error("[bulk] erro fatal:", e));
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => console.log(`Passei API listening on :${port}`));

// ---- Geração automática de questões (worker em produção) ---------------
// Com AUTO_GENERATE_TARGET definido (ex: "500"), o servidor lança o script
// de geração em background no arranque. O script é retomável (conta o que já
// existe por disciplina), por isso cada deploy/restart continua onde ficou.
// Sai com código 0 quando todas as disciplinas atingem o alvo; noutros casos
// é relançado após 60s. Remover a env var no Render para desligar.
if (process.env.AUTO_GENERATE_TARGET) {
  const target = String(Number(process.env.AUTO_GENERATE_TARGET) || 500);
  const serverDir = fileURLToPath(new URL("..", import.meta.url));
  const startWorker = () => {
    console.log(`[auto-generate] a lançar geração (alvo ${target}/disciplina)`);
    const child = spawn(process.execPath, ["scripts/generate-interests.mjs", target], {
      cwd: serverDir,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) {
        console.log("[auto-generate] concluído: todas as disciplinas no alvo.");
      } else {
        console.log(`[auto-generate] worker saiu (código ${code}); relança em 60s`);
        setTimeout(startWorker, 60_000);
      }
    });
  };
  // Espera 30s após o arranque para não competir com o boot do serviço.
  setTimeout(startWorker, 30_000);
}
