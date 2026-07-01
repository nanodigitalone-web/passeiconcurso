import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { quizService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Lock, Check, Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Corpos celestes (trilha infinita) ──────────────────────────────────────────
// Cada nível corresponde a um planeta/estrela/galáxia.
// Quando acabar a lista, volta a percorrer com "+1 ciclo".
type CelestialBody = {
  nome: string;
  icone: string;
  cor: string;          // hex
  brilho: string;       // cor da sombra/glow
  sistema: string;
};

const CORPOS: CelestialBody[] = [
  // ── Sistema Solar ──
  { nome: "Terra",          icone: "🌍", cor: "#22c55e", brilho: "#16a34a", sistema: "Sistema Solar"   },
  { nome: "Lua",            icone: "🌙", cor: "#94a3b8", brilho: "#64748b", sistema: "Sistema Solar"   },
  { nome: "Marte",          icone: "🔴", cor: "#ef4444", brilho: "#b91c1c", sistema: "Sistema Solar"   },
  { nome: "Mercúrio",       icone: "🪨", cor: "#a8a29e", brilho: "#78716c", sistema: "Sistema Solar"   },
  { nome: "Vénus",          icone: "🌟", cor: "#fbbf24", brilho: "#d97706", sistema: "Sistema Solar"   },
  { nome: "Júpiter",        icone: "🪐", cor: "#f97316", brilho: "#c2410c", sistema: "Sistema Solar"   },
  { nome: "Saturno",        icone: "💛", cor: "#eab308", brilho: "#a16207", sistema: "Sistema Solar"   },
  { nome: "Úrano",          icone: "🩵", cor: "#22d3ee", brilho: "#0891b2", sistema: "Sistema Solar"   },
  { nome: "Neptuno",        icone: "💙", cor: "#6366f1", brilho: "#4338ca", sistema: "Sistema Solar"   },
  { nome: "Plutão",         icone: "⚫", cor: "#6b7280", brilho: "#374151", sistema: "Sistema Solar"   },
  // ── Alpha Centauri ──
  { nome: "Próxima Cen.",   icone: "🔺", cor: "#f43f5e", brilho: "#be123c", sistema: "Alpha Centauri" },
  { nome: "Alpha Cen A",    icone: "☀️", cor: "#fde047", brilho: "#ca8a04", sistema: "Alpha Centauri" },
  { nome: "Alpha Cen B",    icone: "🌠", cor: "#fb923c", brilho: "#ea580c", sistema: "Alpha Centauri" },
  // ── Via Láctea ──
  { nome: "Neb. Órion",     icone: "🌌", cor: "#a855f7", brilho: "#7e22ce", sistema: "Via Láctea"     },
  { nome: "Sagitário A*",   icone: "🕳️", cor: "#334155", brilho: "#0f172a", sistema: "Via Láctea"     },
  { nome: "Cisne X-1",      icone: "✴️", cor: "#0ea5e9", brilho: "#0369a1", sistema: "Via Láctea"     },
  { nome: "Eta Carinae",    icone: "💥", cor: "#fde68a", brilho: "#b45309", sistema: "Via Láctea"     },
  { nome: "Sirius B",       icone: "⬜", cor: "#e0f2fe", brilho: "#7dd3fc", sistema: "Via Láctea"     },
  // ── Outras Galáxias ──
  { nome: "Andrómeda",      icone: "🌀", cor: "#8b5cf6", brilho: "#5b21b6", sistema: "Galáxias"       },
  { nome: "Triângulo M33",  icone: "🔮", cor: "#ec4899", brilho: "#9d174d", sistema: "Galáxias"       },
  { nome: "Gr. Nuvem Mag.", icone: "🌟", cor: "#06b6d4", brilho: "#0e7490", sistema: "Galáxias"       },
  { nome: "NGC 1300",       icone: "🌐", cor: "#d946ef", brilho: "#a21caf", sistema: "Galáxias"       },
  // ── Universo Observável ──
  { nome: "Quasar 3C 273",  icone: "⚡", cor: "#f0abfc", brilho: "#a21caf", sistema: "Universo"       },
  { nome: "Big Bang",       icone: "♾️", cor: "#f9fafb", brilho: "#e2e8f0", sistema: "Universo"       },
];

const getCorpo = (lvl: number): CelestialBody =>
  CORPOS[(lvl - 1) % CORPOS.length];

const getCiclo = (lvl: number): number =>
  Math.floor((lvl - 1) / CORPOS.length) + 1;

// Estrelas de fundo geradas aleatoriamente (seed fixo para não piscar)
const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: ((i * 137.5) % 100),
  y: ((i * 79.3) % 100),
  s: 1 + (i % 3) * 0.7,
  o: 0.3 + (i % 5) * 0.12,
}));

// Zig-zag pattern (offset em px)
const zigzag = (i: number) => [0, 48, 72, 48, 0, -48, -72, -48][i % 8];

