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
  const amountAoa = Number(req.body?.amount_aoa) || 0;
  await query(
    `insert into category_access (user_id, concurso_id, categoria_id, expires_at)
     values ($1,$2,$3, now() + interval '4 months')
     on conflict (user_id, concurso_id, categoria_id) do update set expires_at = now() + interval '4 months'`,
    [p.user_id, p.concurso_id, p.categoria_id],
  );
  await query(
    "update payment_requests set status='approved', amount_aoa=$2, updated_at=now() where id=$1",
    [p.id, amountAoa],
  );
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
    // Safe version: never throws — returns 0 if the query fails
    const sn = async (sql: string, p?: any[]): Promise<number> => {
      try { return await n(sql, p); } catch { return 0; }
    };
    const sq = async (sql: string, p?: any[]): Promise<any[]> => {
      try { return (await query(sql, p)).rows; } catch { return []; }
    };

    // ══ 1. UTILIZADORES ═════════════════════════════════════════════════════
    const [totalUsers, newToday, new7d, new30d, newPrev30d, dau, mau, mauPrev] = await Promise.all([
      n("SELECT count(*)::int c FROM profiles"),
      n("SELECT count(*)::int c FROM profiles WHERE created_at > now() - interval '1 day'"),
      n("SELECT count(*)::int c FROM profiles WHERE created_at > now() - interval '7 days'"),
      n("SELECT count(*)::int c FROM profiles WHERE created_at > now() - interval '30 days'"),
      n("SELECT count(*)::int c FROM profiles WHERE created_at BETWEEN now()-interval'60 days' AND now()-interval'30 days'"),
      n("SELECT count(*)::int c FROM profiles WHERE last_seen > now() - interval '1 day'"),
      n("SELECT count(*)::int c FROM profiles WHERE last_seen > now() - interval '30 days'"),
      n("SELECT count(*)::int c FROM profiles WHERE last_seen BETWEEN now()-interval'60 days' AND now()-interval'30 days'"),
    ]);
    const growthRate = newPrev30d > 0 ? Math.round(((new30d - newPrev30d) / newPrev30d) * 100) : null;
    const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0;

    // ══ 2. PLANOS PAGOS ══════════════════════════════════════════════════════
    const [paidUsers, activeSubs, expiredSubs, expiringSoon] = await Promise.all([
      n("SELECT count(DISTINCT user_id)::int c FROM category_access"),
      n("SELECT count(*)::int c FROM category_access WHERE expires_at > now()"),
      n("SELECT count(*)::int c FROM category_access WHERE expires_at <= now()"),
      n("SELECT count(*)::int c FROM category_access WHERE expires_at BETWEEN now() AND now()+interval'14 days'"),
    ]);
    const conversionRate = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 1000) / 10 : 0;

    // Subscrições por categoria (para gráfico de planos populares)
    const plansRaw = await query(
      `SELECT concurso_id, categoria_id,
              count(*)::int as total,
              count(CASE WHEN expires_at > now() THEN 1 END)::int as active
       FROM category_access GROUP BY 1,2 ORDER BY 3 DESC LIMIT 15`,
    );

    // ══ 3. RECEITA ═══════════════════════════════════════════════════════════
    // payment_requests = subscrições de acesso (amount_aoa adicionado na migração 014)
    // coin_topup_requests = compras de moedas
    const [revAccess, revTopup, mrrAccess, mrrTopup, avgAccessOrder, countApprovedAccess] =
      await Promise.all([
        sn("SELECT COALESCE(sum(amount_aoa),0)::int c FROM payment_requests WHERE status='approved'"),
        sn("SELECT COALESCE(sum(amount_aoa),0)::int c FROM coin_topup_requests WHERE status='approved'"),
        sn("SELECT COALESCE(sum(amount_aoa),0)::int c FROM payment_requests WHERE status='approved' AND updated_at > now()-interval'30 days'"),
        sn("SELECT COALESCE(sum(amount_aoa),0)::int c FROM coin_topup_requests WHERE status='approved' AND updated_at > now()-interval'30 days'"),
        sn("SELECT COALESCE(avg(NULLIF(amount_aoa,0)),0)::int c FROM payment_requests WHERE status='approved' AND amount_aoa > 0"),
        sn("SELECT count(*)::int c FROM payment_requests WHERE status='approved'"),
      ]);
    const totalRevenue = revAccess + revTopup;
    const mrr = mrrAccess + mrrTopup;
    const arr = mrr * 12;
    const ltv = paidUsers > 0 ? Math.round(totalRevenue / paidUsers) : 0;
    const arpu = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;

    // ══ 4. SAQUES (WITHDRAWALS) ══════════════════════════════════════════════
    const saqRow = await (async () => {
      try {
        return await one<{
          paid_aoa: number; pending_aoa: number; rejected_aoa: number;
          count_paid: number; count_pending: number; moedas_paid: number;
        }>(
          `SELECT
             COALESCE(sum(CASE WHEN status='paid'     THEN aoa   ELSE 0 END),0)::int as paid_aoa,
             COALESCE(sum(CASE WHEN status='pending'  THEN aoa   ELSE 0 END),0)::int as pending_aoa,
             COALESCE(sum(CASE WHEN status='rejected' THEN aoa   ELSE 0 END),0)::int as rejected_aoa,
             count(CASE WHEN status='paid'    THEN 1 END)::int as count_paid,
             count(CASE WHEN status='pending' THEN 1 END)::int as count_pending,
             COALESCE(sum(CASE WHEN status='paid' THEN moedas ELSE 0 END),0)::int as moedas_paid
           FROM withdrawal_requests`,
        );
      } catch { return null; }
    })();
    const totalWithdrawn  = Number(saqRow?.paid_aoa    ?? 0);
    const pendingWithdraw = Number(saqRow?.pending_aoa ?? 0);
    const netRevenue      = totalRevenue - totalWithdrawn;

    // Taxa de câmbio moedas→AOA (média de saques aprovados)
    const exRow = await (async () => {
      try {
        return await one<{ rate: string }>(
          `SELECT round(avg(aoa::numeric / NULLIF(moedas,0))::numeric, 4) as rate
           FROM withdrawal_requests WHERE status='paid' AND moedas>0 AND aoa>0`,
        );
      } catch { return null; }
    })();
    const ptsToAoa = Number(exRow?.rate ?? 0);

    // ══ 5. CAC (aquisição via referido) ══════════════════════════════════════
    const [referredUsers, referrers] = await Promise.all([
      n("SELECT count(*)::int c FROM profiles WHERE referred_by IS NOT NULL"),
      n("SELECT count(DISTINCT referred_by)::int c FROM profiles WHERE referred_by IS NOT NULL"),
    ]);
    // 50 pontos por indicação; se tivermos taxa de câmbio podemos estimar AOA
    const cacAoa = ptsToAoa > 0 ? Math.round(50 * ptsToAoa) : 0;
    const ltvCacRatio = cacAoa > 0 && ltv > 0 ? Math.round(ltv / cacAoa) : null;

    // ══ 6. TEMPO NA PLATAFORMA ═══════════════════════════════════════════════
    // Estimativa: simulado ≈ 2.5 min/questão, aprender ≈ 15 s/questão
    const timeRow = await (async () => {
      try {
        return await one<{
          total_all: number; sim_all: number; apr_all: number;
          total30: number; sim30: number; apr30: number; users30: number;
          correct_all: number; correct30: number;
        }>(
          `SELECT
             count(*)::int                                                                      as total_all,
             count(CASE WHEN mode='simulado' THEN 1 END)::int                                  as sim_all,
             count(CASE WHEN mode='aprender' THEN 1 END)::int                                  as apr_all,
             count(CASE WHEN answered_at > now()-interval'30 days' THEN 1 END)::int             as total30,
             count(CASE WHEN mode='simulado' AND answered_at>now()-interval'30 days' THEN 1 END)::int as sim30,
             count(CASE WHEN mode='aprender' AND answered_at>now()-interval'30 days' THEN 1 END)::int as apr30,
             count(DISTINCT CASE WHEN answered_at>now()-interval'30 days' THEN user_id END)::int as users30,
             count(CASE WHEN correct THEN 1 END)::int                                          as correct_all,
             count(CASE WHEN correct AND answered_at>now()-interval'30 days' THEN 1 END)::int  as correct30
           FROM question_attempts`,
        );
      } catch { return null; }
    })();
    const totalAttempts    = Number(timeRow?.total_all ?? 0);
    const simAll           = Number(timeRow?.sim_all   ?? 0);
    const aprAll           = Number(timeRow?.apr_all   ?? 0);
    const totalAttempts30d = Number(timeRow?.total30   ?? 0);
    const sim30d           = Number(timeRow?.sim30     ?? 0);
    const apr30d           = Number(timeRow?.apr30     ?? 0);
    const activeUsers30d   = Number(timeRow?.users30   ?? 0);
    const correctAll       = Number(timeRow?.correct_all ?? 0);
    const correct30d       = Number(timeRow?.correct30   ?? 0);

    const estMinutesTotal = Math.round(simAll  * 2.5 + aprAll  * 0.25);
    const estMinutes30d   = Math.round(sim30d  * 2.5 + apr30d  * 0.25);
    const estHoursTotal   = Math.round(estMinutesTotal / 60);
    const avgMinPerUser   = activeUsers30d > 0 ? Math.round(estMinutes30d / activeUsers30d) : 0;
    const avgAttemptsPerUser = activeUsers30d > 0 ? Math.round(totalAttempts30d / activeUsers30d) : 0;
    const accuracyRate    = totalAttempts > 0 ? Math.round((correctAll / totalAttempts) * 100) : 0;
    const accuracyRate30d = totalAttempts30d > 0 ? Math.round((correct30d / totalAttempts30d) * 100) : 0;

    // ══ 7. RETENÇÃO ══════════════════════════════════════════════════════════
    const retRow = await (async () => {
      try {
        return await one<{ prev_mau: string; retained: string }>(
          `WITH
             curr AS (SELECT DISTINCT id FROM profiles WHERE last_seen > now()-interval'30 days'),
             prev AS (SELECT DISTINCT id FROM profiles WHERE last_seen BETWEEN now()-interval'60 days' AND now()-interval'30 days'),
             ret  AS (SELECT id FROM curr INTERSECT SELECT id FROM prev)
           SELECT (SELECT count(*)::int FROM prev) as prev_mau,
                  (SELECT count(*)::int FROM ret)  as retained`,
        );
      } catch { return null; }
    })();
    const prevMAU        = Number(retRow?.prev_mau ?? 0);
    const retainedCount  = Number(retRow?.retained ?? 0);
    const retentionRate  = prevMAU > 0 ? Math.round((retainedCount / prevMAU) * 100) : null;
    const churnRate      = retentionRate !== null ? 100 - retentionRate : null;

    // ══ 8. CHARTS + MÉTRICAS ADICIONAIS ══════════════════════════════════════
    const [
      userGrowthRaw,
      newUsersDailyRaw,
      revenueChartRaw,
      saquesChartRaw,
      dauTrendRaw,
      mauCohortRaw,
      attemptsChartRaw,
      modeChartRaw,
      disciplinesRaw,         // questões por disciplina (top 20)
      activationRaw,          // taxa de activação (registados que responderam ≥1 q)
      retentionCohortRaw,     // retenção D1/D7/D30 (approx via last_seen vs created_at)
    ] = await Promise.all([
      sq(
        `SELECT to_char(date_trunc('month',created_at),'Mon/YY') as month, count(*)::int as n
         FROM profiles WHERE created_at > now()-interval'12 months'
         GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at)`,
      ),
      sq(
        `SELECT to_char(date_trunc('day',created_at),'DD/MM') as day, count(*)::int as n
         FROM profiles WHERE created_at > now()-interval'30 days'
         GROUP BY date_trunc('day',created_at) ORDER BY date_trunc('day',created_at)`,
      ),
      sq(
        `SELECT to_char(date_trunc('month',updated_at),'Mon/YY') as month,
                sum(amount_aoa)::int as total,
                sum(CASE WHEN src='access' THEN amount_aoa ELSE 0 END)::int as acesso,
                sum(CASE WHEN src='topup'  THEN amount_aoa ELSE 0 END)::int as topup
         FROM (
           SELECT amount_aoa, updated_at, 'access' as src
             FROM payment_requests WHERE status='approved' AND amount_aoa > 0
           UNION ALL
           SELECT amount_aoa, updated_at, 'topup' as src
             FROM coin_topup_requests WHERE status='approved'
         ) c
         WHERE updated_at > now()-interval'12 months'
         GROUP BY date_trunc('month',updated_at)
         ORDER BY date_trunc('month',updated_at)`,
      ),
      sq(
        `SELECT to_char(date_trunc('month',updated_at),'Mon/YY') as month,
                COALESCE(sum(aoa),0)::int as aoa
         FROM withdrawal_requests WHERE status='paid' AND updated_at > now()-interval'12 months'
         GROUP BY date_trunc('month',updated_at) ORDER BY date_trunc('month',updated_at)`,
      ),
      sq(
        `SELECT to_char(date_trunc('day',last_seen),'DD/MM') as day, count(*)::int as dau
         FROM profiles WHERE last_seen > now()-interval'30 days'
         GROUP BY date_trunc('day',last_seen) ORDER BY date_trunc('day',last_seen)`,
      ),
      sq(
        `SELECT to_char(date_trunc('month',last_seen),'Mon/YY') as month,
                count(DISTINCT id)::int as mau
         FROM profiles WHERE last_seen > now()-interval'6 months'
         GROUP BY date_trunc('month',last_seen) ORDER BY date_trunc('month',last_seen)`,
      ),
      sq(
        `SELECT to_char(date_trunc('day',answered_at),'DD/MM') as day,
                count(*)::int as n,
                count(CASE WHEN correct THEN 1 END)::int as correct
         FROM question_attempts WHERE answered_at > now()-interval'30 days'
         GROUP BY date_trunc('day',answered_at) ORDER BY date_trunc('day',answered_at)`,
      ),
      sq(`SELECT mode, count(*)::int as n FROM question_attempts WHERE mode IS NOT NULL GROUP BY mode`),
      // Questões por disciplina — apenas slugs do sistema de interesses (formato: a-z e hífens)
      sq(`SELECT disciplina, count(*)::int as n FROM questions WHERE active AND disciplina ~ '^[a-z][a-z0-9-]+$' GROUP BY disciplina ORDER BY count(*) DESC`),
      // Taxa de activação: quantos utilizadores registados responderam ≥1 questão
      sq(
        `SELECT
           count(DISTINCT p.id)::int as registered,
           count(DISTINCT qa.user_id)::int as activated
         FROM profiles p
         LEFT JOIN question_attempts qa ON qa.user_id = p.id`,
      ),
      // Retenção aproximada por coorte de registo (D1/D7/D30)
      sq(
        `SELECT
           count(*) filter (where last_seen - created_at >= interval'1 day')::int  as ret_d1,
           count(*) filter (where last_seen - created_at >= interval'7 days')::int  as ret_d7,
           count(*) filter (where last_seen - created_at >= interval'30 days')::int as ret_d30,
           count(*)::int as total
         FROM profiles`,
      ),
    ]);

    // Métricas adicionais derivadas
    const activatedUsers  = Number(activationRaw[0]?.activated ?? 0);
    const registeredUsers = Number(activationRaw[0]?.registered ?? totalUsers);
    const activationRate  = registeredUsers > 0 ? Math.round((activatedUsers / registeredUsers) * 100) : 0;

    const retD1   = Number(retentionCohortRaw[0]?.ret_d1  ?? 0);
    const retD7   = Number(retentionCohortRaw[0]?.ret_d7  ?? 0);
    const retD30  = Number(retentionCohortRaw[0]?.ret_d30 ?? 0);
    const retBase = Number(retentionCohortRaw[0]?.total   ?? totalUsers) || 1;
    const retD1Rate  = Math.round((retD1  / retBase) * 100);
    const retD7Rate  = Math.round((retD7  / retBase) * 100);
    const retD30Rate = Math.round((retD30 / retBase) * 100);

    // Período médio de payback (meses para recuperar CAC com MRR/MAU)
    const revenuePerMAU = mau > 0 ? Math.round(mrr / mau) : 0;
    const paybackMonths = revenuePerMAU > 0 && cacAoa > 0 ? Math.round(cacAoa / revenuePerMAU) : null;

    res.json({
      // Utilizadores
      totalUsers, newToday, new7d, new30d, growthRate,
      dau, mau, mauPrev, dauMauRatio,
      // Activação
      activatedUsers, activationRate,
      // Planos
      paidUsers, activeSubs, expiredSubs, expiringSoon, conversionRate,
      countApprovedAccess,
      // Receita
      totalRevenue, revAccess, revTopup, mrr, arr, ltv, arpu, avgAccessOrder, netRevenue,
      revenuePerMAU,
      // Saques
      totalWithdrawn, pendingWithdraw,
      countSaquesPaid:    Number(saqRow?.count_paid    ?? 0),
      countSaquesPending: Number(saqRow?.count_pending ?? 0),
      // CAC & Unit Economics
      ptsToAoa, referredUsers, referrers, cacAoa, ltvCacRatio, paybackMonths,
      // Tempo & Engajamento
      totalAttempts, totalAttempts30d, activeUsers30d, avgAttemptsPerUser,
      estHoursTotal, avgMinPerUser, accuracyRate, accuracyRate30d,
      // Retenção D1/D7/D30 (cohort)
      retentionRate, churnRate, retainedCount, prevMAU,
      retD1Rate, retD7Rate, retD30Rate,
      // Charts
      userGrowth:     userGrowthRaw,
      newUsersDaily:  newUsersDailyRaw,
      revenue:        revenueChartRaw,
      saques:         saquesChartRaw,
      dauTrend:       dauTrendRaw,
      mauCohort:      mauCohortRaw,
      attemptsDaily:  attemptsChartRaw,
      modeBreakdown:  modeChartRaw,
      plans:          plansRaw.rows,
      disciplines:    disciplinesRaw,
    });
  } catch (e: any) {
    console.error("/admin/metrics error:", e);
    res.status(500).json({ error: e?.message || "server_error" });
  }
});

