// generateQuestions — drafts multiple-choice questions for a given
// concurso/categoria/disciplina, validates them, dedups against the bank, and
// inserts them into `questions` (source='ai', auto-published).
//
// Provider priority: Anthropic Claude Haiku (ANTHROPIC_API_KEY) → Gemini (GEMINI_API_KEY).
import { randomUUID } from "node:crypto";
import { query } from "./db.js";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export const aiEnabled = () => !!(ANTHROPIC_KEY || GEMINI_KEY);

async function callModel(system: string, prompt: string): Promise<string> {
  // Anthropic first (Claude Haiku — fastest and cheapest).
  if (ANTHROPIC_KEY) {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
    const r = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    return r.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
  }
  // Gemini fallback.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4000, temperature: 0.9, responseMimeType: "application/json" },
    }),
  });
  if (!resp.ok) throw new Error(`gemini_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data: any = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") ?? "";
}

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
  disciplina: string;       // stored in DB (may be a slug for interest-based questions)
  disciplinaNome?: string;  // human-readable name used in the AI prompt (defaults to disciplina)
  count: number;
}): Promise<{ requested: number; valid: number; inserted: number }> {
  if (!aiEnabled()) throw new Error("ai_not_configured");
  const count = Math.min(Math.max(1, Math.trunc(opts.count) || 1), 20);
  const nomeParaPrompt = opts.disciplinaNome ?? opts.disciplina;

  const system =
    "És um especialista em concursos e exames académicos em Angola. " +
    "Geras questões de escolha múltipla rigorosas, corretas e sem ambiguidade, " +
    "em português de Angola. Responde APENAS com JSON válido, sem texto à volta.";

  const prompt =
    `Gera ${count} questões de escolha múltipla sobre "${nomeParaPrompt}".\n` +
    `Regras: cada questão tem exatamente 4 opções, apenas 1 correta, e um comentário curto que explica a resposta. Varia a posição da resposta correta.\n` +
    `Formato (array JSON, nada mais):\n` +
    `[{"enunciado":"...","opcoes":["...","...","...","..."],"correta":0,"comentario":"..."}]`;

  const text = await callModel(system, prompt);

  let arr: unknown;
  try {
    arr = extractJsonArray(text);
  } catch {
    throw new Error("bad_model_json");
  }
  if (!Array.isArray(arr)) throw new Error("not_an_array");

  const existing = new Set(
    (
      await query(
        "select lower(trim(enunciado)) e from questions where disciplina=$1",
        [opts.disciplina],
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
      comentario: typeof raw.comentario === "string" ? raw.comentario.trim() : (null as any),
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
