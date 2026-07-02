import { Router } from "express";
import { one, pool, query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

// ---- Simulado Nacional --------------------------------------------------
// Evento cronometrado: todos os inscritos respondem ao MESMO conjunto de
// questões (congelado na criação) dentro da janela starts_at..ends_at.
// Inscrição pode custar moedas; os melhores ganham prémios em moedas.
// A finalização (atribuir prémios) é lazy: o primeiro pedido de ranking
// depois do fim processa, com advisory lock por exame.

export const examsRouter = Router();

const GRACE_MS = 30_000; // tolerância de rede no submit

type Exam = {
  id: string;
  title: string;
  description: string | null;
  question_ids: string[];
  question_count: number;
  duration_minutes: number;
  entry_cost_moedas: number;
  prize_moedas: number[];
  starts_at: string;
  ends_at: string;
  finalized: boolean;
};

const examPublic = (e: any, extra: any = {}) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  question_count: e.question_count,
  duration_minutes: e.duration_minutes,
  entry_cost_moedas: e.entry_cost_moedas,
  prize_moedas: e.prize_moedas,
  starts_at: e.starts_at,
  ends_at: e.ends_at,
  finalized: e.finalized,
  ...extra,
});

// Award prizes to the podium once the window closes. Idempotent via the
// finalized flag + per-exam advisory lock.
async function finalizeExam(examId: string) {
  const client = await pool.connect();
  try {
    const lock = await client.query(
      "select pg_try_advisory_lock(hashtext($1)) as ok",
      [`exam:${examId}`],
    );
    if (!lock.rows[0]?.ok) return;
    const exam = (
      await client.query(
        "select * from national_exams where id = $1 and finalized = false and ends_at <= now()",
        [examId],
      )
    ).rows[0];
    if (!exam) return;

    const prizes: number[] = Array.isArray(exam.prize_moedas) ? exam.prize_moedas : [];
    const podium = (
      await client.query(
        `select user_id, score from national_exam_entries
          where exam_id = $1 and finished_at is not null and score > 0
          order by score desc, duration_ms asc nulls last, finished_at asc
          limit $2`,
        [examId, prizes.length],
      )
    ).rows;

    for (let i = 0; i < podium.length; i++) {
      const amount = Number(prizes[i]) || 0;
      if (amount <= 0) continue;
      const uid = podium[i].user_id;
      await client.query(
        "update profiles set moedas = moedas + $2, updated_at = now() where id = $1",
        [uid, amount],
      );
      await client.query(
        `insert into coin_transactions (user_id, tipo, amount, descricao, meta)
         values ($1,'exam_prize',$2,$3,$4)`,
        [uid, amount, `Prémio ${i + 1}.º lugar — ${exam.title}`, JSON.stringify({ exam_id: examId })],
      );
      await client.query(
        "insert into notifications (user_id, title, body) values ($1,$2,$3)",
        [
          uid,
          `🏆 ${i + 1}.º lugar no ${exam.title}!`,
          `Parabéns! Ficaste em ${i + 1}.º lugar com ${podium[i].score} acertos e ganhaste ${amount} moedas.`,
        ],
      );
    }
    await client.query("update national_exams set finalized = true where id = $1", [examId]);
  } finally {
    try { await client.query("select pg_advisory_unlock(hashtext($1))", [`exam:${examId}`]); } catch {}
    client.release();
  }
}

