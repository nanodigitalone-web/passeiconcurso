import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { concursos } from "@/data/concursos";
import * as Icons from "lucide-react";
import { Zap, Flame, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Aprender = () => {
  const { profile } = useAuth();
  const minsa = concursos[0];

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-warning" /> Aprender
        </h1>
        <p className="text-sm text-muted-foreground">Sessões rápidas, ganhe pontos e suba no ranking</p>
      </header>

      <Card className="mb-5 overflow-hidden border-0 bg-gradient-to-br from-warning to-accent p-5 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Seus pontos</p>
            <p className="font-display text-4xl font-bold leading-none">{profile?.pontos ?? 0}</p>
          </div>
          <div className="text-right">
            <Flame className="ml-auto h-6 w-6" />
            <p className="text-xs">{profile?.streak ?? 0} dias</p>
          </div>
        </div>
        <p className="mt-3 text-sm opacity-95">+10 pts por acerto · sessões de 5 questões</p>
      </Card>

      <h2 className="mb-3 font-display font-semibold">Escolha uma trilha</h2>
      <div className="grid grid-cols-2 gap-3">
        {minsa.categorias.map((cat) => {
          const Icon = (Icons as any)[cat.icon] || Icons.GraduationCap;
          return (
            <Link key={cat.id} to={`/aprender/sessao/${minsa.id}/${cat.id}`}>
              <Card className="group h-full border-border/60 p-4 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-warning/20 to-accent/20 text-warning">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold leading-tight text-sm">{cat.nome}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-warning">
                  <Trophy className="h-3 w-3" /> Jogar
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
};

export default Aprender;
