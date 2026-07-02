import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { quizService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BadgeCheck, ChevronRight, Landmark, Layers, Search } from "lucide-react";

// Acentos rotativos para os cartões (mesma paleta das ações rápidas da Home).
const ACCENTS = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

const Concursos = () => {
  const { profile } = useAuth();
  const [q, setQ] = useState("");
  const concursos = quizService.getConcursos();

  const lista = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return concursos;
    return concursos.filter(
      (c) =>
        c.nome.toLowerCase().includes(s) ||
        c.sigla.toLowerCase().includes(s) ||
        c.area.toLowerCase().includes(s) ||
        c.categorias.some((cat) => cat.nome.toLowerCase().includes(s))
    );
  }, [q]);

  const totalCategorias = concursos.reduce((s, c) => s + c.categorias.length, 0);

  return (
    <AppShell>
      <Seo
        title="Concursos Públicos de Saúde Abertos em Angola"
        description="Explore os concursos públicos da saúde disponíveis em Angola e escolha um para iniciar seus simulados comentados."
        path="/concursos"
      />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">Explorar</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold">Concursos Públicos</h1>
          <p className="mt-1 text-sm opacity-80">
            {concursos.length} concursos · {totalCategorias} categorias profissionais
          </p>

          {/* Pesquisa integrada no hero */}
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar concurso, sigla ou categoria…"
              className="w-full rounded-2xl border-0 bg-white py-3 pl-11 pr-4 text-sm font-medium text-foreground shadow-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
      </div>

      {/* ── LISTA ────────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {lista.map((c, i) => {
          const isMeu = profile?.concurso_id === c.id;
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <Link key={c.id} to={`/concursos/${c.id}`} className="block">
              <Card className="group flex items-center gap-3 border-border/60 p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.98]">
                <span className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-xs font-bold transition-transform group-hover:scale-110",
                  accent,
                )}>
                  {c.sigla.slice(0, 4)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold leading-tight">{c.nome}</p>
                    {isMeu && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        <BadgeCheck className="h-3 w-3" /> O teu
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground leading-tight">
                    <span className="inline-flex items-center gap-1"><Landmark className="h-3 w-3" />{c.area}</span>
                    <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" />{c.categorias.length} categorias</span>
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Card>
            </Link>
          );
        })}

        {lista.length === 0 && (
          <Card className="flex flex-col items-center gap-3 border-dashed border-border/60 bg-muted/20 p-8 text-center shadow-none">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold">Nenhum concurso encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Não há resultados para "{q}". Tenta outra pesquisa.
              </p>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default Concursos;
