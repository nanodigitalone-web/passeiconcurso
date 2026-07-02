import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { quizService, authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Lock, Check, Play, Sparkles, Heart, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePromo, useIsPromoActive } from "@/contexts/PromoContext";

import { getCorpo, getCiclo } from "@/lib/celestial";

const zigzag = (i: number) => [0, 48, 72, 48, 0, -48, -72, -48][i % 8];

const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: ((i * 137.5) % 100),
  y: ((i * 79.3)  % 100),
  s: 1 + (i % 3) * 0.7,
  o: 0.3 + (i % 5) * 0.12,
}));

const PAGE_BG = "#080814";

// ── Componente ─────────────────────────────────────────────────────────────────
const Aprender = () => {
  const { profile } = useAuth();
  const promo = usePromo();
  const isPromoActive = useIsPromoActive();

  // Tornar a página toda escura — sobrepõe a variável CSS E o body para garantir
  useEffect(() => {
    const prevVar  = document.documentElement.style.getPropertyValue("--gradient-soft");
    const prevBody = document.body.style.backgroundColor;
    document.documentElement.style.setProperty("--gradient-soft", PAGE_BG);
    document.body.style.backgroundColor = PAGE_BG;
    return () => {
      if (prevVar) document.documentElement.style.setProperty("--gradient-soft", prevVar);
      else document.documentElement.style.removeProperty("--gradient-soft");
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  // plano mode takes absolute priority over interesses_ativo
  const isPlanoMode     = profile?.concurso_id === "plano";
  const interessesAtivo = !isPlanoMode && !!profile?.interesses_ativo && (profile?.interesses?.length ?? 0) > 0;
  const concursoId  = isPlanoMode ? "plano" : interessesAtivo ? "interesses" : profile?.concurso_id  ?? null;
  const categoriaId = isPlanoMode ? "meu-plano" : interessesAtivo ? "interesses" : profile?.categoria_id ?? null;
  const isPlano     = concursoId === "plano";
  const cat         = !interessesAtivo && !isPlano && concursoId && categoriaId ? quizService.getCategoria(concursoId, categoriaId) : null;
  const hasTrilha   = interessesAtivo || isPlano || !!cat;

  const pontos  = profile?.pontos_globais ?? profile?.pontos ?? 0;
  const streak  = profile?.streak ?? 0;

  const [info, setInfo] = useState<{ level: number; doneInLevel: number; perLevel: number } | null>(null);
  useEffect(() => {
    if (!concursoId || !categoriaId) return;
    quizService.getAprenderLevel(concursoId, categoriaId).then(setInfo);
  }, [concursoId, categoriaId]);

  // Vidas persistentes (recarga server-side) — só para mostrar no header.
  const [vidas, setVidas] = useState<number | null>(null);
  useEffect(() => {
    authService.getLives().then((r) => setVidas(r.vidas)).catch(() => {});
  }, []);

  const level       = info?.level       ?? 1;
  const perLevel    = info?.perLevel    ?? 300;
  const doneInLevel = info?.doneInLevel ?? 0;
  const progressPct = Math.min(100, Math.round((doneInLevel / perLevel) * 100));
  const corpo       = getCorpo(level);
  const ciclo       = getCiclo(level);

  const start  = Math.max(1, level - 2);
  const levels = Array.from({ length: 12 }, (_, i) => start + i);

  return (
    <AppShell>
      <Seo
        title="Aprender · Trilha Cósmica"
        description="Sobe de nível estudando — viaja pelo sistema solar e além."
        path="/aprender"
      />

      {/* ── PROMO BANNER ─────────────────────────────────────────────────────── */}
      {isPromoActive && promo.promo && (() => {
        const promoEnd = new Date(promo.promo!.ends_at).getTime();
        const diasRestantes = Math.max(1, Math.ceil((promoEnd - Date.now()) / 86_400_000));
        return (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 animate-fade-in">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="flex-1 text-sm font-semibold text-amber-300">
              {promo.promo!.discount_pct === 100 ? "Acesso completo gratuito" : `${promo.promo!.discount_pct}% desconto`} até <strong className="text-amber-200">{new Date(promo.promo!.ends_at).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}</strong>
            </p>
            <span className="rounded-lg bg-amber-500 px-2 py-0.5 font-display text-sm font-black text-white">
              {diasRestantes}d
            </span>
          </div>
        );
      })()}

      {/* ── Header: planeta actual ─────────────────────────────────────────── */}
      {hasTrilha && (
        <div
          className="relative mb-6 overflow-hidden rounded-3xl p-5 text-white shadow-elegant animate-fade-in"
          style={{ background: `radial-gradient(ellipse at 70% 40%, ${corpo.brilho}80 0%, #0d0d20 70%)` }}
        >
          {STARS.slice(0, 18).map((s, i) => (
            <div key={i} className="pointer-events-none absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }} />
          ))}

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl animate-float shadow-lg"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${corpo.cor}cc, ${corpo.brilho})`,
                  boxShadow: `0 0 20px ${corpo.cor}66`,
                }}
              >
                {corpo.icone}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-50">
                  {corpo.sistema}{ciclo > 1 ? ` · Ciclo ${ciclo}` : ""}
                </p>
                <p className="font-display text-xl font-bold leading-tight">{corpo.nome}</p>
                <p className="text-xs opacity-50">Nível {level}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              {streak > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                  <Flame className="h-4 w-4 fill-orange-400 text-orange-400" />
                  <span className="font-display text-sm font-bold">{streak}</span>
                </div>
              )}
              {vidas !== null && (
                <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                  <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
                  <span className="font-display text-sm font-bold">{vidas}</span>
                </div>
              )}
              <div className="text-right">
                <p className="font-display text-lg font-bold leading-none">{pontos.toLocaleString("pt-PT")}</p>
                <p className="text-[10px] opacity-40 uppercase tracking-wide">pontos</p>
              </div>
            </div>
          </div>

          <div className="relative mt-4">
            <div className="mb-1 flex items-center justify-between text-xs opacity-70">
              <span>Progresso no nível</span>
              <span className="font-semibold">{doneInLevel}/{perLevel} · {progressPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${corpo.cor}, ${corpo.brilho})` }}
              />
            </div>
          </div>

          <Button
            asChild
            size="lg"
            className="relative mt-4 w-full rounded-2xl bg-white font-bold text-slate-900 shadow-lg transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            <Link to={`/aprender/sessao/${concursoId}/${categoriaId}`} className="flex items-center justify-center gap-2">
              <Play className="h-5 w-5 fill-slate-900" /> Continuar · Nível {level}
            </Link>
          </Button>
        </div>
      )}

      {/* ── Sem categoria ─────────────────────────────────────────────────── */}
      {!hasTrilha && (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Rocket className="h-8 w-8 text-white/70" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Escolhe o teu destino</p>
            <p className="mt-1 text-sm text-white/50">Define a tua categoria para começar a viajar pelo cosmos do conhecimento.</p>
          </div>
          <Button asChild size="lg" className="rounded-2xl bg-white font-bold text-slate-900 shadow-lg hover:bg-white/90">
            <Link to="/concursos">Escolher categoria</Link>
          </Button>
        </div>
      )}

      {/* ── Trilha cósmica (sem card — funde com o fundo da página) ────────── */}
      {hasTrilha && (
        <div className="relative">

          {/* Estrelas de fundo */}
          <div className="pointer-events-none absolute inset-0">
            {STARS.map((s, i) => (
              <div key={i} className="absolute rounded-full bg-white"
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }} />
            ))}
          </div>

          {/* Fade no topo */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-16"
            style={{ background: `linear-gradient(to bottom, ${PAGE_BG}, transparent)` }} />
          {/* Fade em baixo — infinito */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-48"
            style={{ background: `linear-gradient(to top, ${PAGE_BG}, transparent)` }} />

          {/* Label sistema actual */}
          <div className="relative z-20 pb-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/50 backdrop-blur-sm">
              {corpo.sistema}{ciclo > 1 ? <span className="opacity-50">· Ciclo {ciclo}</span> : null}
            </span>
          </div>

          {/* Nós */}
          <ul className="relative z-20 mx-auto flex max-w-xs flex-col items-center gap-4 pb-32">
            {levels.map((lvl, i) => {
              const done      = lvl < level;
              const current   = lvl === level;
              const locked    = lvl > level;
              const c         = getCorpo(lvl);
              const offset    = zigzag(i);
              const futureIdx = lvl - level;
              const opacity   = locked ? Math.max(0.12, 1 - futureIdx * 0.18) : 1;

              return (
                <li key={lvl} className="flex w-full flex-col items-center"
                  style={{ transform: `translateX(${offset}px)`, opacity }}>

                  {i > 0 && (
                    <div className="mb-1 h-4 w-0.5 rounded-full"
                      style={{ background: done || current ? `${c.cor}50` : "rgba(255,255,255,0.06)" }} />
                  )}

                  {done || current ? (
                    <Link to={`/aprender/sessao/${concursoId}/${categoriaId}`}
                      className="group flex flex-col items-center">
                      <div
                        className={cn(
                          "relative flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl transition-transform group-active:scale-95",
                          current && "animate-float",
                        )}
                        style={{
                          background: done
                            ? `radial-gradient(circle at 35% 35%, ${c.cor}99, ${c.brilho})`
                            : `radial-gradient(circle at 35% 35%, ${c.cor}, ${c.brilho})`,
                          boxShadow: current
                            ? `0 0 0 4px ${c.cor}40, 0 0 28px ${c.cor}80, 0 6px 0 ${c.brilho}`
                            : `0 0 12px ${c.cor}30, 0 6px 0 ${c.brilho}`,
                        }}
                      >
                        <span className="select-none leading-none">{c.icone}</span>
                        {done && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                            <Check className="h-8 w-8 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-center">
                        {current && (
                          <div
                            className="mb-1.5 rounded-xl border px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
                            style={{ borderColor: `${c.cor}50`, background: `${c.cor}20` }}
                          >
                            <Play className="mr-1 inline h-3 w-3 fill-current" />
                            Jogar
                          </div>
                        )}
                        <p className={cn("text-xs font-semibold", done ? "text-white/40" : "text-white/85")}>
                          {c.nome}
                        </p>
                        <p className="text-[10px] text-white/30">Nível {lvl}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.07)" }}>
                        <span className="select-none grayscale opacity-30">{c.icone}</span>
                      </div>
                      <div className="mt-2 text-center">
                        <Lock className="mx-auto h-3 w-3 text-white/15" />
                        <p className="mt-0.5 text-[10px] text-white/20">{c.nome}</p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}

            {/* Indicador infinito */}
            <li className="flex flex-col items-center gap-3 pt-2" style={{ opacity: 0.2 }}>
              <div className="h-8 w-0.5 rounded-full bg-white/30" />
              <div className="flex gap-2">
                {[0.3, 0.6, 0.9].map((d) => (
                  <div key={d} className="h-2 w-2 rounded-full bg-white animate-pulse"
                    style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </li>
          </ul>
        </div>
      )}

      {/* ── Sistemas (sem emojis) ─────────────────────────────────────────── */}
      {hasTrilha && (
        <div className="relative z-20 pb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/30">Sistemas</p>
          <div className="flex flex-wrap gap-2">
            {[
              { nome: "Sistema Solar",  firstLvl: 1  },
              { nome: "Alpha Centauri", firstLvl: 11 },
              { nome: "Via Láctea",     firstLvl: 14 },
              { nome: "Galáxias",       firstLvl: 19 },
              { nome: "Universo",       firstLvl: 23 },
            ].map((sis) => {
              const unlocked = level >= sis.firstLvl;
              const isCurrent = corpo.sistema === sis.nome;
              return (
                <div
                  key={sis.nome}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    isCurrent
                      ? "text-white"
                      : unlocked
                        ? "border-white/20 bg-white/10 text-white/80"
                        : "border-white/5 bg-white/5 text-white/20",
                  )}
                  style={isCurrent ? { borderColor: `${corpo.cor}60`, background: `${corpo.cor}25` } : undefined}
                >
                  {sis.nome}
                  {isCurrent && <span className="ml-1 opacity-70">· atual</span>}
                  {!unlocked && <span className="ml-1 opacity-50">· Nível {sis.firstLvl}+</span>}
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
