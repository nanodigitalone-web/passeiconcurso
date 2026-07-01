import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
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
// Runs in the background — returns 202 immediately so the caller doesn't time out.
// Target: bring every weak category to ≥300 questions using Gemini.
app.post("/cron/generate-bulk", async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers["x-cron-secret"] !== process.env.CRON_SECRET)
    return res.status(401).json({ error: "unauthorized" });
  if (!process.env.GEMINI_API_KEY)
    return res.status(501).json({ error: "GEMINI_API_KEY not set" });

  res.json({ ok: true, message: "Geração iniciada em background" });

  // Runs entirely in the background after responding.
  (async () => {
    const { generateQuestions } = await import("./lib/generateQuestions.js");
    const targets: Array<{ concursoId: string; categoriaId: string; disciplinas: string[] }> = [
      { concursoId: "minsa", categoriaId: "psicologia",
        disciplinas: ["Psicologia da Saúde", "Avaliação Psicológica", "Psicopatologia", "Ética em Psicologia", "Psicologia Clínica"] },
      { concursoId: "uan", categoriaId: "medicina",
        disciplinas: ["Língua Portuguesa", "Matemática", "Química", "Biologia", "Física"] },
      { concursoId: "minsa", categoriaId: "cardiopneumologia",
        disciplinas: ["Hipertensão Pulmonar", "Vascular", "Função Pulmonar", "ECG", "Cardiologia Clínica"] },
      { concursoId: "minsa", categoriaId: "farmaceutico",
        disciplinas: ["Farmacovigilância", "Farmacodinâmica", "Antibioterapia", "Vias de Administração",
                      "Farmacocinética", "Legislação", "Farmacotécnica", "Farmacologia", "Farmácia Hospitalar"] },
      { concursoId: "minsa", categoriaId: "fisioterapeuta",
        disciplinas: ["Amputados", "Órteses", "Reabilitação Ortopédica", "Reabilitação cardio-respiratória",
                      "Reabilitação Neuro", "Reabilitação Cardio", "Reabilitação Respiratória", "Cinesiologia", "Avaliação"] },
      { concursoId: "minsa", categoriaId: "laboratorio",
        disciplinas: ["Qualidade", "Biossegurança", "Urinálise", "Imunologia",
                      "Parasitologia", "Imunohematologia", "Microbiologia", "Hematologia", "Bioquímica"] },
      { concursoId: "minsa", categoriaId: "tec-enfermagem",
        disciplinas: ["Farmacologia básica", "Sinais Vitais", "Medicamentos", "Procedimentos Básicos",
                      "Ética", "Farmacologia", "Emergências", "Saúde Pública"] },
      { concursoId: "licenciatura-medicina", categoriaId: "gineco-obstetricia",
        disciplinas: ["Trabalho de Parto e Puerpério", "Ginecologia Geral",
                      "Ciclo Menstrual e Endocrinologia Reprodutiva", "Assistência Pré-Natal", "Urgências Obstétricas"] },
      { concursoId: "minsa", categoriaId: "enfermeiro",
        disciplinas: ["Anatomia", "Fisiologia", "Farmacologia", "Saúde Pública", "Ética", "Emergências", "Pediatria"] },
      { concursoId: "minsa", categoriaId: "medico",
        disciplinas: ["Clínica Geral", "Cirurgia", "Saúde Pública", "Pediatria", "Farmacologia", "Ética Médica"] },
    ];

    let totalInserted = 0;
    const BATCHES = 4;   // 4 × 20 = 80 questões por disciplina
    const DELAY_MS = 4500; // 4.5s entre chamadas → fica abaixo dos 15 RPM

    for (const { concursoId, categoriaId, disciplinas } of targets) {
      for (const disciplina of disciplinas) {
        for (let b = 0; b < BATCHES; b++) {
          let wait = 15000;
          for (let attempt = 0; attempt < 6; attempt++) {
            try {
              const r = await generateQuestions({ concursoId, categoriaId, disciplina, count: 20 });
              totalInserted += r.inserted;
              console.log(`[bulk] ${concursoId}/${categoriaId}/${disciplina} +${r.inserted} (total: ${totalInserted})`);
              await new Promise((s) => setTimeout(s, DELAY_MS));
              break;
            } catch (e: any) {
              if (e?.message?.includes("429") || e?.message?.includes("gemini_429")) {
                console.log(`[bulk] rate-limit, aguardar ${wait / 1000}s...`);
                await new Promise((s) => setTimeout(s, wait));
                wait = Math.min(wait * 2, 300_000);
              } else {
                console.error(`[bulk] erro ${disciplina}:`, e?.message);
                break;
              }
            }
          }
        }
      }
    }
    console.log(`[bulk] Concluído. Total inserido: ${totalInserted}`);
  })().catch((e) => console.error("[bulk] erro fatal:", e));
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => console.log(`Passei API listening on :${port}`));
