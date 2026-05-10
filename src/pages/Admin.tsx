import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { concursos } from "@/data/concursos";
import {
  Users, KeyRound, Bell, BarChart3, ShieldAlert, Eye, EyeOff, Trash2, Ban, CheckCircle2, RefreshCw,
} from "lucide-react";

const ADMIN_BG = "bg-[hsl(220_70%_8%)] text-[hsl(210_40%_96%)]";
const PANEL = "bg-[hsl(220_55%_12%)] border-[hsl(220_45%_22%)]";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();

  if (loading) return <div className={`${ADMIN_BG} min-h-screen flex items-center justify-center`}>A carregar…</div>;
  if (!user) return <Navigate to="/login" replace />;
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
          <TabsList className="bg-[hsl(220_55%_14%)] border border-[hsl(220_45%_22%)]">
            <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-1" />Estatísticas</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Usuários</TabsTrigger>
            <TabsTrigger value="codes"><KeyRound className="h-4 w-4 mr-1" />Códigos</TabsTrigger>
            <TabsTrigger value="notifs"><Bell className="h-4 w-4 mr-1" />Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="stats"><StatsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="codes"><CodesTab /></TabsContent>
          <TabsContent value="notifs"><NotifsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

/* ---------------- Stats ---------------- */
const StatsTab = () => {
  const [s, setS] = useState({ users: 0, blocked: 0, hidden: 0, paid: 0, codesUsed: 0, codesAvail: 0, payments: 0 });

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

  const items = [
    { label: "Usuários", value: s.users },
    { label: "Bloqueados", value: s.blocked },
    { label: "Ocultos", value: s.hidden },
    { label: "Acessos pagos", value: s.paid },
    { label: "Códigos usados", value: s.codesUsed },
    { label: "Códigos disponíveis", value: s.codesAvail },
    { label: "Pagamentos pendentes", value: s.payments },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
      {items.map(i => (
        <Card key={i.label} className={`${PANEL} p-4`}>
          <p className="text-xs text-white/60">{i.label}</p>
          <p className="text-3xl font-bold mt-1">{i.value}</p>
        </Card>
      ))}
    </div>
  );
};

/* ---------------- Users ---------------- */
const UsersTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
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

  const filtered = rows.filter(r =>
    !q || r.nome?.toLowerCase().includes(q.toLowerCase()) || r.email?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mt-4 space-y-3">
      <Input placeholder="Procurar por nome ou email" value={q} onChange={e => setQ(e.target.value)}
        className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)] text-white placeholder:text-white/40" />
      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className={`${PANEL} p-3 flex flex-wrap items-center gap-3`}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{r.nome} {r.blocked && <Badge variant="destructive" className="ml-1">Bloqueado</Badge>} {r.hidden && <Badge variant="secondary" className="ml-1">Oculto</Badge>}</p>
              <p className="text-xs text-white/60 truncate">{r.email} · {r.pontos ?? 0} pts · {r.categoria_nome ?? "-"}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => update(r.id, { blocked: !r.blocked })}>
                {r.blocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => update(r.id, { hidden: !r.hidden })}>
                {r.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => del(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-white/50">Nenhum usuário.</p>}
      </div>
    </div>
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
          <SelectTrigger className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)]"><SelectValue /></SelectTrigger>
          <SelectContent>{concursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)]"><SelectValue /></SelectTrigger>
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

      <div className="flex gap-2">
        <Button size="sm" variant={showUsed ? "secondary" : "default"} onClick={() => setShowUsed(false)}>Disponíveis</Button>
        <Button size="sm" variant={showUsed ? "default" : "secondary"} onClick={() => setShowUsed(true)}>Usados</Button>
      </div>

      <Card className={`${PANEL} p-3`}>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
          {list.map((c: any) => (
            <div key={c.code} className="font-mono text-sm bg-[hsl(220_55%_16%)] rounded px-2 py-1 text-center">{c.code}</div>
          ))}
          {list.length === 0 && <p className="text-sm text-white/50 col-span-full">Sem códigos.</p>}
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
          <SelectTrigger className="bg-[hsl(220_55%_14%)] border-[hsl(220_45%_22%)]"><SelectValue /></SelectTrigger>
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