// ---- Top 3 users by pontos_globais (with full stats) ----
adminRouter.get("/top-users", async (_req, res) => {
  try {
    const r = await query(`
      SELECT
        p.id, p.nome, p.email, p.avatar_url, p.pontos, p.pontos_globais, p.moedas,
        p.streak, p.created_at, p.last_seen, p.universidade, p.curso, p.ano, p.bio,
        count(qa.id)::int                                                      as total_attempts,
        count(CASE WHEN qa.correct      THEN 1 END)::int                       as correct_attempts,
        count(CASE WHEN qa.mode='simulado' THEN 1 END)::int                    as simulado_count,
        count(CASE WHEN qa.mode='aprender' THEN 1 END)::int                    as aprender_count,
        round(count(CASE WHEN qa.mode='simulado' THEN 1 END)::numeric * 2.5
            + count(CASE WHEN qa.mode='aprender' THEN 1 END)::numeric * 0.25)::int as est_minutes,
        count(DISTINCT ca.id)::int                                             as access_count
      FROM profiles p
      LEFT JOIN question_attempts qa ON qa.user_id = p.id
      LEFT JOIN category_access   ca ON ca.user_id = p.id
      GROUP BY p.id
      ORDER BY p.pontos_globais DESC NULLS LAST
      LIMIT 3
    `);
    res.json(r.rows);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "server_error" });
  }
});

