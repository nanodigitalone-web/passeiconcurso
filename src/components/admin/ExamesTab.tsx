import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { quizService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Trophy, Users } from "lucide-react";

type AdminExam = {
  id: string;
  title: string;
  description: string | null;
  concurso_id: string | null;
  categoria_id: string | null;
  question_count: number;
  duration_minutes: number;
  entry_cost_moedas: number;
  prize_moedas: number[];
  starts_at: string;
  ends_at: string;
  finalized: boolean;
  participants: number;
  finished: number;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const statusOf = (e: AdminExam) => {
  const now = Date.now();
  if (new Date(e.ends_at).getTime() <= now) return e.finalized ? "Finalizado" : "Terminado";
  if (new Date(e.starts_at).getTime() <= now) return "A decorrer";
  return "Agendado";
};

export const ExamesTab = () => {
  const concursos = quizService.getConcursos();
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [concursoId, setConcursoId] = useState("todos");
  const [categoriaId, setCategoriaId] = useState("todas");
  const [questionCount, setQuestionCount] = useState("50");
  const [duration, setDuration] = useState("45");
  const [entryCost, setEntryCost] = useState("0");
  const [prizes, setPrizes] = useState(["200", "100", "50"]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const load = () => {
    api.get<AdminExam[]>("/admin/exams")
      .then(setExams)
      .catch(() => toast.error("Falha ao carregar exames."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const categorias =
    concursoId !== "todos"
      ? concursos.find((c) => c.id === concursoId)?.categorias ?? []
      : [];

  const criar = async () => {
    if (!title.trim() || !startsAt || !endsAt) return toast.error("Preenche título, início e fim.");
    if (new Date(startsAt) >= new Date(endsAt)) return toast.error("O fim tem de ser depois do início.");
    setCreating(true);
    try {
      await api.post("/admin/exams", {
        title: title.trim(),
        description: description.trim() || null,
        concursoId: concursoId === "todos" ? null : concursoId,
        categoriaId: categoriaId === "todas" ? null : categoriaId,
        questionCount: Number(questionCount) || 50,
        durationMinutes: Number(duration) || 45,
        entryCost: Number(entryCost) || 0,
        prizes: prizes.map((p) => Number(p) || 0),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
      toast.success("Simulado Nacional criado e anunciado a todos!");
      setShowForm(false);
      setTitle(""); setDescription(""); setStartsAt(""); setEndsAt("");
      load();
    } catch (e: any) {
      toast.error(
        e?.code === "not_enough_questions"
          ? "Não há questões suficientes para esse filtro."
          : "Falha ao criar o exame.",
      );
    } finally {
      setCreating(false);
    }
  };

  const apagar = async (id: string) => {
    if (!window.confirm("Apagar este exame? As inscrições e resultados são eliminados.")) return;
    try {
      await api.delete(`/admin/exams/${id}`);
      toast.success("Exame apagado.");
      load();
    } catch {
      toast.error("Falha ao apagar.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <Trophy className="h-4 w-4 text-primary" /> Simulado Nacional
        </h2>
        <Button size="sm" className="rounded-full" onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" /> Novo exame
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-3 border-border/60 p-4 shadow-card">
          <Input placeholder="Título (ex: Simulado Nacional de Julho)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Concurso (fonte das questões)</p>
              <Select value={concursoId} onValueChange={(v) => { setConcursoId(v); setCategoriaId("todas"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todo o banco</SelectItem>
                  {concursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Categoria</p>
              <Select value={categoriaId} onValueChange={setCategoriaId} disabled={concursoId === "todos"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Nº questões</p>
              <Input type="number" min={5} max={100} value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Duração (min)</p>
              <Input type="number" min={5} max={180} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Inscrição (moedas)</p>
              <Input type="number" min={0} value={entryCost} onChange={(e) => setEntryCost(e.target.value)} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Prémios em moedas (1.º / 2.º / 3.º)</p>
            <div className="grid grid-cols-3 gap-3">
              {prizes.map((p, i) => (
                <Input key={i} type="number" min={0} value={p}
                  onChange={(e) => setPrizes((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Abre em</p>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Fecha em</p>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <Button onClick={criar} disabled={creating} className="w-full rounded-full bg-gradient-primary font-semibold">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar e anunciar a todos"}
          </Button>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">A carregar…</Card>
      ) : exams.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum exame criado ainda. Cria o primeiro Simulado Nacional!
        </Card>
      ) : (
        <div className="space-y-2.5">
          {exams.map((e) => (
            <Card key={e.id} className="flex items-center gap-3 border-border/60 p-4 shadow-card">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{e.title}</p>
                  <Badge variant={statusOf(e) === "A decorrer" ? "default" : "secondary"} className="text-[10px]">
                    {statusOf(e)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {fmt(e.starts_at)} → {fmt(e.ends_at)} · {e.question_count}q · {e.duration_minutes}min ·{" "}
                  {e.entry_cost_moedas > 0 ? `${e.entry_cost_moedas} moedas` : "grátis"}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {e.participants} inscritos · {e.finished} terminaram
                </p>
              </div>
              <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => apagar(e.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
