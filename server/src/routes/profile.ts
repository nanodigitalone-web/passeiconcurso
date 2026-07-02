import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { one, query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { computeStreak } from "../lib/streak.js";
// @ts-ignore - resolved at runtime by tsx
import { ALL_DISCIPLINAS } from "../../../src/data/disciplinas.ts";

export const profileRouter = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const useCloudinary = !!process.env.CLOUDINARY_URL;
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

// Upload/replace the user's profile photo. Stores on Cloudinary (overwriting
// the previous one via a stable public_id) or disk in dev, and persists the
// resulting URL straight onto the profile.
profileRouter.post(
  "/avatar",
  requireAuth,
  avatarUpload.single("file"),
  async (req: AuthedRequest, res) => {
    if (!req.file) return res.status(400).json({ error: "no_file" });

    if (useCloudinary) {
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "passei/avatars", public_id: req.userId, overwrite: true, resource_type: "image" },
            (err, r) => (err ? reject(err) : resolve(r)),
          );
          stream.end(req.file!.buffer);
        });
        await query("update profiles set avatar_url = $2, updated_at = now() where id = $1", [
          req.userId,
          result.secure_url,
        ]);
        return res.json({ url: result.secure_url });
      } catch {
        return res.status(500).json({ error: "upload_failed" });
      }
    }

    const dir = path.join(UPLOAD_DIR, "avatars");
    fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = `${req.userId}${ext}`;
    fs.writeFileSync(path.join(dir, filename), req.file.buffer);
    const url = `/uploads/avatars/${filename}?t=${Date.now()}`;
    await query("update profiles set avatar_url = $2, updated_at = now() where id = $1", [req.userId, url]);
    res.json({ url });
  },
);

// Columns a user may edit on their own profile (mirrors the old RLS trigger:
// pontos, streak, blocked, hidden, email, moedas are NOT self-editable).
const SELF_EDITABLE = new Set([
  "nome",
  "avatar_url",
  "bio",
  "concurso_id",
  "categoria_id",
  "categoria_nome",
  "iban",
  "last_seen",
  "universidade",
  "curso",
  "ano",
  "interesses",
  "interesses_ativo",
]);

// ---- "Aprender" lives ------------------------------------------------
// 5 lives max; 1 recharges every 3 hours. Time-based so it can't be cheated
// client-side and survives across devices. Defined BEFORE "/:id" so the path
// "/lives" isn't swallowed by the id route.
const MAX_VIDAS = 5;
const RECHARGE_MS = 15 * 60 * 1000; // 15 minutos por vida

function recharge(vidas: number, updatedAt: Date | string) {
  const base = new Date(updatedAt).getTime();
  if (vidas >= MAX_VIDAS) return { vidas: MAX_VIDAS, updatedAt: new Date(base) };
  const gained = Math.floor((Date.now() - base) / RECHARGE_MS);
  if (gained <= 0) return { vidas, updatedAt: new Date(base) };
  const nv = Math.min(MAX_VIDAS, vidas + gained);
  const nu = nv >= MAX_VIDAS ? new Date() : new Date(base + gained * RECHARGE_MS);
  return { vidas: nv, updatedAt: nu };
}

const livesState = (vidas: number, updatedAt: Date) => ({
  vidas,
  max: MAX_VIDAS,
  nextInMs:
    vidas >= MAX_VIDAS ? 0 : Math.max(0, RECHARGE_MS - (Date.now() - updatedAt.getTime())),
});