// ---- Revoke approved coin top-up (fraud prevention) ----
adminRouter.post("/topups/:id/revoke", async (req, res) => {
  try {
    const t = await one<any>("select * from coin_topup_requests where id = $1", [req.params.id]);
    if (!t) return res.status(404).json({ error: "not_found" });
    if (t.status !== "approved") return res.status(400).json({ error: "not_approved" });
    await query(
      "update profiles set moedas = greatest(0, moedas - $2), updated_at = now() where id = $1",
      [t.user_id, t.moedas],
    );
    await query(
      "insert into coin_transactions (user_id, tipo, amount, descricao) values ($1,'topup_revoke',$2,'Carregamento revogado - fraude')",
      [t.user_id, t.moedas],
    );
    await query("update coin_topup_requests set status='revoked', updated_at=now() where id=$1", [t.id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "server_error" });
  }
});

// ---- Warn user (inserts a notification) ----
adminRouter.post("/users/:id/warn", async (req: any, res) => {
  const { message } = req.body || {};
  try {
    await query(
      "insert into notifications (user_id, title, body, created_by) values ($1,$2,$3,$4)",
      [req.params.id, "Advertência da administração", message || "A sua conta está sob análise.", req.userId],
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "server_error" });
  }
});

// ---- Ban user (block account + optional notification) ----
adminRouter.post("/users/:id/ban", async (req: any, res) => {
  const { reason, notify } = req.body || {};
  try {
    await query("update profiles set blocked = true, updated_at = now() where id = $1", [req.params.id]);
    if (notify !== false) {
      const body = reason
        ? `A sua conta foi suspensa. Motivo: ${reason}`
        : "A sua conta foi suspensa pela administração.";
      await query(
        "insert into notifications (user_id, title, body, created_by) values ($1,$2,$3,$4)",
        [req.params.id, "Conta suspensa", body, req.userId],
      );
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "server_error" });
  }
});

