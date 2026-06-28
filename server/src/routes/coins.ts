import { Router } from "express";
import { pool, one, query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const coinsRouter = Router();

const accessCost = (conc: string) => (conc === "licenciatura-medicina" ? 2000 : 1000);

async function grantAccess(client: any, user: string, conc: string, cat: string) {
  await client.query(
    `insert into category_access (user_id, concurso_id, categoria_id, code, expires_at)
     values ($1,$2,$3,$4, now() + interval '4 months')
     on conflict (user_id, concurso_id, categoria_id)
       do update set expires_at = now() + interval '4 months'`,
    [user, conc, cat, "COIN" + Math.random().toString(36).slice(2, 8)],
  );
}

// Transaction history.
coinsRouter.get("/transactions", requireAuth, async (req: AuthedRequest, res) => {
  const r = await query(
    "select * from coin_transactions where user_id = $1 order by created_at desc limit 100",
    [req.userId],
  );
  res.json(r.rows);
});

// My withdrawal requests.
coinsRouter.get("/withdrawals", requireAuth, async (req: AuthedRequest, res) => {
  const r = await query(
    "select id, moedas, aoa, iban, status, created_at from withdrawal_requests where user_id = $1 order by created_at desc",
    [req.userId],
  );
  res.json(r.rows);
});

// Convert points -> coins (1000 pts = 200 coins).
coinsRouter.post("/convert", requireAuth, async (req: AuthedRequest, res) => {
  const points = Number(req.body?.points);
  if (!Number.isInteger(points) || points < 1000 || points % 1000 !== 0)
    return res.status(400).json({ ok: false, error: "invalid_amount" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const p = (await client.query("select pontos from profiles where id = $1 for update", [req.userId])).rows[0];
    if (!p || p.pontos < points) {
      await client.query("rollback");
      return res.json({ ok: false, error: "insufficient_points" });
    }
    const coins = (points / 1000) * 200;
    await client.query(
      "update profiles set pontos = pontos - $2, moedas = moedas + $3, updated_at = now() where id = $1",
      [req.userId, points, coins],
    );
    await client.query(
      "insert into coin_transactions (user_id, tipo, amount, descricao) values ($1,'convert',$2,$3)",
      [req.userId, coins, `Conversão de ${points} pontos`],
    );
    await client.query("commit");
    res.json({ ok: true, moedas: coins });
  } catch (e) {
    await client.query("rollback");
    res.status(500).json({ ok: false, error: "server_error" });
  } finally {
    client.release();
  }
});

// Gift coins to another user.
coinsRouter.post("/gift", requireAuth, async (req: AuthedRequest, res) => {
  const { to, amount } = req.body || {};
  const amt = Number(amount);
  if (to === req.userId) return res.json({ ok: false, error: "self" });
  if (!Number.isInteger(amt) || amt <= 0) return res.json({ ok: false, error: "invalid_amount" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const target = (await client.query("select nome from profiles where id = $1", [to])).rows[0];
    if (!target) { await client.query("rollback"); return res.json({ ok: false, error: "not_found" }); }
    const me = (await client.query("select moedas from profiles where id = $1 for update", [req.userId])).rows[0];
    if (me.moedas < amt) { await client.query("rollback"); return res.json({ ok: false, error: "insufficient_coins" }); }
    await client.query("update profiles set moedas = moedas - $2, updated_at = now() where id = $1", [req.userId, amt]);
    await client.query("update profiles set moedas = moedas + $2, updated_at = now() where id = $1", [to, amt]);
    await client.query("insert into coin_transactions (user_id, tipo, amount, descricao, meta) values ($1,'gift_sent',$2,$3,$4)", [req.userId, -amt, `Enviado para ${target.nome}`, JSON.stringify({ to })]);
    await client.query("insert into coin_transactions (user_id, tipo, amount, descricao, meta) values ($1,'gift_received',$2,'Recebido de outro utilizador',$3)", [to, amt, JSON.stringify({ from: req.userId })]);
    await client.query("insert into notifications (user_id, title, body) values ($1,'Recebeste moedas! 🪙',$2)", [to, `Um amigo enviou-te ${amt} moedas.`]);
    await client.query("commit");
    res.json({ ok: true });
  } catch { await client.query("rollback"); res.status(500).json({ ok: false, error: "server_error" }); }
  finally { client.release(); }
});

// Buy my own access with coins.
coinsRouter.post("/purchase-access", requireAuth, async (req: AuthedRequest, res) => {
  const { conc, cat } = req.body || {};
  const cost = accessCost(conc);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const me = (await client.query("select moedas from profiles where id = $1 for update", [req.userId])).rows[0];
    if (me.moedas < cost) { await client.query("rollback"); return res.json({ ok: false, error: "insufficient_coins" }); }
    await client.query("update profiles set moedas = moedas - $2, updated_at = now() where id = $1", [req.userId, cost]);
    await grantAccess(client, req.userId!, conc, cat);
    await client.query("insert into coin_transactions (user_id, tipo, amount, descricao, meta) values ($1,'access_purchase',$2,'Acesso desbloqueado com moedas',$3)", [req.userId, -cost, JSON.stringify({ conc, cat })]);
    await client.query("commit");
    res.json({ ok: true });
  } catch { await client.query("rollback"); res.status(500).json({ ok: false, error: "server_error" }); }
  finally { client.release(); }
});

// Gift access to a friend.
coinsRouter.post("/gift-access", requireAuth, async (req: AuthedRequest, res) => {
  const { to, conc, cat } = req.body || {};
  if (to === req.userId) return res.json({ ok: false, error: "self" });
  const cost = accessCost(conc);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const target = (await client.query("select nome from profiles where id = $1", [to])).rows[0];
    if (!target) { await client.query("rollback"); return res.json({ ok: false, error: "not_found" }); }
    const me = (await client.query("select moedas from profiles where id = $1 for update", [req.userId])).rows[0];
    if (me.moedas < cost) { await client.query("rollback"); return res.json({ ok: false, error: "insufficient_coins" }); }
    await client.query("update profiles set moedas = moedas - $2, updated_at = now() where id = $1", [req.userId, cost]);
    await grantAccess(client, to, conc, cat);
    await client.query("insert into coin_transactions (user_id, tipo, amount, descricao, meta) values ($1,'gift_access',$2,$3,$4)", [req.userId, -cost, `Acesso oferecido a ${target.nome}`, JSON.stringify({ to, conc, cat })]);
    await client.query("insert into notifications (user_id, title, body) values ($1,'Ganhaste acesso! 🎁','Um amigo desbloqueou um acesso completo para ti.')", [to]);
    await client.query("commit");
    res.json({ ok: true });
  } catch { await client.query("rollback"); res.status(500).json({ ok: false, error: "server_error" }); }
  finally { client.release(); }
});

// Request a withdrawal (min 2000 coins).
coinsRouter.post("/withdraw", requireAuth, async (req: AuthedRequest, res) => {
  const moedas = Number(req.body?.moedas);
  const iban = (req.body?.iban || "").trim();
  if (!Number.isInteger(moedas) || moedas < 2000) return res.json({ ok: false, error: "min_2000" });
  if (iban.length < 10) return res.json({ ok: false, error: "invalid_iban" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const me = (await client.query("select moedas, email from profiles where id = $1 for update", [req.userId])).rows[0];
    if (me.moedas < moedas) { await client.query("rollback"); return res.json({ ok: false, error: "insufficient_coins" }); }
    await client.query("update profiles set moedas = moedas - $2, iban = $3, updated_at = now() where id = $1", [req.userId, moedas, iban]);
    await client.query("insert into withdrawal_requests (user_id, email, moedas, aoa, iban) values ($1,$2,$3,$3,$4)", [req.userId, me.email, moedas, iban]);
    await client.query("insert into coin_transactions (user_id, tipo, amount, descricao) values ($1,'withdrawal',$2,$3)", [req.userId, -moedas, `Pedido de saque (${moedas} AOA)`]);
    await client.query("commit");
    res.json({ ok: true });
  } catch { await client.query("rollback"); res.status(500).json({ ok: false, error: "server_error" }); }
  finally { client.release(); }
});

// Submit a coin top-up request (proof uploaded separately).
coinsRouter.post("/topup", requireAuth, async (req: AuthedRequest, res) => {
  const { amount_aoa, moedas, comprovativo_url } = req.body || {};
  if (!amount_aoa || !moedas || !comprovativo_url)
    return res.status(400).json({ ok: false, error: "invalid_input" });
  const me = await one<{ email: string }>("select email from profiles where id = $1", [req.userId]);
  await query(
    `insert into coin_topup_requests (user_id, email, amount_aoa, moedas, comprovativo_url)
     values ($1,$2,$3,$4,$5)`,
    [req.userId, me?.email, amount_aoa, moedas, comprovativo_url],
  );
  res.json({ ok: true });
});
