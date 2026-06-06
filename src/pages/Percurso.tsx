import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resultsService } from "@/services";
import { Link } from "react-router-dom";
import { useState } from "react";
import { TrendingUp, Trash2, BookOpen, Target } from "lucide-react";

const Percurso = () => {
  const [, setTick] = useState(0);
  const results = resultsService.getResults();

  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const acertos = results.reduce((s, r) => s + r.acertos, 0);
  const taxa = totalQ ? Math.round((acertos / totalQ) * 100) : 0;

  // Stats per discipline
  const porDisciplina = new Map<string, { total: number; acertos: number }>();
  results.forEach((r) =>
    r.respostas.forEach((rr) => {
      const d = porDisciplina.get(rr.disciplina) || { total: 0, acertos: 0 };
      d.total++;
      if (rr.escolhida === rr.correta) d.acertos++;
      porDisciplina.set(rr.disciplina, d);
    })
  );
  const disciplinas = Array.from(porDisciplina.entries()).sort((a, b) => b[1].total - a[1].total);

  return (
    <AppShell>
      <header className="mb-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Percurso</h1>
        <p className="text-sm text-muted-foreground">Seu desempenho geral</p>
      </header>

      <Card className="mb-5 overflow-hidden border-0 bg-gradient-primary p-5 text-primary-foreground shadow-elegant">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
          <TrendingUp className="h-4 w-4" /> Taxa de acerto global
        </div>
        <p className="mt-1 font-display text-5xl font-bold">{taxa}%</p>
        <p className="mt-1 text-sm opacity-90">{acertos} acertos em {totalQ} questões</p>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="border-border/60 p-4 shadow-card">
          <Target className="h-4 w-4 text-primary" />
          <p className="mt-2 font-display text-2xl font-bold">{results.length}</p>
          <p className="text-xs text-muted-foreground">Simulados concluídos</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-card">
          <BookOpen className="h-4 w-4 text-primary" />
          <p className="mt-2 font-display text-2xl font-bold">{disciplinas.length}</p>
          <p className="text-xs text-muted-foreground">Disciplinas estudadas</p>
        </Card>
      </div>

      {disciplinas.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-display font-semibold">Desempenho por disciplina</h2>
          <Card className="border-border/60 p-4 shadow-card">
            <div className="space-y-4">
              {disciplinas.map(([nome, s]) => {
                const pct = Math.round((s.acertos / s.total) * 100);
                return (
                  <div key={nome}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{nome}</span>
                      <span className="text-muted-foreground">{s.acertos}/{s.total} · <span className="font-semibold text-foreground">{pct}%</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-3 font-display font-semibold">Histórico de simulados</h2>
        {results.length === 0 ? (
          <Card className="border-dashed bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não realizou nenhum simulado.</p>
            <Button asChild className="mt-4 rounded-full bg-gradient-primary">
              <Link to="/concursos">Começar agora</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {results.map((r) => {
              const pct = Math.round((r.acertos / r.total) * 100);
              const date = new Date(r.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
              return (
                <Link key={r.id} to={`/resultado/${r.id}`}>
                  <Card className="flex items-center gap-3 border-border/60 p-3 shadow-card transition-smooth hover:shadow-elegant">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${pct >= 60 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {pct}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{r.categoriaNome}</p>
                      <p className="text-xs text-muted-foreground">{date} · {r.acertos}/{r.total}</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {results.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { resultsService.clearResults(); setTick((t) => t + 1); }}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Limpar histórico
        </Button>
      )}
    </AppShell>
  );
};

export default Percurso;
