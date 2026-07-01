import { Router } from "express";
import { one, pool, query } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";
import { generateQuestions, aiEnabled } from "../lib/generateQuestions.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

// ---- AI question generation (Claude Haiku) ----
// Drafts MCQs for a disciplina, validates + dedups, and inserts them
// (source='ai', auto-published). Requires ANTHROPIC_API_KEY on the server.
adminRouter.post("/questions/generate", async (req, res) => {
  if (!aiEnabled()) return res.status(501).json({ error: "anthropic_not_configured" });
  const { concursoId, categoriaId, disciplina, count } = req.body || {};
  if (!concursoId || !categoriaId || !disciplina)
    return res.status(400).json({ error: "missing_params" });
  try {
    const result = await generateQuestions({
      concursoId,
      categoriaId,
      disciplina,
      count: Number(count) || 5,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "generation_failed" });
  }
});

const genCode = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");

// ---- Stats ----
adminRouter.get("/stats", async (_req, res) => {
  const q = async (sql: string, p?: any[]) => Number((await one<{ c: string }>(sql, p))?.c ?? 0);
  res.json({
    users: await q("select count(*)::int c from profiles"),
    blocked: await q("select count(*)::int c from profiles where blocked = true"),
    hidden: await q("select count(*)::int c from profiles where hidden = true"),
    paid: await q("select count(*)::int c from category_access"),
    codesUsed: await q("select count(*)::int c from access_codes where status='used'"),
    codesAvail: await q("select count(*)::int c from access_codes where status='available'"),
    payments: await q("select count(*)::int c from payment_requests where status='pending' or status='awaiting_review'"),
  });
});

