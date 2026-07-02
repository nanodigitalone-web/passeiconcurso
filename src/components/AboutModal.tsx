import { ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Shield, Trophy, Zap } from "lucide-react";

const VERSION = "2.0";

// "Sobre a aplicação" — identidade, o que a app faz e créditos.
export const AboutModal = ({ trigger }: { trigger: ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent className="w-[calc(100%-2rem)] max-w-sm gap-0 overflow-hidden rounded-3xl border-0 p-0">
      {/* Cabeçalho com a identidade da plataforma */}
      <div className="relative bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-center text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white font-display text-2xl font-black text-primary shadow-lg">
            P
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold">Passei</h2>
          <p className="mt-1 text-xs opacity-70">Versão {VERSION}</p>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Plataforma de preparação para concursos públicos em Angola: estuda com
          questões comentadas, acompanha o teu progresso e compete a nível nacional.
        </p>

        <ul className="mt-4 space-y-2.5">
          {[
            { icon: BookOpen, text: "Simulados comentados com seleção inteligente", accent: "bg-sky-100 text-sky-700" },
            { icon: Zap, text: "Trilha Aprender com vidas e sequências", accent: "bg-amber-100 text-amber-700" },
            { icon: Trophy, text: "Ligas semanais e Simulado Nacional", accent: "bg-emerald-100 text-emerald-700" },
            { icon: Shield, text: "Dados protegidos — login apenas com Google", accent: "bg-violet-100 text-violet-700" },
          ].map((f) => (
            <li key={f.text} className="flex items-center gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${f.accent}`}>
                <f.icon className="h-4 w-4" />
              </span>
              <span className="text-sm leading-snug">{f.text}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 border-t border-border/40 pt-4 text-center text-xs text-muted-foreground">
          Desenvolvido por <span className="font-bold text-foreground">Yetuedu</span>
        </p>
      </div>
    </DialogContent>
  </Dialog>
);
