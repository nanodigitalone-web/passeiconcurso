import { Router } from "express";
import { createRequire } from "module";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { hasCategoryAccess } from "../lib/access.js";
import { one, query } from "../lib/db.js";
// @ts-ignore - resolved at runtime by tsx
import { getRecursos } from "../../data/_source/recursos.ts";
// @ts-ignore - resolved at runtime by tsx
import { ALL_DISCIPLINAS } from "../../../src/data/disciplinas.ts";

// Expand user interest slugs to also include the readable name of each discipline.
// Seed and old AI questions store the human-readable name in `disciplina`; newer
// questions (generated with generate-interests.mjs) store the slug. We include
// both so the SQL IN(...) query matches either format.
function expandInterestSlugs(slugs: string[]): string[] {
  const expanded = new Set<string>(slugs);
  for (const slug of slugs) {
    const disc = (ALL_DISCIPLINAS as any[]).find((d: any) => d.id === slug);
    if (disc?.nome) expanded.add(disc.nome);
  }
  return Array.from(expanded);
}

const require = createRequire(import.meta.url);
// Full quiz bank including correct answers + explanations (server-only).
const bank: any[] = require("../../data/quiz-bank.json");

export const contentRouter = Router();

// Gated correct answers + explanations for a category.
contentRouter.post("/quiz", requireAuth, async (req: AuthedRequest, res) => {
  const { concursoId, categoriaId } = req.body || {};
  if (!concursoId || !categoriaId)
    return res.status(400).json({ error: "missing_params" });
  if (!(await hasCategoryAccess(req.userId!, concursoId, categoriaId)))
    return res.status(403).json({ error: "Forbidden" });

  const categoria = bank
    .find((c) => c.id === concursoId)
    ?.categorias.find((cat: any) => cat.id === categoriaId);
  if (!categoria) return res.status(404).json({ error: "not_found" });

  const questions = categoria.questoes.map((q: any) => ({
    id: q.id,
    correta: q.correta,
    comentario: q.comentario,
  }));
  res.json({ questions });
});

// Gated clinical resources for a category.
contentRouter.post("/recursos", requireAuth, async (req: AuthedRequest, res) => {
  const { concursoId, categoriaId } = req.body || {};
  if (!concursoId || !categoriaId)
    return res.status(400).json({ error: "missing_params" });
  if (!(await hasCategoryAccess(req.userId!, concursoId, categoriaId)))
    return res.status(403).json({ error: "Forbidden" });

  const data = getRecursos(concursoId, categoriaId);
  res.json({ seccoes: data?.seccoes ?? [] });
});

// Record per-question answers (the adaptive-learning signal). Batched: the
// frontend sends a whole quiz session at once. Fire-and-forget from the client.
contentRouter.post("/attempts", requireAuth, async (req: AuthedRequest, res) => {
  const { attempts } = req.body || {};
  if (!Array.isArray(attempts) || attempts.length === 0)
    return res.status(400).json({ error: "no_attempts" });

  const mode = req.body?.mode === "aprender" ? "aprender" : "simulado";
  const rows = attempts.slice(0, 200); // cap per request
  const params: any[] = [];
  const tuples = rows
    .map((a: any) => {
      params.push(
        req.userId,
        String(a.questionId ?? ""),
        String(a.concursoId ?? ""),
        String(a.categoriaId ?? ""),
        a.disciplina != null ? String(a.disciplina) : null,
        !!a.correct,
        Number.isInteger(a.selected) ? a.selected : null,
        Number.isInteger(a.durationMs) ? a.durationMs : null,
        mode,
      );
      const n = params.length;
      return `($${n - 8},$${n - 7},$${n - 6},$${n - 5},$${n - 4},$${n - 3},$${n - 2},$${n - 1},$${n})`;
    })
    .join(",");

  await query(
    `insert into question_attempts
       (user_id, question_id, concurso_id, categoria_id, disciplina, correct, selected, duration_ms, mode)
     values ${tuples}`,
    params,
  );

  // Update streak + last_seen in profiles so the admin panel and ranking show current data.
  try {
    const streakRows = (await query(
      `select distinct (answered_at at time zone 'Africa/Luanda')::date::text as day
         from question_attempts
        where user_id = $1 and answered_at >= now() - '90 days'::interval
        order by 1 desc`,
      [req.userId],
    )).rows;
    const activeDays = new Set(streakRows.map((r: any) => r.day));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (activeDays.has(key)) streak++;
      else if (i > 0) break;
    }
    await query(
      "update profiles set streak = $2, last_seen = now(), updated_at = now() where id = $1",
      [req.userId, streak],
    );
  } catch { /* non-critical — never fail the attempt save because of this */ }

  res.json({ ok: true, saved: rows.length });
});