// List: open/upcoming exams + recent past ones, with my entry state.
examsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const rows = (
      await query(
        `select e.*,
                (select count(*)::int from national_exam_entries en where en.exam_id = e.id) as participants,
                me.joined_at as my_joined, me.started_at as my_started,
                me.finished_at as my_finished, me.score as my_score, me.total as my_total
           from national_exams e
           left join national_exam_entries me on me.exam_id = e.id and me.user_id = $1
          where e.ends_at > now() - interval '30 days'
          order by (e.ends_at > now()) desc, e.starts_at asc
          limit 12`,
        [req.userId],
      )
    ).rows;
    res.json(
      rows.map((e: any) =>
        examPublic(e, {
          participants: e.participants,
          my_entry: e.my_joined
            ? { joined_at: e.my_joined, started_at: e.my_started, finished_at: e.my_finished, score: e.my_score, total: e.my_total }
            : null,
        }),
      ),
    );
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// Join (pays the entry fee in moedas, if any).
examsRouter.post("/:id/join", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const exam = await one<Exam>("select * from national_exams where id = $1", [req.params.id]);
    if (!exam) return res.status(404).json({ error: "not_found" });
    if (new Date(exam.ends_at).getTime() <= Date.now())
      return res.status(400).json({ error: "exam_ended" });

    const existing = await one(
      "select 1 from national_exam_entries where exam_id = $1 and user_id = $2",
      [exam.id, req.userId],
    );
    if (existing) return res.json({ ok: true, already: true });

    const cost = exam.entry_cost_moedas || 0;
    if (cost > 0) {
      const p = await one<{ moedas: number }>(
        "select moedas from profiles where id = $1 for update",
        [req.userId],
      );
      if ((p?.moedas ?? 0) < cost)
        return res.status(400).json({ error: "insufficient_coins" });
      await query(
        "update profiles set moedas = moedas - $2, updated_at = now() where id = $1",
        [req.userId, cost],
      );
      await query(
        `insert into coin_transactions (user_id, tipo, amount, descricao, meta)
         values ($1,'exam_entry',$2,$3,$4)`,
        [req.userId, -cost, `Inscrição — ${exam.title}`, JSON.stringify({ exam_id: exam.id })],
      );
    }
    await query(
      "insert into national_exam_entries (exam_id, user_id) values ($1,$2) on conflict do nothing",
      [exam.id, req.userId],
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// Start (or resume) the timed attempt. Returns the questions WITHOUT answers.
examsRouter.post("/:id/start", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const exam = await one<Exam>("select * from national_exams where id = $1", [req.params.id]);
    if (!exam) return res.status(404).json({ error: "not_found" });
    const now = Date.now();
    if (now < new Date(exam.starts_at).getTime())
      return res.status(400).json({ error: "not_started_yet" });
    if (now >= new Date(exam.ends_at).getTime())
      return res.status(400).json({ error: "exam_ended" });

    const entry = await one<{ started_at: string | null; finished_at: string | null }>(
      "select started_at, finished_at from national_exam_entries where exam_id = $1 and user_id = $2",
      [exam.id, req.userId],
    );
    if (!entry) return res.status(403).json({ error: "not_joined" });
    if (entry.finished_at) return res.status(400).json({ error: "already_finished" });

    const durationMs = exam.duration_minutes * 60_000;
    let startedAt = entry.started_at ? new Date(entry.started_at).getTime() : null;
    if (startedAt && now > startedAt + durationMs)
      return res.status(400).json({ error: "time_over" });
    if (!startedAt) {
      startedAt = now;
      await query(
        "update national_exam_entries set started_at = now() where exam_id = $1 and user_id = $2",
        [exam.id, req.userId],
      );
    }

    const ids: string[] = Array.isArray(exam.question_ids)
      ? exam.question_ids
      : JSON.parse(exam.question_ids as any);
    const qRows = (
      await query(
        `select id, disciplina, enunciado, opcoes from questions where id = any($1::text[])`,
        [ids],
      )
    ).rows;
    // Same order for everyone — fairness over anti-cheat theatre.
    const byId = new Map(qRows.map((q: any) => [q.id, q]));
    const questions = ids.map((id) => byId.get(id)).filter(Boolean);

    const deadline = Math.min(startedAt + durationMs, new Date(exam.ends_at).getTime());
    res.json({
      exam: examPublic(exam),
      questions,
      started_at: new Date(startedAt).toISOString(),
      deadline: new Date(deadline).toISOString(),
      remaining_ms: Math.max(0, deadline - now),
    });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// Submit answers — graded server-side against the frozen question set.
examsRouter.post("/:id/submit", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const exam = await one<Exam>("select * from national_exams where id = $1", [req.params.id]);
    if (!exam) return res.status(404).json({ error: "not_found" });

    const entry = await one<{ started_at: string | null; finished_at: string | null }>(
      "select started_at, finished_at from national_exam_entries where exam_id = $1 and user_id = $2",
      [exam.id, req.userId],
    );
    if (!entry?.started_at) return res.status(400).json({ error: "not_started" });
    if (entry.finished_at) return res.status(400).json({ error: "already_finished" });

    const now = Date.now();
    const startedAt = new Date(entry.started_at).getTime();
    const deadline = Math.min(
      startedAt + exam.duration_minutes * 60_000,
      new Date(exam.ends_at).getTime(),
    );
    if (now > deadline + GRACE_MS) return res.status(400).json({ error: "time_over" });

    const answers: Record<string, number> =
      req.body?.answers && typeof req.body.answers === "object" ? req.body.answers : {};

    const ids: string[] = Array.isArray(exam.question_ids)
      ? exam.question_ids
      : JSON.parse(exam.question_ids as any);
    const qRows = (
      await query(
        `select id, correta, comentario, disciplina from questions where id = any($1::text[])`,
        [ids],
      )
    ).rows;

    let score = 0;
    const review: any[] = [];
    for (const q of qRows) {
      const sel = Number.isInteger(answers[q.id]) ? answers[q.id] : -1;
      const correct = sel === q.correta;
      if (correct) score++;
      review.push({ id: q.id, correta: q.correta, selected: sel, comentario: q.comentario });
    }
    const total = ids.length;
    const durationMs = now - startedAt;

    await query(
      `update national_exam_entries
          set finished_at = now(), score = $3, total = $4, duration_ms = $5, answers = $6
        where exam_id = $1 and user_id = $2`,
      [exam.id, req.userId, score, total, durationMs, JSON.stringify(answers)],
    );

    // Score converts into pontos (counts for the weekly league too).
    const pontos = Math.min(score, 100);
    if (pontos > 0) {
      await query(
        "update profiles set pontos = pontos + $2, pontos_globais = pontos_globais + $2, updated_at = now() where id = $1",
        [req.userId, pontos],
      );
      await query("insert into points_log (user_id, delta) values ($1,$2)", [req.userId, pontos]);
    }

    // Feed the learning signal (mode 'exame' so it never trips the free-tier
    // daily simulado flag) — best effort.
    try {
      const params: any[] = [];
      const tuples = qRows
        .map((q: any) => {
          const sel = Number.isInteger(answers[q.id]) ? answers[q.id] : -1;
          params.push(req.userId, q.id, "exame-nacional", "exame-nacional", q.disciplina, sel === q.correta, sel, "exame");
          const n = params.length;
          return `($${n - 7},$${n - 6},$${n - 5},$${n - 4},$${n - 3},$${n - 2},$${n - 1},$${n})`;
        })
        .join(",");
      if (tuples) {
        await query(
          `insert into question_attempts (user_id, question_id, concurso_id, categoria_id, disciplina, correct, selected, mode)
           values ${tuples}`,
          params,
        );
      }
    } catch {}

    res.json({ ok: true, score, total, duration_ms: durationMs, pontos, review });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});

// Standings. Visible once YOU finished (live) or after the exam window closes.
examsRouter.get("/:id/ranking", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const exam = await one<Exam>("select * from national_exams where id = $1", [req.params.id]);
    if (!exam) return res.status(404).json({ error: "not_found" });

    const ended = Date.now() >= new Date(exam.ends_at).getTime();
    if (ended && !exam.finalized) await finalizeExam(exam.id);

    const mine = await one(
      "select joined_at, started_at, finished_at, score, total, duration_ms from national_exam_entries where exam_id = $1 and user_id = $2",
      [exam.id, req.userId],
    );
    if (!ended && !mine?.finished_at)
      return res.json({ exam: examPublic(exam, { ended }), my_entry: mine ?? null, standings: null });

    const rows = (
      await query(
        `select p.id, p.nome, p.avatar_url, en.score, en.total, en.duration_ms
           from national_exam_entries en
           join profiles p on p.id = en.user_id
          where en.exam_id = $1 and en.finished_at is not null
          order by en.score desc, en.duration_ms asc nulls last, en.finished_at asc
          limit 100`,
        [exam.id],
      )
    ).rows;
    res.json({ exam: examPublic(exam, { ended }), my_entry: mine ?? null, standings: rows });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", detail: e?.message });
  }
});