// ── Componente principal ────────────────────────────────────────────────────
const Aprender = () => {
  const { profile } = useAuth();
  const interessesAtivo = !!profile?.interesses_ativo && (profile?.interesses?.length ?? 0) > 0;
  const concursoId  = interessesAtivo ? "interesses" : profile?.concurso_id ?? null;
  const categoriaId = interessesAtivo ? "interesses" : profile?.categoria_id ?? null;
  const cat         = !interessesAtivo && concursoId && categoriaId ? quizService.getCategoria(concursoId, categoriaId) : null;
  const hasTrilha   = interessesAtivo || !!cat;

  const pontos  = profile?.pontos_globais ?? profile?.pontos ?? 0;
  const streak  = profile?.streak ?? 0;

  const [info, setInfo] = useState<{ level: number; doneInLevel: number; perLevel: number } | null>(null);

  useEffect(() => {
    if (!concursoId || !categoriaId) return;
    quizService.getAprenderLevel(concursoId, categoriaId).then(setInfo);
  }, [concursoId, categoriaId]);

  const level      = info?.level ?? 1;
  const perLevel   = info?.perLevel ?? 300;
  const doneInLevel = info?.doneInLevel ?? 0;
  const progressPct = Math.min(100, Math.round((doneInLevel / perLevel) * 100));

  const corpo   = getCorpo(level);
  const ciclo   = getCiclo(level);

  // Janela: 2 passados + actual + 9 futuros
  const start   = Math.max(1, level - 2);
  const levels  = Array.from({ length: 12 }, (_, i) => start + i);

  return (
    <AppShell>
      <Seo
        title="Aprender · Trilha Cósmica"
        description="Sobe de nível estudando — viaja pelo sistema solar e além."
        path="/aprender"
      />

      {/* ── Header: planeta actual ─────────────────────────────────────────── */}
      {hasTrilha && (
        <div
          className="relative mb-4 overflow-hidden rounded-3xl p-5 text-white shadow-elegant animate-fade-in"
          style={{
            background: `radial-gradient(ellipse at 70% 40%, ${corpo.brilho}80 0%, #0f0f1a 70%)`,
          }}
        >
          {/* Stars */}
          {STARS.slice(0, 20).map((s, i) => (
            <div
              key={i}
              className="pointer-events-none absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }}
            />
          ))}

          <div className="relative flex items-center justify-between gap-4">
            {/* Planeta e nível */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg animate-float"
                style={{ background: `radial-gradient(circle at 35% 35%, ${corpo.cor}cc, ${corpo.brilho})`, boxShadow: `0 0 20px ${corpo.cor}66` }}
              >
                {corpo.icone}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-60">{corpo.sistema}{ciclo > 1 ? ` · Ciclo ${ciclo}` : ""}</p>
                <p className="font-display text-xl font-bold leading-tight">{corpo.nome}</p>
                <p className="text-xs opacity-70">Nível {level}</p>
              </div>
            </div>

            {/* Streak + pontos */}
            <div className="flex flex-col items-end gap-2">
              {streak > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="font-display text-sm font-bold">{streak}</span>
                </div>
              )}
              <div className="text-right">
                <p className="font-display text-lg font-bold leading-none">{pontos.toLocaleString("pt-PT")}</p>
                <p className="text-[10px] opacity-60 uppercase tracking-wide">pontos</p>
              </div>
            </div>
          </div>

          {/* Barra de progresso no nível */}
          <div className="relative mt-4">
            <div className="mb-1 flex items-center justify-between text-xs opacity-80">
              <span>Progresso no nível</span>
              <span className="font-semibold">{doneInLevel}/{perLevel}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${corpo.cor}, ${corpo.brilho})` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Sem categoria: CTA ────────────────────────────────────────────── */}
      {!hasTrilha && (
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-border p-10 text-center">
          <p className="text-4xl">🚀</p>
          <p className="font-display text-lg font-semibold">Escolhe o teu destino</p>
          <p className="text-sm text-muted-foreground">Define a tua categoria para começar a viajar pelo cosmos do conhecimento.</p>
          <Button asChild className="rounded-full bg-gradient-primary">
            <Link to="/concursos">Escolher categoria</Link>
          </Button>
        </div>
      )}

      {/* ── Trilha cósmica ────────────────────────────────────────────────── */}
      {hasTrilha && (
        <div className="relative overflow-hidden rounded-3xl" style={{ background: "linear-gradient(to bottom, #0a0a1a, #0f0f2a, #0a0a1a)" }}>

          {/* Estrelas de fundo */}
          <div className="pointer-events-none absolute inset-0">
            {STARS.map((s, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }}
              />
            ))}
          </div>

          {/* Fade no topo — dissolve no cosmos */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-24"
            style={{ background: "linear-gradient(to bottom, #0a0a1a, transparent)" }}
          />
          {/* Fade em baixo — infinito */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40"
            style={{ background: "linear-gradient(to top, #0a0a1a, transparent)" }}
          />

          {/* Label sistema */}
          <div className="relative z-20 pt-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60 backdrop-blur-sm">
              {corpo.sistema}
              {ciclo > 1 && <span className="opacity-50">· Ciclo {ciclo}</span>}
            </span>
          </div>

          {/* Nós da trilha */}
          <ul className="relative z-20 mx-auto flex max-w-xs flex-col items-center gap-4 py-6 pb-24">
            {levels.map((lvl, i) => {
              const done    = lvl < level;
              const current = lvl === level;
              const locked  = lvl > level;
              const corpo   = getCorpo(lvl);
              const offset  = zigzag(i);
              // Últimos 3 (mais futuros) ficam cada vez mais esbatidos
              const futureIdx = lvl - level;
              const opacity   = locked ? Math.max(0.15, 1 - futureIdx * 0.18) : 1;

              return (
                <li
                  key={lvl}
                  className="flex w-full flex-col items-center"
                  style={{ transform: `translateX(${offset}px)`, opacity }}
                >
                  {/* Linha de conexão acima (excepto no primeiro) */}
                  {i > 0 && (
                    <div
                      className="mb-1 h-4 w-0.5 rounded-full"
                      style={{ background: done || current ? `${corpo.cor}60` : "rgba(255,255,255,0.08)" }}
                    />
                  )}

                  {/* Nó */}
                  {done || current ? (
                    <Link
                      to={`/aprender/sessao/${concursoId}/${categoriaId}`}
                      className="group flex flex-col items-center"
                    >
                      <div
                        className={cn(
                          "relative flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl transition-transform group-active:scale-95",
                          current && "animate-float",
                        )}
                        style={{
                          background: done
                            ? `radial-gradient(circle at 35% 35%, ${corpo.cor}bb, ${corpo.brilho})`
                            : `radial-gradient(circle at 35% 35%, ${corpo.cor}, ${corpo.brilho})`,
                          boxShadow: current
                            ? `0 0 0 4px ${corpo.cor}40, 0 0 24px ${corpo.cor}80, 0 6px 0 ${corpo.brilho}`
                            : `0 0 12px ${corpo.cor}40, 0 6px 0 ${corpo.brilho}`,
                        }}
                      >
                        {/* Emoji do planeta */}
                        <span className="select-none text-3xl leading-none">{corpo.icone}</span>

                        {/* Overlay check nos completados */}
                        {done && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                            <Check className="h-8 w-8 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Badge: nome + nível */}
                      <div className="mt-2 text-center">
                        {current && (
                          <div
                            className="mb-1 rounded-xl border px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg"
                            style={{ borderColor: `${corpo.cor}60`, background: `${corpo.cor}20` }}
                          >
                            <Play className="mr-1 inline h-3 w-3 fill-current" />
                            Jogar
                          </div>
                        )}
                        <p className={cn("text-xs font-semibold", done ? "text-white/50" : "text-white/90")}>
                          {corpo.nome}
                        </p>
                        <p className="text-[10px] text-white/40">Nível {lvl}</p>
                      </div>
                    </Link>
                  ) : (
                    /* Bloqueado */
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.08)" }}
                      >
                        <span className="select-none grayscale opacity-40">{corpo.icone}</span>
                      </div>
                      <div className="mt-2 text-center">
                        <Lock className="mx-auto h-3 w-3 text-white/20" />
                        <p className="mt-0.5 text-[10px] text-white/25">{corpo.nome}</p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}

            {/* Indicador infinito — cosmos sem fim */}
            <li className="flex flex-col items-center gap-3 pt-2 opacity-30">
              <div className="h-8 w-0.5 rounded-full bg-white/20" />
              <div className="flex gap-1.5">
                {[1, 2, 3].map((d) => (
                  <div
                    key={d}
                    className="h-2 w-2 rounded-full bg-white animate-pulse"
                    style={{ animationDelay: `${d * 0.3}s` }}
                  />
                ))}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Infinito</p>
            </li>
          </ul>
        </div>
      )}

      {/* ── Legenda dos sistemas ──────────────────────────────────────────── */}
      {hasTrilha && (
        <div className="mt-4 mb-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sistemas desbloqueáveis</p>
          <div className="flex flex-wrap gap-2">
            {["Sistema Solar", "Alpha Centauri", "Via Láctea", "Galáxias", "Universo"].map((sis, i) => {
              const firstIdx = CORPOS.findIndex((c) => c.sistema === sis);
              const firstLvl = firstIdx + 1;
              const unlocked = level >= firstLvl;
              return (
                <div
                  key={sis}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    unlocked
                      ? "border-primary/30 bg-primary/5 text-foreground"
                      : "border-border/40 bg-muted/30 text-muted-foreground",
                  )}
                >
                  <span>{["🌍", "✨", "🌌", "🌀", "♾️"][i]}</span>
                  {sis}
                  {!unlocked && <span className="text-[10px] opacity-50">· Nível {firstLvl}+</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Aprender;