// Daily usage for free-tier limit enforcement.
// Returns today's attempt counts (Angola tz) + whether user has any paid plan.
contentRouter.get("/daily-usage", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const [simR, aprR, planR] = await Promise.all([
      one<{ n: number }>(
        `select count(*)::int as n from question_attempts
          where user_id=$1 and mode='simulado'
            and (answered_at at time zone 'Africa/Luanda')::date
              = (now() at time zone 'Africa/Luanda')::date`,
        [req.userId],
      ),
      one<{ n: number }>(
        `select count(*)::int as n from question_attempts
          where user_id=$1 and mode='aprender'
            and (answered_at at time zone 'Africa/Luanda')::date
              = (now() at time zone 'Africa/Luanda')::date`,
        [req.userId],
      ),
      one<{ has_plan: boolean }>(
        `select exists(
           select 1 from access_plans
            where user_id=$1 and (expires_at is null or expires_at > now())
         ) as has_plan`,
        [req.userId],
      ),
    ]);
    res.json({
      simulado_done: (simR?.n ?? 0) > 0,
      aprender_done: (aprR?.n ?? 0) > 0,
      is_free: !(planR?.has_plan ?? false),
    });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// Infinite "Aprender" trail level: each level = 300 answered questions.
contentRouter.post("/aprender-level", requireAuth, async (req: AuthedRequest, res) => {
  const { concursoId, categoriaId } = req.body || {};
  if (!concursoId || !categoriaId)
    return res.status(400).json({ error: "missing_params" });
  const PER_LEVEL = 300;
  try {
    let row: { n: number } | null;
    if (concursoId === "plano") {
      // Get disciplines: try as owner first, then as family member.
      let rawDisc: any[] = [];
      const ownerRow = await one<{ disciplines: any }>(
        `SELECT disciplines FROM user_subscriptions
         WHERE user_id = $1 AND status = 'active'
           AND (expires_at IS NULL OR expires_at > now())`,
        [req.userId],
      );
      if (ownerRow) {
        const d = ownerRow.disciplines;
        rawDisc = Array.isArray(d) ? d
          : typeof d === "string" ? (() => { try { return JSON.parse(d); } catch { return []; } })()
          : [];
      }
      if (rawDisc.length === 0) {
        const memRow = await one<{ disciplines: any }>(
          `SELECT sm.disciplines FROM subscription_members sm
           JOIN user_subscriptions us ON us.id = sm.subscription_id
           WHERE sm.member_user_id = $1 AND us.status = 'active'
             AND (us.expires_at IS NULL OR us.expires_at > now())
           LIMIT 1`,
          [req.userId],
        );
        if (memRow) {
          const d = memRow.disciplines;
          rawDisc = Array.isArray(d) ? d
            : typeof d === "string" ? (() => { try { return JSON.parse(d); } catch { return []; } })()
            : [];
        }
      }
      const disciplinas = expandInterestSlugs(rawDisc as string[]);
      row = disciplinas.length === 0
        ? { n: 0 }
        : await one<{ n: number }>(
            `select count(*)::int as n from question_attempts
              where user_id = $1 and disciplina = any($2::text[]) and mode = 'aprender'`,
            [req.userId, disciplinas],
          );
    } else if (concursoId === "interesses") {
      const profile = await one<{ interesses: string[] }>("select interesses from profiles where id = $1", [req.userId]);
      const disciplinas = expandInterestSlugs(profile?.interesses ?? []);
      row = disciplinas.length === 0
        ? { n: 0 }
        : await one<{ n: number }>(
            `select count(*)::int as n from question_attempts
              where user_id = $1 and disciplina = any($2::text[]) and mode = 'aprender'`,
            [req.userId, disciplinas],
          );
    } else {
      row = await one<{ n: number }>(
        `select count(*)::int as n from question_attempts
          where user_id = $1 and concurso_id = $2 and categoria_id = $3 and mode = 'aprender'`,
        [req.userId, concursoId, categoriaId],
      );
    }
    const total = row?.n ?? 0;
    res.json({
      level: Math.floor(total / PER_LEVEL) + 1,
      doneInLevel: total % PER_LEVEL,
      perLevel: PER_LEVEL,
      total,
    });
  } catch {
    res.json({ level: 1, doneInLevel: 0, perLevel: PER_LEVEL, total: 0 });
  }
});

// Shuffle a question's option positions and remap `correta`, so the correct
// answer is never stuck in the same slot (kills the "always option B" bias).
function shuffleOptions(q: any) {
  const opcoes: string[] = Array.isArray(q.opcoes) ? q.opcoes : JSON.parse(q.opcoes);
  const order = opcoes.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    id: q.id,
    disciplina: q.disciplina,
    enunciado: q.enunciado,
    opcoes: order.map((i) => opcoes[i]),
    correta: order.indexOf(q.correta),
    comentario: q.comentario,
    source: q.source,
  };
}

