import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
import { concursos } from "@/data/concursos";
import {
  Users, KeyRound, Bell, BarChart3, ShieldAlert, Eye, EyeOff, Trash2, Ban, CheckCircle2, RefreshCw,
  ShieldCheck, Unlock, Lock, FileText, ExternalLink, Clock,
} from "lucide-react";

const ADMIN_BG = "bg-[hsl(220_70%_8%)] text-[hsl(210_40%_96%)]";
const PANEL = "bg-[hsl(220_55%_12%)] border-[hsl(220_45%_22%)]";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();

  const signInGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/admin" });
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
      <header className="sticky top-0 z-30 border-b border-[hsl(220_45%_22%)] bg-[hsl(220_70%_8%)]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Painel Admin · Passei</h1>
            <p className="text-xs text-white/60">Nano Digital One</p>
          </div>
          <div className="flex gap-2">
            <Link to="/"><Button size="sm" variant="secondary">Plataforma</Button></Link>
            <Button size="sm" variant="destructive" onClick={signOut}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="stats">
          <TabsList className="bg-[hsl(220_55%_14%)] border border-[hsl(220_45%_22%)] p-1 h-auto flex-wrap">
            <TabsTrigger value="stats" className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-[hsl(220_70%_10%)] data-[state=active]:shadow"><BarChart3 className="h-4 w-4 mr-1" />Estatísticas</TabsTrigger>
            <TabsTrigger value="users" className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-[hsl(220_70%_10%)] data-[state=active]:shadow"><Users className="h-4 w-4 mr-1" />Usuários</TabsTrigger>
            <TabsTrigger value="codes" className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-[hsl(220_70%_10%)] data-[state=active]:shadow"><KeyRound className="h-4 w-4 mr-1" />Códigos</TabsTrigger>
            <TabsTrigger value="notifs" className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-[hsl(220_70%_10%)] data-[state=active]:shadow"><Bell className="h-4 w-4 mr-1" />Notificações</TabsTrigger>
            <TabsTrigger value="comprovativos" className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-[hsl(220_70%_10%)] data-[state=active]:shadow"><FileText className="h-4 w-4 mr-1" />Comprovativos</TabsTrigger>
          </TabsList>

          <TabsContent value="stats"><StatsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="codes"><CodesTab /></TabsContent>
          <TabsContent value="notifs"><NotifsTab /></TabsContent>
          <TabsContent value="comprovativos"><ComprovativosTab /></TabsContent>
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
    (async () => {
      const [u, b, h, p, cu, ca, pr] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("blocked", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("hidden", true),
        supabase.from("category_access").select("id", { count: "exact", head: true }),
        supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("status", "used"),
        supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("status", "available"),
        supabase.from("payment_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setS({
        users: u.count ?? 0, blocked: b.count ?? 0, hidden: h.count ?? 0,
        paid: p.count ?? 0, codesUsed: cu.count ?? 0, codesAvail: ca.count ?? 0, payments: pr.count ?? 0,
      });
    })();
  }, []);

  const groups: { title: string; items: { label: string; value: number; tone?: string }[] }[] = [
    {
      title: "Conteúdo da plataforma",
      items: [
        { label: "Questões disponíveis", value: totalQuestoes, tone: "text-emerald-300" },
        { label: "Categorias", value: totalCategorias },
        { label: "Concursos", value: concursos.length },
      ],
    },
    {
      title: "Usuários",
      items: [
        { label: "Total de usuários", value: s.users },
        { label: "Bloqueados", value: s.blocked, tone: "text-red-300" },
        { label: "Ocultos", value: s.hidden, tone: "text-amber-300" },
        { label: "Acessos pagos activos", value: s.paid, tone: "text-emerald-300" },
      ],
    },
    {
      title: "Códigos & Pagamentos",
      items: [
        { label: "Códigos disponíveis", value: s.codesAvail, tone: "text-emerald-300" },
        { label: "Códigos usados", value: s.codesUsed },
        { label: "Pagamentos pendentes", value: s.payments, tone: "text-amber-300" },
      ],
    },
  ];

  return (
    <div className="mt-4 space-y-6">
      {groups.map(g => (
        <section key={g.title}>
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">{g.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {g.items.map(i => (
              <Card key={i.label} className={`${PANEL} p-4`}>
                <p className="text-xs text-white/60">{i.label}</p>
                <p className={`text-3xl font-bold mt-1 ${i.tone ?? "text-white"}`}>{i.value.toLocaleString("pt-PT")}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Questões por categoria</h2>
        <Card className={`${PANEL} p-4`}>
          <div className="space-y-2">
            {porCategoria.map(c => {
              const pct = Math.min(100, Math.round((c.n / 1000) * 100));
              return (
                <div key={c.nome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/90">{c.nome}</span>
                    <span className="text-white/60 tabular-nums">{c.n} <span className="text-white/30">/ 1000</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[hsl(220_45%_22%)] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${pct}%` }} />
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
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
    const { data: acc } = await supabase.from("category_access").select("*").limit(2000);
    const map: Record<string, AccessRow[]> = {};
    (acc ?? []).forEach((a: any) => {
      (map[a.user_id] ||= []).push(a);
    });
    setAccessMap(map);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Atualizado"); load(); }
  };
  const del = async (id: string) => {
    if (!confirm("Eliminar usuário definitivamente?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
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
                  <p className="text-xs text-white/60 truncate">{r.email} · {r.pontos ?? 0} pts</p>
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
const genCode = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");

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
      const code = genCode();
      // 1) registar código já usado por este utilizador
      const { error: e1 } = await supabase.from("access_codes").insert({
        concurso_id: conc, categoria_id: cat, code,
        status: "used", used_by: user.id, used_at: new Date().toISOString(),
      } as any);
      if (e1 && !String(e1.message).includes("duplicate")) throw e1;
      // 2) garantir o acesso
      const { error: e2 } = await supabase.from("category_access").insert({
        user_id: user.id, concurso_id: conc, categoria_id: cat, code,
      });
      if (e2 && !String(e2.message).includes("duplicate")) throw e2;
      const catName = catNome(conc, cat);
      await supabase.from("notifications" as any).insert({
        user_id: user.id,
        title: "Conta activada ✅",
        body: `O seu acesso a ${catName} foi activado pela equipa. Código: ${code}. Bons estudos!`,
      } as any);
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
    const { error } = await supabase.from("category_access").delete().eq("id", a.id);
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
    const [a, u] = await Promise.all([
      supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("concurso_id", conc).eq("categoria_id", cat).eq("status", "available"),
      supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("concurso_id", conc).eq("categoria_id", cat).eq("status", "used"),
    ]);
    setStats({ available: a.count ?? 0, used: u.count ?? 0 });
    const { data } = await supabase.from("access_codes")
      .select("code, status, used_at, used_by")
      .eq("concurso_id", conc).eq("categoria_id", cat)
      .eq("status", showUsed ? "used" : "available")
      .order("created_at", { ascending: false }).limit(300);
    setList(data ?? []);
  };
  useEffect(() => { load(); }, [conc, cat, showUsed]);

  const generate = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_generate_codes" as any, { _conc: conc, _cat: cat, _count: count });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`${data} códigos gerados`); load(); }
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
    supabase.from("profiles").select("id, nome, email").order("created_at", { ascending: false }).limit(500).then(({ data }) => setUsers(data ?? []));
    loadRecent();
  }, []);
  const loadRecent = async () => {
    const { data } = await supabase.from("notifications" as any).select("*").order("created_at", { ascending: false }).limit(20);
    setRecent(data as any[] ?? []);
  };

  const send = async () => {
    if (!title || !body) return toast.error("Preencha título e mensagem");
    const payload: any = { title, body, created_by: user?.id, user_id: target === "all" ? null : target };
    const { error } = await supabase.from("notifications" as any).insert(payload);
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

export default Admin;
