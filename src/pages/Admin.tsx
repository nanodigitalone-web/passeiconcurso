import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService, authService, quizService, notificationsService, cursosService } from "@/services";
import type { CursoPreparatorio } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, KeyRound, Bell, BarChart3, ShieldAlert, Eye, EyeOff, Trash2, Ban, CheckCircle2, RefreshCw,
  ShieldCheck, Unlock, Lock, FileText, ExternalLink, Clock, GraduationCap, Plus, Phone, Image as ImageIcon,
  Coins, Banknote,
} from "lucide-react";

const concursos = quizService.getConcursos();

const ADMIN_BG = "bg-[hsl(220_70%_8%)] text-[hsl(210_40%_96%)]";
const PANEL = "bg-[hsl(220_55%_12%)] border-[hsl(220_45%_22%)] text-[hsl(210_40%_96%)]";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();

  const signInGoogle = async () => {
    const result = await authService.signInWithGoogle(window.location.origin + "/admin");
    if (result.error) toast.error("Erro ao iniciar sessão");
  };

  if (loading) return <div className={`${ADMIN_BG} min-h-screen flex items-center justify-center`}>A carregar…</div>;

  if (!user) {
    return (
      <div className={`${ADMIN_BG} min-h-screen flex items-center justify-center px-6`}>
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-1">Painel Admin</h1>
          <p className="text-xs text-white/50 mb-8">Nano Digital One · Passei</p>
          <Button onClick={signInGoogle} className="w-full" variant="secondary">
            <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Entrar com Google
          </Button>
          <div className="mt-6"><Link to="/login" className="text-xs text-white/50 hover:text-white">Voltar ao login</Link></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={`${ADMIN_BG} min-h-screen flex items-center justify-center px-6`}>
        <div className="max-w-md text-center">
          <ShieldAlert className="h-14 w-14 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>
          <p className="text-white/70 mb-6">Usuário não identificado. Esta área é restrita aos administradores da Passei.</p>
          <Button variant="secondary" onClick={async () => { await signOut(); }}>Sair</Button>
          <div className="mt-4"><Link to="/" className="text-xs text-white/50 hover:text-white">Voltar à plataforma</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ADMIN_BG} min-h-screen`}>
      <header className="sticky top-0 z-30 border-b border-[hsl(220_45%_22%)] bg-[hsl(220_70%_8%)]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Painel Admin</h1>
              <p className="text-[11px] text-white/50">Nano Digital One · Passei</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/"><Button size="sm" variant="secondary" className="rounded-full">Plataforma</Button></Link>
            <Button size="sm" variant="destructive" className="rounded-full" onClick={signOut}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="stats">
          <TabsList className="bg-[hsl(220_55%_14%)]/60 border border-[hsl(220_45%_22%)] p-1 h-auto flex-wrap rounded-full gap-1">
            <TabsTrigger value="stats" className="rounded-full text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><BarChart3 className="h-4 w-4 mr-1" />Estatísticas</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><Users className="h-4 w-4 mr-1" />Usuários</TabsTrigger>
            <TabsTrigger value="codes" className="rounded-full text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><KeyRound className="h-4 w-4 mr-1" />Códigos</TabsTrigger>
            <TabsTrigger value="notifs" className="rounded-full text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><Bell className="h-4 w-4 mr-1" />Notificações</TabsTrigger>
            <TabsTrigger value="comprovativos" className="rounded-full text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><FileText className="h-4 w-4 mr-1" />Comprovativos</TabsTrigger>
            <TabsTrigger value="preparatorios" className="rounded-full text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><GraduationCap className="h-4 w-4 mr-1" />Preparatórios</TabsTrigger>
            <TabsTrigger value="carregamentos" className="rounded-full text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><Coins className="h-4 w-4 mr-1" />Moedas</TabsTrigger>
            <TabsTrigger value="saques" className="rounded-full text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><Banknote className="h-4 w-4 mr-1" />Saques</TabsTrigger>
          </TabsList>


          <TabsContent value="stats"><StatsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="codes"><CodesTab /></TabsContent>
          <TabsContent value="notifs"><NotifsTab /></TabsContent>
          <TabsContent value="comprovativos"><ComprovativosTab /></TabsContent>
          <TabsContent value="preparatorios"><PreparatoriosTab /></TabsContent>
          <TabsContent value="carregamentos"><CarregamentosTab /></TabsContent>
          <TabsContent value="saques"><SaquesTab /></TabsContent>
        </Tabs>

      </main>
    </div>
  );
};

/* ---------------- Stats ---------------- */
const StatsTab = () => {
  const [s, setS] = useState({ users: 0, blocked: 0, hidden: 0, paid: 0, codesUsed: 0, codesAvail: 0, payments: 0 });

  // Questões disponíveis na plataforma (calculado dos dados locais)
  const totalQuestoes = concursos.reduce((acc, c) => acc + c.categorias.reduce((a, cat) => a + cat.questoes.length, 0), 0);
  const totalCategorias = concursos.reduce((acc, c) => acc + c.categorias.length, 0);
  const porCategoria = concursos.flatMap(c => c.categorias.map(cat => ({ nome: cat.nome, n: cat.questoes.length })))
    .sort((a, b) => b.n - a.n);

  useEffect(() => {
    adminService.getStats().then(setS);
  }, []);


  const groups: { title: string; items: { label: string; value: number; icon: any; grad: string }[] }[] = [
    {
      title: "Conteúdo da plataforma",
      items: [
        { label: "Questões disponíveis", value: totalQuestoes, icon: FileText, grad: "from-emerald-500 to-teal-600" },
        { label: "Categorias", value: totalCategorias, icon: BarChart3, grad: "from-sky-500 to-blue-600" },
        { label: "Concursos", value: concursos.length, icon: ShieldCheck, grad: "from-indigo-500 to-violet-600" },
      ],
    },
    {
      title: "Usuários",
      items: [
        { label: "Total de usuários", value: s.users, icon: Users, grad: "from-sky-500 to-indigo-600" },
        { label: "Bloqueados", value: s.blocked, icon: Ban, grad: "from-rose-500 to-red-600" },
        { label: "Ocultos", value: s.hidden, icon: EyeOff, grad: "from-amber-500 to-orange-600" },
        { label: "Acessos pagos activos", value: s.paid, icon: CheckCircle2, grad: "from-emerald-500 to-green-600" },
      ],
    },
    {
      title: "Códigos & Pagamentos",
      items: [
        { label: "Códigos disponíveis", value: s.codesAvail, icon: KeyRound, grad: "from-emerald-500 to-teal-600" },
        { label: "Códigos usados", value: s.codesUsed, icon: Lock, grad: "from-slate-500 to-slate-600" },
        { label: "Pagamentos pendentes", value: s.payments, icon: Clock, grad: "from-amber-500 to-orange-600" },
      ],
    },
  ];

  return (
    <div className="mt-5 space-y-7">
      {groups.map(g => (
        <section key={g.title}>
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">{g.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {g.items.map(i => (
              <Card key={i.label} className={`${PANEL} relative overflow-hidden p-4 transition-transform hover:-translate-y-0.5`}>
                <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${i.grad} opacity-20 blur-xl`} />
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${i.grad} shadow-lg`}>
                  <i.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold tabular-nums">{i.value.toLocaleString("pt-PT")}</p>
                <p className="text-xs text-white/55 mt-0.5">{i.label}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">Questões por categoria</h2>
        <Card className={`${PANEL} p-5`}>
          <div className="space-y-3.5">
            {porCategoria.map(c => {
              const pct = Math.min(100, Math.round((c.n / 1000) * 100));
              return (
                <div key={c.nome}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/90 font-medium">{c.nome}</span>
                    <span className="text-white/60 tabular-nums">{c.n} <span className="text-white/30">/ 1000</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-[hsl(220_45%_22%)] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
};

/* ---------------- Users ---------------- */
type AccessRow = { id: string; concurso_id: string; categoria_id: string; code: string | null; activated_at: string };

const UsersTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, AccessRow[]>>({});
  const [q, setQ] = useState("");

  const load = async () => {
    const [profiles, acc] = await Promise.all([adminService.listProfiles(500), adminService.listAllAccess(2000)]);
    setRows(profiles);
    const map: Record<string, AccessRow[]> = {};
    (acc ?? []).forEach((a: any) => {
      (map[a.user_id] ||= []).push(a);
    });
    setAccessMap(map);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    const { error } = await adminService.updateProfile(id, patch);
    if (error) toast.error(error.message); else { toast.success("Atualizado"); load(); }
  };
  const del = async (id: string) => {
    if (!confirm("Eliminar usuário definitivamente?")) return;
    const { error } = await adminService.deleteProfile(id);
    if (error) toast.error(error.message); else { toast.success("Eliminado"); load(); }
  };

  const catNome = (concId: string, catId: string) =>
    concursos.find(c => c.id === concId)?.categorias.find(x => x.id === catId)?.nome ?? catId;

  const filtered = rows.filter(r =>
    !q || r.nome?.toLowerCase().includes(q.toLowerCase()) || r.email?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mt-4 space-y-3">
      <Input placeholder="Procurar por nome ou email" value={q} onChange={e => setQ(e.target.value)}
        className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white placeholder:text-white/40" />
      <div className="space-y-2">
        {filtered.map(r => {
          const access = accessMap[r.id] ?? [];
          return (
            <Card key={r.id} className={`${PANEL} p-3`}>
              <div className="flex flex-wrap items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-white/10">
                  <AvatarImage src={r.avatar_url || undefined} />
                  <AvatarFallback className="bg-[hsl(220_70%_18%)] text-white font-bold">
                    {r.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate flex items-center gap-2">
                    {r.nome}
                    {r.blocked && <Badge variant="destructive">Bloqueado</Badge>}
                    {r.hidden && <Badge variant="secondary">Oculto</Badge>}
                    {access.length > 0 ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{access.length} plano{access.length > 1 ? "s" : ""} activo{access.length > 1 ? "s" : ""}</Badge>
                    ) : (
                      <Badge variant="outline" className="border-white/20 text-white/60">Sem plano</Badge>
                    )}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {r.email} · {r.pontos ?? 0} pts
                    <span className="ml-2 inline-flex items-center gap-1 text-white/50">
                      <Clock className="h-3 w-3" />
                      {r.last_seen ? `online ${formatRelative(r.last_seen)}` : "nunca entrou"}
                    </span>
                  </p>
                  {access.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {access.map(a => (
                        <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-200">
                          <ShieldCheck className="h-3 w-3" />
                          {catNome(a.concurso_id, a.categoria_id)}
                          {a.code && <span className="font-mono text-emerald-300/70">· {a.code}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <ManageAccessDialog user={r} access={access} onChanged={load} />
                  <Button size="sm" variant="secondary" title={r.blocked ? "Desbloquear" : "Bloquear"} onClick={() => update(r.id, { blocked: !r.blocked })}>
                    {r.blocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="secondary" title={r.hidden ? "Mostrar" : "Ocultar"} onClick={() => update(r.id, { hidden: !r.hidden })}>
                    {r.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="destructive" title="Eliminar" onClick={() => del(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-white/50">Nenhum usuário.</p>}
      </div>
    </div>
  );
};

/* ---------------- Manage Access Dialog ---------------- */


const ManageAccessDialog = ({ user, access, onChanged }: { user: any; access: AccessRow[]; onChanged: () => void }) => {
  const [open, setOpen] = useState(false);
  const [conc, setConc] = useState(concursos[0]?.id ?? "");
  const [cat, setCat] = useState(concursos[0]?.categorias?.[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const concurso = concursos.find(c => c.id === conc);
  const cats = concurso?.categorias ?? [];

  const activate = async () => {
    if (!conc || !cat) return;
    setBusy(true);
    try {
      const catName = catNome(conc, cat);
      const code = await adminService.grantAccess({
        userId: user.id,
        concursoId: conc,
        categoriaId: cat,
        categoriaNome: catName,
      });
      await notificationsService.create({
        userId: user.id,
        title: "Conta activada ✅",
        body: `O seu acesso a ${catName} foi activado pela equipa. Código: ${code}. Bons estudos!`,
      });
      toast.success(`Acesso activado (código ${code})`);
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao activar");
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (a: AccessRow) => {
    if (!confirm(`Desactivar acesso a "${a.categoria_id}"?`)) return;
    const { error } = await adminService.deactivateAccess(a.id);
    if (error) toast.error(error.message);
    else { toast.success("Acesso desactivado"); onChanged(); }
  };

  const catNome = (cid: string, catId: string) =>
    concursos.find(c => c.id === cid)?.categorias.find(x => x.id === catId)?.nome ?? catId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" title="Gerir acessos"><KeyRound className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="bg-[hsl(220_55%_12%)] border-[hsl(220_45%_22%)] text-white">
        <DialogHeader>
          <DialogTitle>Gerir acessos · {user.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/60 mb-2">Acessos activos</p>
            {access.length === 0 ? (
              <p className="text-sm text-white/50">Nenhum acesso activo.</p>
            ) : (
              <div className="space-y-1.5">
                {access.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-[hsl(220_45%_22%)] bg-[hsl(220_55%_14%)] px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{catNome(a.concurso_id, a.categoria_id)}</p>
                      <p className="text-xs text-white/50 font-mono">
                        {a.code ?? "—"} · {new Date(a.activated_at).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => deactivate(a)}>
                      <Lock className="h-3.5 w-3.5 mr-1" /> Desactivar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[hsl(220_45%_22%)] pt-3">
            <p className="text-xs uppercase tracking-wider text-white/60 mb-2">Activar nova categoria</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select value={conc} onValueChange={v => { setConc(v); const c = concursos.find(x => x.id === v); setCat(c?.categorias?.[0]?.id ?? ""); }}>
                <SelectTrigger className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{concursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={activate} disabled={busy} className="mt-2 w-full">
              <Unlock className="h-4 w-4 mr-1" /> {busy ? "A activar…" : "Activar acesso (gera código)"}
            </Button>
            <p className="mt-1.5 text-[11px] text-white/50">Será gerado um código de 6 dígitos automaticamente e marcado como usado por este utilizador.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- Codes ---------------- */
const CodesTab = () => {
  const [conc, setConc] = useState(concursos[0]?.id ?? "");
  const [cat, setCat] = useState<string>(concursos[0]?.categorias?.[0]?.id ?? "");
  const [stats, setStats] = useState({ available: 0, used: 0 });
  const [showUsed, setShowUsed] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [count, setCount] = useState(500);
  const [busy, setBusy] = useState(false);

  const concurso = concursos.find(c => c.id === conc);
  const cats = concurso?.categorias ?? [];

  const load = async () => {
    if (!conc || !cat) return;
    setStats(await adminService.getCodeStats(conc, cat));
    setList(await adminService.listCodes(conc, cat, showUsed ? "used" : "available", 300));
  };
  useEffect(() => { load(); }, [conc, cat, showUsed]);

  const generate = async () => {
    setBusy(true);
    try {
      const n = await adminService.generateCodes(conc, cat, count);
      toast.success(`${n} códigos gerados`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select value={conc} onValueChange={v => { setConc(v); const c = concursos.find(x => x.id === v); setCat(c?.categorias?.[0]?.id ?? ""); }}>
          <SelectTrigger className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white"><SelectValue /></SelectTrigger>
          <SelectContent>{concursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white"><SelectValue /></SelectTrigger>
          <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className={`${PANEL} p-4`}><p className="text-xs text-white/60">Disponíveis</p><p className="text-3xl font-bold">{stats.available}</p></Card>
        <Card className={`${PANEL} p-4`}><p className="text-xs text-white/60">Usados</p><p className="text-3xl font-bold">{stats.used}</p></Card>
      </div>

      <Card className={`${PANEL} p-4 space-y-3`}>
        <p className="font-semibold">Gerar mais códigos</p>
        <div className="flex gap-2">
          <Input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 0)}
            className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white" />
          <Button onClick={generate} disabled={busy || !count}>
            <RefreshCw className="h-4 w-4 mr-1" />Gerar
          </Button>
        </div>
        <p className="text-xs text-white/50">Cada código tem 6 dígitos e é único para a categoria selecionada.</p>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={showUsed ? "secondary" : "default"} onClick={() => setShowUsed(false)}>Disponíveis</Button>
        <Button size="sm" variant={showUsed ? "default" : "secondary"} onClick={() => setShowUsed(true)}>Usados</Button>
        <span className="ml-auto text-xs text-white/60">{list.length} {showUsed ? "usados" : "disponíveis"} listados</span>
        <Button size="sm" variant="secondary" onClick={() => {
          const txt = list.map((c: any) => c.code).join("\n");
          navigator.clipboard.writeText(txt);
          toast.success("Códigos copiados");
        }}>Copiar todos</Button>
      </div>

      <Card className={`${PANEL} p-4`}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[420px] overflow-y-auto">
          {list.map((c: any) => (
            <div
              key={c.code}
              className="font-mono font-semibold text-base tracking-widest text-center px-2 py-2 rounded-md bg-white text-[hsl(220_70%_10%)] border border-[hsl(220_45%_22%)] shadow-sm select-all"
            >
              {c.code}
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-white/60 col-span-full text-center py-6">Sem códigos para mostrar.</p>}
        </div>
      </Card>
    </div>
  );
};

/* ---------------- Notifications ---------------- */
const NotifsTab = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    adminService.listUsersBasic(500).then(setUsers);
    loadRecent();
  }, []);
  const loadRecent = async () => {
    setRecent(await adminService.listRecentNotifications(20));
  };

  const send = async () => {
    if (!title || !body) return toast.error("Preencha título e mensagem");
    const { error } = await adminService.sendNotification({
      title,
      body,
      createdBy: user?.id,
      userId: target === "all" ? null : target,
    });
    if (error) toast.error(error.message);
    else { toast.success("Enviada"); setTitle(""); setBody(""); loadRecent(); }
  };

  return (
    <div className="mt-4 space-y-4">
      <Card className={`${PANEL} p-4 space-y-3`}>
        <p className="font-semibold">Nova notificação</p>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.nome} · {u.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)}
          className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white" />
        <Textarea placeholder="Mensagem" value={body} onChange={e => setBody(e.target.value)}
          className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white" />
        <Button onClick={send}><Bell className="h-4 w-4 mr-1" />Enviar</Button>
      </Card>

      <Card className={`${PANEL} p-4`}>
        <p className="font-semibold mb-2">Recentes</p>
        <div className="space-y-2">
          {recent.map(n => (
            <div key={n.id} className="rounded border border-[hsl(220_45%_22%)] p-2">
              <p className="font-medium text-sm">{n.title} {n.user_id === null && <Badge className="ml-1">broadcast</Badge>}</p>
              <p className="text-xs text-white/60">{n.body}</p>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-white/50">Nenhuma.</p>}
        </div>
      </Card>
    </div>
  );
};


/* ---------------- Helpers ---------------- */
const formatRelative = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "agora mesmo";
  if (d < 3600) return `há ${Math.floor(d / 60)} min`;
  if (d < 86400) return `há ${Math.floor(d / 3600)} h`;
  if (d < 7 * 86400) return `há ${Math.floor(d / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-PT");
};

/* ---------------- Comprovativos ---------------- */
const ComprovativosTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<"all" | "awaiting_review" | "approved" | "rejected">("awaiting_review");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const data = await adminService.listPaymentRequests(filter, 200);
    setRows(data);
    const ids = Array.from(new Set(data.map((r: any) => r.user_id)));
    if (ids.length) {
      const ps = await adminService.listProfilesByIds(ids as string[]);
      const map: Record<string, any> = {};
      ps.forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  };
  useEffect(() => { load(); }, [filter]);

  const openComprovativo = async (path: string) => {
    try {
      const url = await adminService.getComprovativoUrl(path);
      window.open(url, "_blank");
    } catch {
      toast.error("Não foi possível abrir o comprovativo");
    }
  };

  const aprovar = async (r: any) => {
    setBusy(r.id);
    try {
      const code = await adminService.approvePayment(r);
      await notificationsService.create({
        userId: r.user_id,
        title: "Conta activada ✅",
        body: `O seu acesso a ${r.categoria_nome ?? r.categoria_id} foi activado por 4 meses. Código: ${code}.`,
      });
      toast.success("Aprovado e activado");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao aprovar");
    } finally { setBusy(null); }
  };

  const rejeitar = async (r: any) => {
    if (!confirm("Rejeitar este comprovativo?")) return;
    await adminService.rejectPayment(r.id);
    await notificationsService.create({
      userId: r.user_id,
      title: "Comprovativo recusado",
      body: `O comprovativo enviado para ${r.categoria_nome ?? r.categoria_id} não foi validado. Verifique e envie novamente.`,
    });
    toast.success("Rejeitado");
    load();
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["awaiting_review", "approved", "rejected", "all"] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "secondary"} onClick={() => setFilter(f)}>
            {f === "awaiting_review" ? "Por verificar" : f === "approved" ? "Aprovados" : f === "rejected" ? "Rejeitados" : "Todos"}
          </Button>
        ))}
      </div>

      {rows.length === 0 && <p className="text-sm text-white/50">Nenhum comprovativo.</p>}

      {rows.map(r => {
        const p = profiles[r.user_id];
        return (
          <Card key={r.id} className={`${PANEL} p-3`}>
            <div className="flex flex-wrap items-start gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-white/10">
                <AvatarImage src={p?.avatar_url || undefined} />
                <AvatarFallback className="bg-[hsl(220_70%_18%)] text-white font-bold">
                  {(p?.nome || r.email)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p?.nome ?? "—"}</p>
                <p className="text-xs text-white/60 truncate">{r.email}</p>
                <p className="text-xs text-white/70 mt-1">
                  {r.categoria_nome ?? r.categoria_id} · <span className="text-white/50">{r.concurso_id}</span>
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Enviado {formatRelative(r.created_at)} · status: <span className="font-semibold text-white/70">{r.status}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {r.comprovativo_url && (
                  <Button size="sm" variant="secondary" onClick={() => openComprovativo(r.comprovativo_url)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver
                  </Button>
                )}
                {r.status === "awaiting_review" && (
                  <>
                    <Button size="sm" disabled={busy === r.id} onClick={() => aprovar(r)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejeitar(r)}>
                      <Ban className="h-3.5 w-3.5 mr-1" /> Rejeitar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

/* ---------------- Cursos Preparatórios ---------------- */
const emptyCurso = (): Partial<CursoPreparatorio> => ({
  concurso_id: concursos[0]?.id ?? "",
  nome: "",
  logo_url: "",
  contacto: "",
  link_externo: "",
  descricao: "",
  ativo: true,
  ordem: 0,
});

const PreparatoriosTab = () => {
  const [rows, setRows] = useState<CursoPreparatorio[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CursoPreparatorio> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setRows(await cursosService.adminList());
  useEffect(() => { load(); }, []);

  const concNome = (id: string) => concursos.find(c => c.id === id)?.nome ?? id;

  const openNew = () => { setEditing(emptyCurso()); setOpen(true); };
  const openEdit = (c: CursoPreparatorio) => { setEditing({ ...c }); setOpen(true); };

  const save = async () => {
    if (!editing?.nome?.trim() || !editing?.concurso_id) {
      toast.error("Preencha o nome e o concurso");
      return;
    }
    setBusy(true);
    const payload: any = {
      concurso_id: editing.concurso_id,
      nome: editing.nome.trim(),
      logo_url: editing.logo_url?.trim() || null,
      contacto: editing.contacto?.trim() || null,
      link_externo: editing.link_externo?.trim() || null,
      descricao: editing.descricao?.trim() || null,
      ativo: editing.ativo ?? true,
      ordem: Number(editing.ordem) || 0,
    };
    const { error } = editing.id
      ? await cursosService.update(editing.id, payload)
      : await cursosService.create(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado");
    setOpen(false); setEditing(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("Eliminar este preparatório?")) return;
    const { error } = await cursosService.remove(id);
    if (error) toast.error(error.message); else { toast.success("Eliminado"); load(); }
  };

  const toggle = async (c: CursoPreparatorio) => {
    const { error } = await cursosService.update(c.id, { ativo: !c.ativo });
    if (error) toast.error(error.message); else load();
  };

  const inputCls = "bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white placeholder:text-white/40";

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{rows.length} preparatório(s)</p>
        <Button size="sm" className="rounded-full" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo</Button>
      </div>

      <div className="space-y-2">
        {rows.map(c => (
          <Card key={c.id} className={`${PANEL} p-3`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10 flex items-center justify-center">
                {c.logo_url
                  ? <img src={c.logo_url} alt={c.nome} className="h-full w-full object-contain" />
                  : <GraduationCap className="h-6 w-6 text-white/50" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate flex items-center gap-2">
                  {c.nome}
                  {!c.ativo && <Badge variant="secondary">Inactivo</Badge>}
                  <Badge variant="outline" className="border-white/20 text-white/60">{concNome(c.concurso_id)}</Badge>
                </p>
                <p className="text-xs text-white/55 truncate">
                  {c.contacto && <span className="mr-2">{c.contacto}</span>}
                  {c.link_externo && <span className="text-sky-300">{c.link_externo}</span>}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" title={c.ativo ? "Desactivar" : "Activar"} onClick={() => toggle(c)}>
                  {c.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="secondary" title="Editar" onClick={() => openEdit(c)}><RefreshCw className="h-4 w-4" /></Button>
                <Button size="sm" variant="destructive" title="Eliminar" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-white/50">Nenhum preparatório ainda.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={`${PANEL} max-w-md`}>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} preparatório</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60">Concurso</label>
                <Select value={editing.concurso_id} onValueChange={v => setEditing({ ...editing, concurso_id: v })}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {concursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/60">Nome do preparatório</label>
                <Input className={inputCls} value={editing.nome ?? ""} onChange={e => setEditing({ ...editing, nome: e.target.value })} placeholder="Ex: Preparatório Saber+" />
              </div>
              <div>
                <label className="text-xs text-white/60 flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Link do logótipo (URL da imagem)</label>
                <Input className={inputCls} value={editing.logo_url ?? ""} onChange={e => setEditing({ ...editing, logo_url: e.target.value })} placeholder="https://.../logo.png" />
              </div>
              <div>
                <label className="text-xs text-white/60 flex items-center gap-1"><Phone className="h-3 w-3" /> Contacto</label>
                <Input className={inputCls} value={editing.contacto ?? ""} onChange={e => setEditing({ ...editing, contacto: e.target.value })} placeholder="Ex: +244 9XX XXX XXX" />
              </div>
              <div>
                <label className="text-xs text-white/60 flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Link externo</label>
                <Input className={inputCls} value={editing.link_externo ?? ""} onChange={e => setEditing({ ...editing, link_externo: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-white/60">Descrição (opcional)</label>
                <Textarea className={inputCls} value={editing.descricao ?? ""} onChange={e => setEditing({ ...editing, descricao: e.target.value })} placeholder="Breve descrição do preparatório" />
              </div>
              <div className="flex gap-3">
                <div className="w-24">
                  <label className="text-xs text-white/60">Ordem</label>
                  <Input type="number" className={inputCls} value={editing.ordem ?? 0} onChange={e => setEditing({ ...editing, ordem: Number(e.target.value) })} />
                </div>
              </div>
              <Button className="w-full rounded-full" disabled={busy} onClick={save}>{busy ? "A guardar…" : "Guardar"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
