// generateQuestions — uses Claude Haiku to draft multiple-choice questions for
// a given concurso/categoria/disciplina, validates them, dedups against the
// existing bank, and inserts them into `questions` (source='ai', auto-published).
//
// Reads ANTHROPIC_API_KEY from the environment (never hardcode it). When the key
// is absent the feature is disabled and the route returns 501.
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { query } from "./db.js";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export const aiEnabled = () => client !== null;

// Strip ```json … ``` fences and grab the outermost JSON array if the model
// wrapped it in prose.
function extractJsonArray(text: string): any {
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

type Draft = { enunciado: string; opcoes: string[]; correta: number; comentario?: string };

export async function generateQuestions(opts: {
  concursoId: string;
  categoriaId: string;
  disciplina: string;
  count: number;
}): Promise<{ requested: number; valid: number; inserted: number }> {
  if (!client) throw new Error("anthropic_not_configured");
  const count = Math.min(Math.max(1, Math.trunc(opts.count) || 1), 20);

  const system =
    "És um especialista em concursos públicos da saúde em Angola. " +
    "Geras questões de escolha múltipla rigorosas, corretas e sem ambiguidade, " +
    "em português de Angola. Responde APENAS com JSON válido, sem texto à volta.";

  const prompt =
    `Gera ${count} questões de escolha múltipla sobre a disciplina "${opts.disciplina}" ` +
    `(concurso "${opts.concursoId}", categoria "${opts.categoriaId}").\n` +
    `Regras: cada questão tem exatamente 4 opções, apenas 1 correta, e um comentário curto que explica a resposta.\n` +
    `Formato (array JSON, nada mais):\n` +
    `[{"enunciado":"...","opcoes":["...","...","...","..."],"correta":0,"comentario":"..."}]`;

  const resp = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let arr: unknown;
  try {
    arr = extractJsonArray(text);
  } catch {
    throw new Error("bad_model_json");
  }
  if (!Array.isArray(arr)) throw new Error("not_an_array");

  // Dedup against existing questions in this categoria (by normalized enunciado).
  const existing = new Set(
    (
      await query(
        "select lower(trim(enunciado)) e from questions where concurso_id=$1 and categoria_id=$2",
        [opts.concursoId, opts.categoriaId],
      )
    ).rows.map((r: any) => r.e),
  );

  const valid: Draft[] = [];
  for (const raw of arr as any[]) {
    if (!raw || typeof raw.enunciado !== "string" || !raw.enunciado.trim()) continue;
    if (!Array.isArray(raw.opcoes) || raw.opcoes.length < 2) continue;
    if (!raw.opcoes.every((o: any) => typeof o === "string" && o.trim())) continue;
    if (!Number.isInteger(raw.correta) || raw.correta < 0 || raw.correta >= raw.opcoes.length)
      continue;
    const key = raw.enunciado.toLowerCase().trim();
    if (existing.has(key)) continue;
    existing.add(key);
    valid.push({
      enunciado: raw.enunciado.trim(),
      opcoes: raw.opcoes.map((o: string) => o.trim()),
      correta: raw.correta,
      comentario: typeof raw.comentario === "string" ? raw.comentario.trim() : null as any,
    });
  }

  let inserted = 0;
  for (const q of valid) {
    const id = "ai-" + randomUUID().slice(0, 12);
    const res = await query(
      `insert into questions
         (id, concurso_id, categoria_id, disciplina, enunciado, opcoes, correta, comentario, source)
       values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'ai')
       on conflict (id) do nothing`,
      [
        id,
        opts.concursoId,
        opts.categoriaId,
        opts.disciplina,
        q.enunciado,
        JSON.stringify(q.opcoes),
        q.correta,
        q.comentario ?? null,
      ],
    );
    inserted += res.rowCount ?? 0;
  }

  return { requested: count, valid: valid.length, inserted };
}
