import { Router } from "express";
import { one, query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const profileRouter = Router();

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
]);

// ---- "Aprender" lives ------------------------------------------------
// 5 lives max; 1 recharges every 3 hours. Time-based so it can't be cheated
// client-side and survives across devices. Defined BEFORE "/:id" so the path
// "/lives" isn't swallowed by the id route.
const MAX_VIDAS = 5;
const RECHARGE_MS = 3 * 60 * 60 * 1000;

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

// Public-ish: a single profile by id (used for friend/opponent display).
// Guard against non-uuid ids so a bad path can never crash the query.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
profileRouter.get("/:id", requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: "not_found" });
  try {
    const p = await one("select * from profiles where id = $1", [req.params.id]);
    res.json(p);
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// Update own profile.
profileRouter.patch("/", requireAuth, async (req: AuthedRequest, res) => {
  const patch = req.body || {};
  const keys = Object.keys(patch).filter((k) => SELF_EDITABLE.has(k));
  if (keys.length === 0) return res.json({ ok: true });

  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map((k) => patch[k]);
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