// ---- Question bank stats (real counts from the DB, incl. AI-generated) ----
adminRouter.get("/questions-stats", async (_req, res) => {
  try {
    const total = Number((await one<{ n: string }>("select count(*)::int n from questions"))?.n ?? 0);
    const bySource = (
      await query("select source, count(*)::int n from questions group by source")
    ).rows;
    const byCat = (
      await query(
        `select concurso_id, categoria_id, count(*)::int n
           from questions where active group by 1,2 order by 3 desc`,
      )
    ).rows;
    res.json({ total, bySource, byCat });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

// ---- Users ----
adminRouter.get("/profiles", async (req, res) => {
  const limit = Number(req.query.limit) || 500;
  const r = await query("select * from profiles order by last_seen desc nulls last limit $1", [limit]);
  res.json(r.rows);
});

adminRouter.patch("/profiles/:id", async (req, res) => {
  const allowed = ["nome", "blocked", "hidden", "pontos", "moedas", "streak", "categoria_nome", "categoria_id", "concurso_id", "iban", "bio"];
  const keys = Object.keys(req.body || {}).filter((k) => allowed.includes(k));
  if (keys.length === 0) return res.json({ ok: true });
  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  await query(`update profiles set ${sets.join(", ")}, updated_at = now() where id = $1`, [
    req.params.id,
    ...keys.map((k) => req.body[k]),
  ]);
  res.json({ ok: true });
});

adminRouter.delete("/profiles/:id", async (req, res) => {
  await query("delete from users where id = $1", [req.params.id]);
  res.json({ ok: true });
});

// ---- Access ----
adminRouter.get("/access", async (req, res) => {
  const r = await query("select * from category_access limit $1", [Number(req.query.limit) || 2000]);
  res.json(r.rows);
});

adminRouter.post("/access/grant", async (req, res) => {
  const { userId, concursoId, categoriaId, months } = req.body || {};
  const code = genCode();
  await query(
    `insert into access_codes (concurso_id, categoria_id, code, status, used_by, used_at)
     values ($1,$2,$3,'used',$4,now()) on conflict do nothing`,
    [concursoId, categoriaId, code, userId],
  );
  const expires = months ? `now() + interval '${Number(months)} months'` : `now() + interval '4 months'`;
  await query(
    `insert into category_access (user_id, concurso_id, categoria_id, code, expires_at)
     values ($1,$2,$3,$4, ${expires})
     on conflict (user_id, concurso_id, categoria_id) do update set expires_at = ${expires}`,
    [userId, concursoId, categoriaId, code],
  );
  res.json({ code });
});

adminRouter.delete("/access/:id", async (req, res) => {
  await query("delete from category_access where id = $1", [req.params.id]);
  res.json({ ok: true });
});

// ---- Codes ----
adminRouter.get("/codes/stats", async (req, res) => {
  const { conc, cat } = req.query as any;
  const a = await one<{ c: string }>("select count(*)::int c from access_codes where concurso_id=$1 and categoria_id=$2 and status='available'", [conc, cat]);
  const u = await one<{ c: string }>("select count(*)::int c from access_codes where concurso_id=$1 and categoria_id=$2 and status='used'", [conc, cat]);
  res.json({ available: Number(a?.c ?? 0), used: Number(u?.c ?? 0) });
});

adminRouter.get("/codes/list", async (req, res) => {
  const { conc, cat, status } = req.query as any;
  const r = await query(
    "select code, status, used_at, used_by from access_codes where concurso_id=$1 and categoria_id=$2 and status=$3 order by created_at desc limit 300",
    [conc, cat, status],
  );
  res.json(r.rows);
});

adminRouter.post("/codes/generate", async (req, res) => {
  const { conc, cat, count } = req.body || {};
  const client = await pool.connect();
  let created = 0;
  try {
    for (let i = 0; i < count * 5 && created < count; i++) {
      try {
        await client.query("insert into access_codes (concurso_id, categoria_id, code) values ($1,$2,$3)", [conc, cat, genCode()]);
        created++;
      } catch { /* duplicate, retry */ }
    }
  } finally {
    client.release();
  }
  res.json({ created });
});

// ---- Notifications ----
adminRouter.get("/notifications", async (_req, res) => {
  const r = await query("select * from notifications order by created_at desc limit 20");
  res.json(r.rows);
});

adminRouter.post("/notifications/broadcast", async (req: any, res) => {
  const { title, body, userId } = req.body || {};
  await query("insert into notifications (user_id, title, body, created_by) values ($1,$2,$3,$4)", [
    userId || null,
    title,
    body,
    req.userId,
  ]);
  res.json({ ok: true });
});

// ---- Coin top-ups ----
adminRouter.get("/topups", async (_req, res) => {
  const r = await query("select * from coin_topup_requests order by created_at desc limit 200");
  res.json(r.rows);
});

adminRouter.post("/topups/:id/approve", async (req, res) => {
  const t = await one<any>("select * from coin_topup_requests where id = $1", [req.params.id]);
  if (!t) return res.status(404).json({ error: "not_found" });
  if (t.status === "approved") return res.json({ ok: true });
  await query("update profiles set moedas = moedas + $2, updated_at = now() where id = $1", [t.user_id, t.moedas]);
  await query("insert into coin_transactions (user_id, tipo, amount, descricao) values ($1,'topup',$2,'Carregamento aprovado')", [t.user_id, t.moedas]);
  await query("update coin_topup_requests set status='approved', updated_at=now() where id=$1", [t.id]);
  res.json({ ok: true });
});

adminRouter.post("/topups/:id/reject", async (req, res) => {
  await query("update coin_topup_requests set status='rejected', updated_at=now() where id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ---- Withdrawals ----
adminRouter.get("/withdrawals", async (_req, res) => {
  const r = await query("select * from withdrawal_requests order by created_at desc limit 200");
  res.json(r.rows);
});

adminRouter.post("/withdrawals/:id/paid", async (req, res) => {
  await query("update withdrawal_requests set status='paid', updated_at=now() where id=$1", [req.params.id]);
  res.json({ ok: true });
});

adminRouter.post("/withdrawals/:id/reject", async (req, res) => {
  const w = await one<any>("select * from withdrawal_requests where id = $1", [req.params.id]);
  if (!w || w.status !== "pending") return res.json({ ok: true });
  // Refund the coins.
  await query("update profiles set moedas = moedas + $2, updated_at = now() where id = $1", [w.user_id, w.moedas]);
  await query("insert into coin_transactions (user_id, tipo, amount, descricao) values ($1,'withdrawal_refund',$2,'Saque rejeitado - devolução')", [w.user_id, w.moedas]);
  await query("update withdrawal_requests set status='rejected', updated_at=now() where id=$1", [w.id]);
  res.json({ ok: true });
});

// ---- Payment requests ----
adminRouter.get("/payments", async (_req, res) => {
  const r = await query("select * from payment_requests order by created_at desc limit 200");
  res.json(r.rows);
});

adminRouter.post("/payments/:id/approve", async (req, res) => {
  const p = await one<any>("select * from payment_requests where id = $1", [req.params.id]);
  if (!p) return res.status(404).json({ error: "not_found" });
  await query(
    `insert into category_access (user_id, concurso_id, categoria_id, expires_at)
     values ($1,$2,$3, now() + interval '4 months')
     on conflict (user_id, concurso_id, categoria_id) do update set expires_at = now() + interval '4 months'`,
    [p.user_id, p.concurso_id, p.categoria_id],
  );
  await query("update payment_requests set status='approved', updated_at=now() where id=$1", [p.id]);
  res.json({ ok: true });
});

adminRouter.post("/payments/:id/reject", async (req, res) => {
  await query("update payment_requests set status='rejected', notes=$2, updated_at=now() where id=$1", [
    req.params.id,
    req.body?.notes || null,
  ]);
  res.json({ ok: true });
});

// ---- Startup Metrics Dashboard ----
adminRouter.get("/metrics", async (_req, res) => {
  try {
    const n = async (sql: string, p?: any[]) =>
      Number((await one<{ c: string | number }>(sql, p))?.c ?? 0);

    // ── User counts ──────────────────────────────────────────────────────────
    const [totalUsers, newUsers30d, newUsers7d, newUsersPrev30d, dau, mau, mauPrev, paidUsers] =
      await Promise.all([
        n("SELECT count(*)::int c FROM profiles"),
        n("SELECT count(*)::int c FROM profiles WHERE created_at > now() - interval '30 days'"),
        n("SELECT count(*)::int c FROM profiles WHERE created_at > now() - interval '7 days'"),
        n("SELECT count(*)::int c FROM profiles WHERE created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days'"),
        n("SELECT count(*)::int c FROM profiles WHERE last_seen > now() - interval '1 day'"),
        n("SELECT count(*)::int c FROM profiles WHERE last_seen > now() - interval '30 days'"),
        n("SELECT count(*)::int c FROM profiles WHERE last_seen BETWEEN now() - interval '60 days' AND now() - interval '30 days'"),
        n("SELECT count(DISTINCT user_id)::int c FROM category_access"),
      ]);

    // ── Revenue ───────────────────────────────────────────────────────────────
    const [revAccess, revTopup, mrrAccess, mrrTopup, avgOrderRaw] = await Promise.all([
      n("SELECT COALESCE(sum(amount_aoa), 0)::int c FROM payment_requests WHERE status='approved'"),
      n("SELECT COALESCE(sum(amount_aoa), 0)::int c FROM coin_topup_requests WHERE status='approved'"),
      n("SELECT COALESCE(sum(amount_aoa), 0)::int c FROM payment_requests WHERE status='approved' AND updated_at > now() - interval '30 days'"),
      n("SELECT COALESCE(sum(amount_aoa), 0)::int c FROM coin_topup_requests WHERE status='approved' AND updated_at > now() - interval '30 days'"),
      n("SELECT COALESCE(avg(amount_aoa), 0)::int c FROM payment_requests WHERE status='approved'"),
    ]);
    const totalRevenue = revAccess + revTopup;
    const mrr = mrrAccess + mrrTopup;
    const arr = mrr * 12;
    const ltv = paidUsers > 0 ? Math.round(totalRevenue / paidUsers) : 0;
    const arpu = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;
    const conversionRate = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 1000) / 10 : 0;

    // ── Engagement (from question_attempts) ───────────────────────────────────
    const engRow = await one<{ total: string; users: string; simulado: string; aprender: string }>(
      `SELECT
         count(*)::int as total,
         count(DISTINCT user_id)::int as users,
         count(CASE WHEN mode='simulado' THEN 1 END)::int as simulado,
         count(CASE WHEN mode='aprender' THEN 1 END)::int as aprender
       FROM question_attempts WHERE created_at > now() - interval '30 days'`,
    );
    const totalAttempts30d = Number(engRow?.total ?? 0);
    const activeUsers30d = Number(engRow?.users ?? 0);
    const avgAttemptsPerUser = activeUsers30d > 0 ? Math.round(totalAttempts30d / activeUsers30d) : 0;
    const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0;

    // ── Retention 30d ─────────────────────────────────────────────────────────
    const retRow = await one<{ prev_mau: string; retained: string }>(
      `WITH
         curr AS (SELECT DISTINCT user_id FROM profiles WHERE last_seen > now() - interval '30 days'),
         prev AS (SELECT DISTINCT user_id FROM profiles WHERE last_seen BETWEEN now() - interval '60 days' AND now() - interval '30 days'),
         ret  AS (SELECT user_id FROM curr INTERSECT SELECT user_id FROM prev)
       SELECT
         (SELECT count(*)::int FROM prev) as prev_mau,
         (SELECT count(*)::int FROM ret)  as retained`,
    );
    const prevMAU = Number(retRow?.prev_mau ?? 0);
    const retainedCount = Number(retRow?.retained ?? 0);
    const retentionRate = prevMAU > 0 ? Math.round((retainedCount / prevMAU) * 100) : null;
    const churnRate = retentionRate !== null ? 100 - retentionRate : null;

    // ── Growth rate MoM ───────────────────────────────────────────────────────
    const growthRate =
      newUsersPrev30d > 0
        ? Math.round(((newUsers30d - newUsersPrev30d) / newUsersPrev30d) * 100)
        : null;

    // ── Charts ────────────────────────────────────────────────────────────────
    const [userGrowthRaw, revenueRaw, dauTrendRaw, modeRaw, retentionCohortRaw] = await Promise.all([
      // Monthly user registrations (last 12 months)
      query(
        `SELECT to_char(date_trunc('month', created_at), 'Mon/YY') as month,
                count(*)::int as n
         FROM profiles WHERE created_at > now() - interval '12 months'
         GROUP BY date_trunc('month', created_at)
         ORDER BY date_trunc('month', created_at)`,
      ),
      // Monthly revenue (last 12 months) — access subscriptions
      query(
        `SELECT to_char(date_trunc('month', updated_at), 'Mon/YY') as month,
                COALESCE(sum(amount_aoa), 0)::int as aoa
         FROM payment_requests WHERE status='approved' AND updated_at > now() - interval '12 months'
         GROUP BY date_trunc('month', updated_at)
         ORDER BY date_trunc('month', updated_at)`,
      ),
      // DAU trend (last 30 days via last_seen)
      query(
        `SELECT to_char(date_trunc('day', last_seen), 'DD/MM') as day,
                count(*)::int as dau
         FROM profiles WHERE last_seen > now() - interval '30 days'
         GROUP BY date_trunc('day', last_seen)
         ORDER BY date_trunc('day', last_seen)`,
      ),
      // Mode breakdown (all time)
      query(`SELECT mode, count(*)::int as n FROM question_attempts GROUP BY mode`),
      // Monthly retention cohort (last 6 months)
      query(
        `WITH monthly AS (
           SELECT date_trunc('month', last_seen) as month,
                  count(DISTINCT id)::int as mau
           FROM profiles WHERE last_seen > now() - interval '6 months'
           GROUP BY 1
         )
         SELECT to_char(month, 'Mon/YY') as month, mau FROM monthly ORDER BY month`,
      ),
    ]);

    res.json({
      // User metrics
      totalUsers, newUsers30d, newUsers7d, dau, mau, mauPrev, paidUsers,
      conversionRate, dauMauRatio, growthRate,
      // Revenue / monetisation
      totalRevenue, mrr, arr, arpu, ltv, avgOrder: avgOrderRaw,
      // Retention
      retentionRate, churnRate, retainedCount, prevMAU,
      // Engagement
      totalAttempts30d, activeUsers30d, avgAttemptsPerUser,
      // Charts
      userGrowth: userGrowthRaw.rows,
      revenue: revenueRaw.rows,
      dauTrend: dauTrendRaw.rows,
      modeBreakdown: modeRaw.rows,
      retentionCohort: retentionCohortRaw.rows,
    });
  } catch (e: any) {
    console.error("/admin/metrics error:", e);
    res.status(500).json({ error: e?.message || "server_error" });
  }
});