// Current lives (recharge applied + persisted).
profileRouter.get("/lives", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const p = await one<{ vidas: number; vidas_updated_at: Date }>(
      "select vidas, vidas_updated_at from profiles where id = $1",
      [req.userId],
    );
    if (!p) return res.status(404).json({ error: "not_found" });
    const r = recharge(p.vidas, p.vidas_updated_at);
    if (r.vidas !== p.vidas) {
      await query("update profiles set vidas = $2, vidas_updated_at = $3 where id = $1", [
        req.userId,
        r.vidas,
        r.updatedAt,
      ]);
    }
    res.json(livesState(r.vidas, r.updatedAt));
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// Consume one life (on a wrong answer in Aprender).
profileRouter.post("/lives/lose", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const p = await one<{ vidas: number; vidas_updated_at: Date }>(
      "select vidas, vidas_updated_at from profiles where id = $1",
      [req.userId],
    );
    if (!p) return res.status(404).json({ error: "not_found" });
    const r = recharge(p.vidas, p.vidas_updated_at);
    if (r.vidas <= 0) return res.json(livesState(0, r.updatedAt));
    const wasFull = r.vidas >= MAX_VIDAS;
    const nv = r.vidas - 1;
    const nu = wasFull ? new Date() : r.updatedAt; // start the clock when leaving full
    await query("update profiles set vidas = $2, vidas_updated_at = $3 where id = $1", [
      req.userId,
      nv,
      nu,
    ]);
    res.json(livesState(nv, nu));
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ---- Dashboard: aggregated stats for the Percurso page ----------------------
// GET /profile/dashboard?period=week|month
profileRouter.get("/dashboard", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const isMonth = req.query.period === "month";
    const days = isMonth ? 30 : 7;

    const [dailyR, discR, ptsR, battlesR, profileR, streak] = await Promise.all([
      // Per-day question stats
      query(
        `select (answered_at at time zone 'Africa/Luanda')::date as day,
                count(*)::int as total,
                count(*) filter (where correct)::int as correct
           from question_attempts
          where user_id = $1
            and answered_at >= now() - ($2 || ' days')::interval
          group by 1 order by 1`,
        [req.userId, days],
      ),
      // Discipline breakdown (top 10 by volume)
      query(
        `select coalesce(disciplina,'—') as disciplina,
                count(*)::int as total,
                count(*) filter (where correct)::int as correct
           from question_attempts
          where user_id = $1
            and answered_at >= now() - ($2 || ' days')::interval
          group by 1 order by count(*) desc limit 10`,
        [req.userId, days],
      ),
      // Points earned in period
      one<{ pts: number }>(
        `select coalesce(sum(delta),0)::int as pts
           from points_log
          where user_id = $1 and created_at >= now() - ($2 || ' days')::interval`,
        [req.userId, days],
      ),
      // Battles in period
      one<{ total: number; wins: number }>(
        `select count(*)::int as total,
                count(*) filter (where winner_id = $1)::int as wins
           from battles
          where (challenger_id = $1 or opponent_id = $1)
            and status = 'finished'
            and created_at >= now() - ($2 || ' days')::interval`,
        [req.userId, days],
      ),
      // Profile basics
      one<{ nome: string; pontos_globais: number; categoria_nome: string | null }>(
        `select nome, pontos_globais, categoria_nome from profiles where id = $1`,
        [req.userId],
      ),
      // Streak (freeze-aware, shared with POST /content/attempts)
      computeStreak(req.userId!),
    ]);

    const totalQ = dailyR.rows.reduce((s: number, r: any) => s + r.total, 0);
    const correctQ = dailyR.rows.reduce((s: number, r: any) => s + r.correct, 0);

    res.json({
      period: isMonth ? "month" : "week",
      days,
      profile: profileR || {},
      summary: {
        total: totalQ,
        correct: correctQ,
        wrong: totalQ - correctQ,
        accuracy: totalQ ? Math.round((correctQ / totalQ) * 100) : 0,
        points_earned: ptsR?.pts ?? 0,
        streak,
      },
      daily: dailyR.rows,
      disciplines: discR.rows,
      battles: {
        total: battlesR?.total ?? 0,
        wins: battlesR?.wins ?? 0,
        losses: (battlesR?.total ?? 0) - (battlesR?.wins ?? 0),
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// ---- Diagnóstico de prontidão ----------------------------------------
// Per-discipline readiness: blends recent accuracy (what you get right) with
// coverage (how much of the bank you've mastered) into a 0–100 score. Only
// disciplines with ≥5 attempts are scored — below that there's no signal.
profileRouter.get("/readiness", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const [statsR, masteredR, bankR] = await Promise.all([
      query(
        `select disciplina,
                count(*)::int as total,
                count(*) filter (where correct)::int as correct,
                count(*) filter (where answered_at >= now() - '30 days'::interval)::int as total30,
                count(*) filter (where correct and answered_at >= now() - '30 days'::interval)::int as correct30
           from question_attempts
          where user_id = $1 and disciplina is not null
          group by disciplina
         having count(*) >= 5`,
        [req.userId],
      ),
      // Distinct questions whose LAST attempt was correct (mastered).
      query(
        `select disciplina, count(*)::int as mastered from (
           select distinct on (question_id) disciplina, correct
             from question_attempts
            where user_id = $1 and disciplina is not null
            order by question_id, answered_at desc
         ) t where correct group by disciplina`,
        [req.userId],
      ),
      query(
        `select disciplina, count(*)::int as n
           from questions where active and disciplina is not null
          group by disciplina`,
      ),
    ]);

    const mastered = new Map<string, number>();
    for (const r of masteredR.rows) mastered.set(r.disciplina, r.mastered);
    const bank = new Map<string, number>();
    for (const r of bankR.rows) bank.set(r.disciplina, r.n);

    const displayName = (d: string) =>
      (ALL_DISCIPLINAS as any[]).find((x: any) => x.id === d)?.nome || d;

    const disciplines = statsR.rows.map((r: any) => {
      const accAll = r.total > 0 ? r.correct / r.total : 0;
      const acc30 = r.total30 > 0 ? r.correct30 / r.total30 : accAll;
      const accuracy = 0.7 * acc30 + 0.3 * accAll;
      const bankN = bank.get(r.disciplina) ?? 0;
      // Coverage target caps at 100 questions so big banks stay reachable.
      const target = Math.max(1, Math.min(bankN || r.total, 100));
      const coverage = Math.min(1, (mastered.get(r.disciplina) ?? 0) / target);
      const readiness = Math.round(100 * (0.65 * accuracy + 0.35 * coverage));
      return {
        disciplina: r.disciplina,
        nome: displayName(r.disciplina),
        total: r.total,
        accuracy: Math.round(accuracy * 100),
        mastered: mastered.get(r.disciplina) ?? 0,
        bank: bankN,
        coverage: Math.round(coverage * 100),
        readiness,
      };
    });
    disciplines.sort((a: any, b: any) => a.readiness - b.readiness);

    const totalAttempts = disciplines.reduce((s: number, d: any) => s + d.total, 0);
    const overallScore = totalAttempts
      ? Math.round(disciplines.reduce((s: number, d: any) => s + d.readiness * d.total, 0) / totalAttempts)
      : 0;
    const overallAccuracy = totalAttempts
      ? Math.round(disciplines.reduce((s: number, d: any) => s + d.accuracy * d.total, 0) / totalAttempts)
      : 0;

    res.json({
      overall: {
        score: overallScore,
        accuracy: overallAccuracy,
        attempted: totalAttempts,
        mastered: disciplines.reduce((s: number, d: any) => s + d.mastered, 0),
        disciplines: disciplines.length,
      },
      disciplines,
    });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// ---- Streak freeze -----------------------------------------------------
// Buy one freeze for 300 PONTOS (spendable balance; hold at most 2). Only
// `pontos` drops — `pontos_globais` (ranking) never goes down. A freeze
// auto-bridges a missed day so the streak survives (see lib/streak.ts).
const FREEZE_COST = 300;
const FREEZE_MAX = 2;
profileRouter.post("/streak-freeze/buy", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const p = await one<{ pontos: number; streak_freezes: number }>(
      "select pontos, streak_freezes from profiles where id = $1 for update",
      [req.userId],
    );
    if (!p) return res.status(404).json({ error: "not_found" });
    if (p.streak_freezes >= FREEZE_MAX)
      return res.status(400).json({ error: "max_freezes" });
    if (p.pontos < FREEZE_COST)
      return res.status(400).json({ error: "insufficient_points" });
    await query(
      "update profiles set pontos = pontos - $2, streak_freezes = streak_freezes + 1, updated_at = now() where id = $1",
      [req.userId, FREEZE_COST],
    );
    res.json({ ok: true, streak_freezes: p.streak_freezes + 1, cost: FREEZE_COST });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// Public-ish: a single profile by id (used for friend/opponent display).
// Guard against non-uuid ids so a bad path can never crash the query.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
profileRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: "not_found" });
  try {
    const p = await one(
      `select p.*,
        (select count(*) from follows where following_id = p.id)::int as followers_count,
        (select count(*) from follows where follower_id = p.id)::int  as following_count,
        exists(select 1 from follows where follower_id = $2 and following_id = p.id) as is_following,
        (select us.plan_id from user_subscriptions us
          where us.user_id = p.id and us.status = 'active'
            and (us.expires_at is null or us.expires_at > now()) limit 1) as plan_id,
        (select floor(count(*) / 300) + 1 from question_attempts qa
          where qa.user_id = p.id and qa.mode = 'aprender')::int as level
       from profiles p where p.id = $1`,
      [req.params.id, req.userId],
    );
    if (!p) return res.status(404).json({ error: "not_found" });
    res.json(p);
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// List followers of a user.
profileRouter.get("/:id/followers", requireAuth, async (req: AuthedRequest, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: "not_found" });
  try {
    const rows = await query(
      `select p.id, p.nome, p.avatar_url, p.pontos_globais,
              (select us.plan_id from user_subscriptions us
                where us.user_id = p.id and us.status = 'active'
                  and (us.expires_at is null or us.expires_at > now()) limit 1) as plan_id
         from follows f join profiles p on p.id = f.follower_id
        where f.following_id = $1 order by p.pontos_globais desc limit 100`,
      [req.params.id],
    );
    res.json(rows.rows);
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// List users that a user follows.
profileRouter.get("/:id/following", requireAuth, async (req: AuthedRequest, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: "not_found" });
  try {
    const rows = await query(
      `select p.id, p.nome, p.avatar_url, p.pontos_globais,
              (select us.plan_id from user_subscriptions us
                where us.user_id = p.id and us.status = 'active'
                  and (us.expires_at is null or us.expires_at > now()) limit 1) as plan_id
         from follows f join profiles p on p.id = f.following_id
        where f.follower_id = $1 order by p.pontos_globais desc limit 100`,
      [req.params.id],
    );
    res.json(rows.rows);
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// Follow a user.
profileRouter.post("/:id/follow", requireAuth, async (req: AuthedRequest, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: "not_found" });
  if (req.params.id === req.userId) return res.status(400).json({ error: "cannot_follow_self" });
  try {
    await query(
      "insert into follows (follower_id, following_id) values ($1, $2) on conflict do nothing",
      [req.userId, req.params.id],
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// Unfollow a user.
profileRouter.delete("/:id/follow", requireAuth, async (req: AuthedRequest, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: "not_found" });
  try {
    await query(
      "delete from follows where follower_id = $1 and following_id = $2",
      [req.userId, req.params.id],
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// Purchase an interests tier (deducts moedas).
// tier: 10 = Básico (1000 moedas), 30 = Pro (2000 moedas).
profileRouter.post("/interests-tier", requireAuth, async (req: AuthedRequest, res) => {
  const tier = Number(req.body?.tier);
  if (tier !== 10 && tier !== 30) return res.status(400).json({ error: "invalid_tier" });
  const cost = tier === 10 ? 1000 : 2000;
  try {
    const p = await one<{ moedas: number; interesses_max: number }>(
      "select moedas, interesses_max from profiles where id = $1 for update",
      [req.userId],
    );
    if (!p) return res.status(404).json({ error: "not_found" });
    if (p.interesses_max >= tier) return res.json({ ok: true, interesses_max: p.interesses_max });
    if (p.moedas < cost) return res.status(400).json({ error: "insufficient_coins" });
    await query(
      "update profiles set moedas = moedas - $2, interesses_max = $3, updated_at = now() where id = $1",
      [req.userId, cost, tier],
    );
    await query(
      "insert into coin_transactions (user_id, tipo, amount, descricao) values ($1,'interests_tier',$2,$3)",
      [req.userId, -cost, tier === 10 ? "Plano Interesses Básico (10)" : "Plano Interesses Pro (30)"],
    );
    const updated = await one("select * from profiles where id = $1", [req.userId]);
    res.json({ ok: true, interesses_max: tier, profile: updated });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// Update own profile.
profileRouter.patch("/", requireAuth, async (req: AuthedRequest, res) => {
  const patch = req.body || {};
  const keys = Object.keys(patch).filter((k) => SELF_EDITABLE.has(k));
  if (keys.length === 0) return res.json({ ok: true });

  const sets = keys.map((k, i) => (k === "interesses" ? `${k} = $${i + 2}::jsonb` : `${k} = $${i + 2}`));
  const values = keys.map((k) => (k === "interesses" ? JSON.stringify(patch[k] ?? []) : patch[k]));
  await query(
    `update profiles set ${sets.join(", ")}, updated_at = now() where id = $1`,
    [req.userId, ...values],
  );
  const p = await one("select * from profiles where id = $1", [req.userId]);
  res.json(p);
});

// Add points (validated, like the old add_points RPC).
profileRouter.post("/points", requireAuth, async (req: AuthedRequest, res) => {
  const delta = Number(req.body?.delta);
  if (!Number.isFinite(delta) || delta < 0 || delta > 100)
    return res.status(400).json({ error: "invalid_delta" });
  // Earn → grow BOTH the spendable balance and the lifetime total (ranking).
  await query(
    "update profiles set pontos = pontos + $2, pontos_globais = pontos_globais + $2, updated_at = now() where id = $1",
    [req.userId, delta],
  );
  await query("insert into points_log (user_id, delta) values ($1,$2)", [
    req.userId,
    delta,
  ]);
  res.json({ ok: true });
});

// Heartbeat (last_seen).
profileRouter.post("/heartbeat", requireAuth, async (req: AuthedRequest, res) => {
  await query("update profiles set last_seen = now() where id = $1", [req.userId]);
  res.json({ ok: true });
});

// Paid "hide account" — costs 500 coins.
profileRouter.post("/hide", requireAuth, async (req: AuthedRequest, res) => {
  const hide = req.body?.hidden !== false;
  if (!hide) {
    await query("update profiles set hidden = false where id = $1", [req.userId]);
    return res.json({ ok: true });
  }
  const p = await one<{ moedas: number; hidden: boolean }>(
    "select moedas, hidden from profiles where id = $1 for update",
    [req.userId],
  );
  if (p?.hidden) return res.json({ ok: true });
  if ((p?.moedas ?? 0) < 500)
    return res.status(400).json({ error: "insufficient_coins" });
  await query(
    "update profiles set moedas = moedas - 500, hidden = true, updated_at = now() where id = $1",
    [req.userId],
  );
  await query(
    "insert into coin_transactions (user_id, tipo, amount, descricao) values ($1,'hide_account',-500,'Ocultar conta')",
    [req.userId],
  );
  res.json({ ok: true });
});