// Smart question set: mixes old (seed = real-exam, weighted higher) and new
// (ai) questions, personalizes by the user's weaknesses (unseen / previously
// wrong first), and shuffles answer positions. The single source the quiz UI
// should use going forward.
contentRouter.post("/questions", requireAuth, async (req: AuthedRequest, res) => {
  const { concursoId, categoriaId, limit } = req.body || {};
  if (!concursoId || !categoriaId)
    return res.status(400).json({ error: "missing_params" });

  const cap = Math.min(Math.max(1, Number(limit) || 20), 100);
  let all: any[];

  // Virtual "plano" category: serve questions filtered by the user's subscription disciplines.
  if (concursoId === "plano") {
    try {
      // Step 1: find raw disciplines — try owner first, then family member.
      // Two separate queries (not UNION ALL) for clarity and error isolation.
      let rawDisc: any[] = [];

      const ownerRow = await one<{ disciplines: any }>(
        `SELECT disciplines FROM user_subscriptions
         WHERE user_id = $1 AND status = 'active'
           AND (expires_at IS NULL OR expires_at > now())`,
        [req.userId],
      );
      if (ownerRow) {
        const d = ownerRow.disciplines;
        rawDisc = Array.isArray(d) ? d
          : typeof d === "string" ? (() => { try { return JSON.parse(d); } catch { return []; } })()
          : [];
      }

      if (rawDisc.length === 0) {
        const memberRow = await one<{ disciplines: any }>(
          `SELECT sm.disciplines FROM subscription_members sm
           JOIN user_subscriptions us ON us.id = sm.subscription_id
           WHERE sm.member_user_id = $1 AND us.status = 'active'
             AND (us.expires_at IS NULL OR us.expires_at > now())
           LIMIT 1`,
          [req.userId],
        );
        if (memberRow) {
          const d = memberRow.disciplines;
          rawDisc = Array.isArray(d) ? d
            : typeof d === "string" ? (() => { try { return JSON.parse(d); } catch { return []; } })()
            : [];
        }
      }

      console.log(`[plano/questions] user=${req.userId} rawDisc=${JSON.stringify(rawDisc)}`);

      if (rawDisc.length === 0) {
        return res.json({ questions: [], reason: "no_disciplines" });
      }

      // Step 2: expand slugs → include both slug and readable name so old + new questions match.
      let disciplinas: string[];
      try {
        disciplinas = expandInterestSlugs(rawDisc as string[]);
      } catch (e: any) {
        console.error("[plano/questions] expandInterestSlugs failed:", e?.message);
        disciplinas = rawDisc as string[];
      }

      // Step 3: fetch questions for those disciplines.
      const placeholders = disciplinas.map((_: string, i: number) => `$${i + 2}`).join(",");
      all = (
        await query(
          `select id, disciplina, enunciado, opcoes, correta, comentario, source
             from questions
            where disciplina in (${placeholders}) and active`,
          [req.userId, ...disciplinas],
        )
      ).rows;

      console.log(`[plano/questions] disciplinas=${JSON.stringify(disciplinas)} found=${all.length}`);

      if (all.length === 0) return res.json({ questions: [], reason: "no_questions" });

      const statsRows = (
        await query(
          `select question_id,
                  sum(case when not correct then 1 else 0 end)::int as wrong_count,
                  max(answered_at) as last_at,
                  (array_agg(correct order by answered_at desc))[1] as last_correct
             from question_attempts
            where user_id = $1 and disciplina = any($2::text[])
            group by question_id`,
          [req.userId, disciplinas],
        )
      ).rows;
      const stats = new Map<string, any>();
      for (const s of statsRows) stats.set(s.question_id, s);
      const COOLDOWN_MS = 5 * 60 * 60 * 1000;
      const MAX_WRONG_REPEATS = 3;
      const now = Date.now();
      const eligible: { q: any; s: number }[] = [];
      const fallback: { q: any; s: number }[] = [];
      for (const q of all) {
        const st = stats.get(q.id);
        let s = Math.random();
        if (q.source === "seed") s += 1;
        if (!st) { eligible.push({ q, s: s + 2 }); continue; }
        const lastAt = new Date(st.last_at).getTime();
        const cooling = now - lastAt < COOLDOWN_MS;
        const mastered = st.last_correct === true;
        const exhausted = st.wrong_count >= MAX_WRONG_REPEATS;
        if (!cooling && !mastered && !exhausted) eligible.push({ q, s: s + 1.5 });
        else fallback.push({ q, s: -(now - lastAt) });
      }
      eligible.sort((a, b) => b.s - a.s);
      let chosen = eligible.slice(0, cap);
      if (chosen.length < cap) {
        fallback.sort((a, b) => b.s - a.s);
        chosen = chosen.concat(fallback.slice(0, cap - chosen.length));
      }
      return res.json({ questions: chosen.map(({ q }) => shuffleOptions(q)) });
    } catch (e: any) {
      console.error("[content/questions plano]", e?.message, e?.stack?.split("\n")[1]);
      return res.status(500).json({ error: "server_error", detail: e?.message });
    }
  }

  // Virtual "interesses" category: serve questions filtered by the user's
  // selected discipline interests, across all real categories. Requires any paid plan.
  if (concursoId === "interesses") {
    const anyPlan = await query(
      `select 1 from category_access where user_id = $1 and (expires_at is null or expires_at > now()) limit 1`,
      [req.userId],
    );
    if (!anyPlan.rows[0]) return res.status(403).json({ error: "Forbidden" });

    const profile = await one<{ interesses: string[] }>(
      "select interesses from profiles where id = $1",
      [req.userId],
    );
    const disciplinasRaw = profile?.interesses ?? [];
    if (disciplinasRaw.length === 0) return res.json({ questions: [] });
    // Expand slugs to also match readable names stored in older questions
    const disciplinas = expandInterestSlugs(disciplinasRaw);

    const placeholders = disciplinas.map((_: string, i: number) => `$${i + 2}`).join(",");
    all = (
      await query(
        `select id, disciplina, enunciado, opcoes, correta, comentario, source
           from questions
          where disciplina in (${placeholders}) and active`,
        [req.userId, ...disciplinas],
      )
    ).rows;
    if (all.length === 0) return res.json({ questions: [] });

    const statsRows = (
      await query(
        `select question_id,
                sum(case when not correct then 1 else 0 end)::int as wrong_count,
                max(answered_at) as last_at,
                (array_agg(correct order by answered_at desc))[1] as last_correct
           from question_attempts
          where user_id = $1 and disciplina = any($2::text[])
          group by question_id`,
        [req.userId, disciplinas],
      )
    ).rows;
    const stats = new Map<string, any>();
    for (const s of statsRows) stats.set(s.question_id, s);
    const COOLDOWN_MS = 5 * 60 * 60 * 1000;
    const MAX_WRONG_REPEATS = 3;
    const now = Date.now();
    const eligible: { q: any; s: number }[] = [];
    const fallback: { q: any; s: number }[] = [];
    for (const q of all) {
      const st = stats.get(q.id);
      let s = Math.random();
      if (q.source === "seed") s += 1;
      if (!st) { eligible.push({ q, s: s + 2 }); continue; }
      const lastAt = new Date(st.last_at).getTime();
      const cooling = now - lastAt < COOLDOWN_MS;
      const mastered = st.last_correct === true;
      const exhausted = st.wrong_count >= MAX_WRONG_REPEATS;
      if (!cooling && !mastered && !exhausted) eligible.push({ q, s: s + 1.5 });
      else fallback.push({ q, s: -(now - lastAt) });
    }
    eligible.sort((a, b) => b.s - a.s);
    let chosen = eligible.slice(0, cap);
    if (chosen.length < cap) {
      fallback.sort((a, b) => b.s - a.s);
      chosen = chosen.concat(fallback.slice(0, cap - chosen.length));
    }
    return res.json({ questions: chosen.map(({ q }) => shuffleOptions(q)) });
  }

  if (!(await hasCategoryAccess(req.userId!, concursoId, categoriaId)))
    return res.status(403).json({ error: "Forbidden" });

  all = (
    await query(
      `select id, disciplina, enunciado, opcoes, correta, comentario, source
         from questions
        where concurso_id = $1 and categoria_id = $2 and active`,
      [concursoId, categoriaId],
    )
  ).rows;
  if (all.length === 0) return res.json({ questions: [] });

  // The user's history per question → drives spaced repetition.
  const statsRows = (
    await query(
      `select question_id,
              sum(case when not correct then 1 else 0 end)::int as wrong_count,
              max(answered_at) as last_at,
              (array_agg(correct order by answered_at desc))[1] as last_correct
         from question_attempts
        where user_id = $1 and concurso_id = $2 and categoria_id = $3
        group by question_id`,
      [req.userId, concursoId, categoriaId],
    )
  ).rows;
  const stats = new Map<string, any>();
  for (const s of statsRows) stats.set(s.question_id, s);

  // Spaced-repetition rules:
  //  - unseen questions → top priority.
  //  - a question is on a 5h cooldown after each attempt (no quick repeats).
  //  - answered correctly (mastered) → not repeated.
  //  - answered wrong → reappears (after 5h) up to 3 wrong attempts, then never.
  //  - real-exam (seed) questions are weighted higher than AI ones.
  const COOLDOWN_MS = 5 * 60 * 60 * 1000;
  const MAX_WRONG_REPEATS = 3;
  const now = Date.now();
  const eligible: { q: any; s: number }[] = [];
  const fallback: { q: any; s: number }[] = [];

  for (const q of all) {
    const st = stats.get(q.id);
    let s = Math.random();
    if (q.source === "seed") s += 1;
    if (!st) {
      eligible.push({ q, s: s + 2 }); // unseen
      continue;
    }
    const lastAt = new Date(st.last_at).getTime();
    const cooling = now - lastAt < COOLDOWN_MS;
    const mastered = st.last_correct === true;
    const exhausted = st.wrong_count >= MAX_WRONG_REPEATS;
    if (!cooling && !mastered && !exhausted) {
      eligible.push({ q, s: s + 1.5 }); // wrong, retryable, cooldown passed
    } else {
      fallback.push({ q, s: -(now - lastAt) }); // not eligible now; oldest first
    }
  }

  eligible.sort((a, b) => b.s - a.s);
  let chosen = eligible.slice(0, cap);
  if (chosen.length < cap) {
    // Not enough eligible (rare once the bank is large) → top up so the quiz
    // is never empty, oldest-seen first.
    fallback.sort((a, b) => b.s - a.s);
    chosen = chosen.concat(fallback.slice(0, cap - chosen.length));
  }

  const questions = chosen.map(({ q }) => shuffleOptions(q));
  res.json({ questions });
});