// ---- Full stats for a single user (used in admin user detail modal) ----
adminRouter.get("/users/:id/stats", async (req, res) => {
  try {
    const r = await one<any>(
      `SELECT
         p.id, p.nome, p.email, p.avatar_url, p.pontos, p.pontos_globais, p.moedas,
         p.streak, p.created_at, p.last_seen, p.universidade, p.curso, p.ano, p.bio,
         p.friend_code, p.referred_by, p.blocked, p.hidden,
         count(qa.id)::int                                                      as total_attempts,
         count(CASE WHEN qa.correct      THEN 1 END)::int                       as correct_attempts,
         count(CASE WHEN qa.mode='simulado' THEN 1 END)::int                    as simulado_count,
         count(CASE WHEN qa.mode='aprender' THEN 1 END)::int                    as aprender_count,
         round(count(CASE WHEN qa.mode='simulado' THEN 1 END)::numeric * 2.5
             + count(CASE WHEN qa.mode='aprender' THEN 1 END)::numeric * 0.25)::int as est_minutes,
         count(DISTINCT ca.id)::int                                             as access_count,
         (SELECT count(*)::int FROM profiles WHERE referred_by = p.friend_code) as referrals_given
       FROM profiles p
       LEFT JOIN question_attempts qa ON qa.user_id = p.id
       LEFT JOIN category_access   ca ON ca.user_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [req.params.id],
    );
    if (!r) return res.status(404).json({ error: "not_found" });
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "server_error" });
  }
});
