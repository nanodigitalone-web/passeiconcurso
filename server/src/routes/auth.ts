import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { one, query } from "../lib/db.js";
import {
  signToken,
  requireAuth,
  isAdmin,
  maybeGrantAdmin,
  type AuthedRequest,
} from "../lib/auth.js";

export const authRouter = Router();

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const genFriendCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

async function ensureProfile(userId: string, email: string, nome?: string) {
  await query(
    `insert into profiles (id, nome, email, friend_code)
     values ($1, $2, $3, $4)
     on conflict (id) do nothing`,
    [userId, nome || email.split("@")[0] || "Candidato", email, genFriendCode()],
  );
}

async function profilePayload(userId: string) {
  const profile = await one("select * from profiles where id = $1", [userId]);
  const admin = await isAdmin(userId);
  return { profile, isAdmin: admin };
}

// Reward the inviter with 100 points when a NEW user signs up with their code.
// Granted exactly once (referred_by is set-once); never breaks signup on error.
async function applyReferral(newUserId: string, inviteCode?: string) {
  if (!inviteCode) return;
  try {
    const ref = await one<{ id: string }>(
      "select id from profiles where friend_code = $1",
      [String(inviteCode).trim().toUpperCase()],
    );
    if (!ref || ref.id === newUserId) return;
    const r = await query(
      "update profiles set referred_by = $2 where id = $1 and referred_by is null",
      [newUserId, ref.id],
    );
    if (r.rowCount === 0) return; // already referred — no double reward
    await query(
      "update profiles set pontos = pontos + 100, pontos_globais = pontos_globais + 100, updated_at = now() where id = $1",
      [ref.id],
    );
    await query("insert into points_log (user_id, delta) values ($1, 100)", [ref.id]);
    await query(
      "insert into notifications (user_id, title, body) values ($1, 'Convite aceite! 🎉', 'Um amigo entrou com o teu convite. Ganhaste 100 pontos!')",
      [ref.id],
    );
  } catch {
    /* referral is best-effort; never block signup */
  }
}

// ---- Register --------------------------------------------------------
authRouter.post("/register", async (req, res) => {
  const { email, password, nome, inviteCode } = req.body || {};
  if (!email || !password || password.length < 6)
    return res.status(400).json({ error: "invalid_input" });

  const exists = await one("select id from users where email = $1", [
    email.toLowerCase(),
  ]);
  if (exists) return res.status(409).json({ error: "email_taken" });

  const hash = await bcrypt.hash(password, 10);
  const u = await one<{ id: string }>(
    "insert into users (email, password_hash) values ($1,$2) returning id",
    [email.toLowerCase(), hash],
  );
  await ensureProfile(u!.id, email.toLowerCase(), nome);
  await maybeGrantAdmin(u!.id, email);
  await applyReferral(u!.id, inviteCode);

  const token = signToken(u!.id);
  res.json({ token, ...(await profilePayload(u!.id)) });
});

// ---- Login -----------------------------------------------------------
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "invalid_input" });

  const u = await one<{ id: string; password_hash: string; email: string }>(
    "select id, password_hash, email from users where email = $1",
    [email.toLowerCase()],
  );
  if (!u || !u.password_hash) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  await ensureProfile(u.id, u.email);
  await maybeGrantAdmin(u.id, u.email);

  const token = signToken(u.id);
  res.json({ token, ...(await profilePayload(u.id)) });
});

// ---- Google OAuth ----------------------------------------------------
authRouter.post("/google", async (req, res) => {
  if (!googleClient)
    return res.status(501).json({ error: "google_not_configured" });
  const { idToken, inviteCode } = req.body || {};
  if (!idToken) return res.status(400).json({ error: "missing_token" });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "invalid_google_token" });
  }
  if (!payload?.email) return res.status(401).json({ error: "no_email" });

  const email = payload.email.toLowerCase();
  let u = await one<{ id: string }>("select id from users where email = $1", [email]);
  let isNew = false;
  if (!u) {
    u = await one<{ id: string }>(
      "insert into users (email, google_id) values ($1,$2) returning id",
      [email, payload.sub],
    );
    await ensureProfile(u!.id, email, payload.name);
    isNew = true;
  } else {
    await query("update users set google_id = $2 where id = $1 and google_id is null", [
      u.id,
      payload.sub,
    ]);
    await ensureProfile(u.id, email, payload.name);
  }
  await maybeGrantAdmin(u!.id, email);
  if (isNew) await applyReferral(u!.id, inviteCode);

  const token = signToken(u!.id);
  res.json({ token, ...(await profilePayload(u!.id)) });
});

// ---- Current user ----------------------------------------------------
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  res.json(await profilePayload(req.userId!));
});
