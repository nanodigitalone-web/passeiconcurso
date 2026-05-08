import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Perfil = () => {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome);
      setBio(profile.bio || "");
      setAvatar(profile.avatar_url || "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome, bio, avatar_url: avatar || null, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar perfil");
    await refreshProfile();
    toast.success("Perfil atualizado!");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">Edite suas informações pessoais</p>
      </header>

      <Card className="mb-6 p-6 shadow-card border-border/60">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 ring-4 ring-primary/10">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-display font-bold">
              {nome?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <p className="mt-3 text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1" placeholder="Conte um pouco sobre você..." />
          </div>
          {profile?.categoria_nome && (
            <div className="rounded-xl bg-primary/5 px-3 py-2 text-sm">
              <span className="text-xs text-muted-foreground">Categoria</span>
              <p className="font-semibold">{profile.categoria_nome}</p>
            </div>
          )}
          <Button onClick={save} disabled={saving} className="w-full rounded-full bg-gradient-primary">
            <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </Card>

      <Card className="p-4 shadow-card border-border/60 grid grid-cols-2 gap-3 text-center mb-6">
        <div>
          <p className="font-display text-2xl font-bold text-primary">{profile?.pontos || 0}</p>
          <p className="text-xs text-muted-foreground">Pontos</p>
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-accent">{profile?.streak || 0}🔥</p>
          <p className="text-xs text-muted-foreground">Sequência</p>
        </div>
      </Card>

      <Button variant="outline" onClick={handleSignOut} className="w-full rounded-full text-destructive border-destructive/30 hover:bg-destructive/5">
        <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
      </Button>
    </AppShell>
  );
};

export default Perfil;
