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

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => console.log(`Passei API listening on :${port}`));
