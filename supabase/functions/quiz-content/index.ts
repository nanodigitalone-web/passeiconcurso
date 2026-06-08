import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import bank from "../_shared/quiz-bank.json" with { type: "json" };

type Question = { id: string; correta: number; comentario: string };
type Categoria = { id: string; questoes: Question[] };
type Concurso = { id: string; categorias: Categoria[] };

const concursos = bank as unknown as Concurso[];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claims.claims.sub as string;

    const { concursoId, categoriaId } = await req.json().catch(() => ({}));
    if (!concursoId || !categoriaId) {
      return json({ error: "Missing concursoId or categoriaId" }, 400);
    }

    // Server-side access check — the single source of truth for content gating.
    const { data: allowed, error: accessError } = await supabase.rpc(
      "has_category_access",
      { _user: userId, _conc: concursoId, _cat: categoriaId },
    );
    if (accessError) {
      console.error("has_category_access error", accessError);
      return json({ error: "Access check failed" }, 500);
    }
    if (!allowed) {
      return json({ error: "Forbidden" }, 403);
    }

    const categoria = concursos
      .find((c) => c.id === concursoId)
      ?.categorias.find((cat) => cat.id === categoriaId);

    if (!categoria) {
      return json({ error: "Not found" }, 404);
    }

    const questions = categoria.questoes.map((q) => ({
      id: q.id,
      correta: q.correta,
      comentario: q.comentario,
    }));

    return json({ questions });
  } catch (e) {
    console.error("quiz-content error", e);
    return json({ error: "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
