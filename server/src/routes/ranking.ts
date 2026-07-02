import { Router } from "express";
import { one, pool, query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const rankingRouter = Router();

// ---- Ligas semanais ---------------------------------------------------
// Divisões: 0=Bronze … 4=Lenda. Cada semana (segunda→domingo) os pontos do
// points_log contam para a liga. No fim da semana: top 10 de cada divisão
// sobem; quem não pontuou (e não está no Bronze) desce. O rollover é lazy —
// o primeiro pedido da semana processa a anterior, com advisory lock para
// nunca correr duas vezes.
export const LEAGUE_NAMES = ["Bronze", "Prata", "Ouro", "Diamante", "Lenda"];
const LEAGUE_MAX = LEAGUE_NAMES.length - 1;
const PROMOTE_TOP = 10;
const LEAGUE_LOCK_KEY = 874512;

async function rolloverLeagues() {
  const prev = await one<{ week: string }>(
    `select (date_trunc('week', now() - interval '7 days'))::date::text as week`,
  );
  if (!prev) return;
  const done = await one(
    "select 1 from league_rollovers where week_start = $1",
    [prev.week],
  );
  if (done) return;

  const client = await pool.connect();
  try {
    const lock = await client.query("select pg_try_advisory_lock($1) as ok", [LEAGUE_LOCK_KEY]);
    if (!lock.rows[0]?.ok) return; // someone else is processing
    const again = await client.query(
      "select 1 from league_rollovers where week_start = $1",
      [prev.week],
    );
    if (again.rows[0]) return;

    // Promote the top scorers of each division (with points last week).
    await client.query(
      `with pts as (
         select p.id, p.league, sum(l.delta) as pts
           from profiles p
           join points_log l on l.user_id = p.id
          where l.created_at >= $1::date and l.created_at < $1::date + 7
          group by p.id, p.league
         having sum(l.delta) > 0
       ), ranked as (
         select id, league, row_number() over (partition by league order by pts desc) as rn
           from pts
       )
       update profiles set league = league + 1
        where league < $3
          and id in (select id from ranked where rn <= $2)`,
      [prev.week, PROMOTE_TOP, LEAGUE_MAX],
    );
    // Demote everyone above Bronze who scored nothing last week.
    await client.query(
      `update profiles set league = league - 1
        where league > 0
          and id not in (
            select distinct user_id from points_log
             where created_at >= $1::date and created_at < $1::date + 7 and delta > 0
          )`,
      [prev.week],
    );
    await client.query(
      "insert into league_rollovers (week_start) values ($1) on conflict do nothing",
      [prev.week],
    );
  } finally {
    try { await client.query("select pg_advisory_unlock($1)", [LEAGUE_LOCK_KEY]); } catch {}
    client.release();
  }
}

// My league: division info + this week's standings inside my division.
rankingRouter.get("/league", requireAuth, async (req: AuthedRequest, res) => {
  try {
    await rolloverLeagues();

    const me = await one<{ league: number }>(
      "select league from profiles where id = $1",
      [req.userId],
    );
    const league = Math.min(Math.max(me?.league ?? 0, 0), LEAGUE_MAX);

    const rows = (
      await query(
        `select p.id, p.nome, p.avatar_url, coalesce(sum(l.delta),0)::int as pontos
           from profiles p
           left join points_log l
             on l.user_id = p.id and l.created_at >= date_trunc('week', now())
          where p.league = $2 and (p.hidden = false or p.id = $1)
          group by p.id, p.nome, p.avatar_url
         having coalesce(sum(l.delta),0) > 0 or p.id = $1
          order by pontos desc, p.nome
          limit 100`,
        [req.userId, league],
      )
    ).rows;

    const weekEnd = await one<{ ends: string }>(
      `select (date_trunc('week', now()) + interval '7 days') as ends`,
    );

    res.json({
      league,
      league_name: LEAGUE_NAMES[league],
      leagues: LEAGUE_NAMES,
      promote_top: PROMOTE_TOP,
      week_ends_at: weekEnd?.ends ?? null,
      standings: rows,
    });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// Overall ranking (optionally filtered by category).
rankingRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const categoria = (req.query.categoria as string) || null;
  const r = await query(
    `select id, nome, avatar_url, pontos_globais as pontos, categoria_nome
       from profiles
      where (hidden = false or id = $1)
        and ($2::text is null or categoria_id = $2)
      order by pontos_globais desc
      limit 100`,
    [req.userId, categoria],
  );
  res.json(r.rows);
});

// Weekly ranking (points earned since the start of the week).
rankingRouter.get("/weekly", requireAuth, async (req: AuthedRequest, res) => {
  const r = await query(
    `select p.id, p.nome, p.avatar_url, coalesce(sum(l.delta),0)::int as pontos, p.categoria_nome
       from profiles p
       join points_log l on l.user_id = p.id
      where l.created_at >= date_trunc('week', now())
        and (p.hidden = false or p.id = $1)
      group by p.id, p.nome, p.avatar_url, p.categoria_nome
     having coalesce(sum(l.delta),0) > 0
      order by pontos desc
      limit 50`,
    [req.userId],
  );
  res.json(r.rows);
});
