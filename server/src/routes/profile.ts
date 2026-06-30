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

// Public-ish: a single profile by id (used for friend/opponent display).
profileRouter.get("/:id", requireAuth, async (req, res) => {
  const p = await one("select * from profiles where id = $1", [req.params.id]);
  res.json(p);
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
