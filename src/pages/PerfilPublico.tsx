import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { ArrowLeft, UserCheck, UserPlus, GraduationCap, Building2, BookOpen, Trophy } from "lucide-react";

type PublicProfile = {
  id: string;
  nome: string;
  avatar_url: string | null;
  bio: string | null;
  universidade: string | null;
  curso: string | null;
  ano: string | null;
  pontos_globais: number;
  pontos: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
};

const PerfilPublico = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<PublicProfile>(`/profile/${id}`)
      .then((p) => {
        setProfile(p);
        setFollowing(p.is_following);
        setFollowCount(p.followers_count);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFollow = async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      if (following) {
        await api.delete(`/profile/${id}/follow`);
        setFollowing(false);
        setFollowCount((n) => Math.max(0, n - 1));
      } else {
        await api.post(`/profile/${id}/follow`);
        setFollowing(true);
        setFollowCount((n) => n + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  const isOwnProfile = id === user?.id;

  return (
    <AppShell>
      <Seo title="Perfil · Passei" path={`/perfil/${id}`} />

      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {loading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">A carregar…</Card>
      ) : error || !profile ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Utilizador não encontrado.
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Card principal */}
          <Card className="overflow-hidden border-border/60 shadow-elegant">
            <div className="bg-gradient-to-br from-primary via-blue-700 to-indigo-800 h-24 w-full" />
            <div className="px-5 pb-5 -mt-12">
              <div className="flex items-end justify-between">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-elegant">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white text-2xl font-bold">
                    {profile.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                {!isOwnProfile && (
                  <Button
                    size="sm"
                    variant={following ? "outline" : "default"}
                    className="h-9 gap-2"
                    onClick={toggleFollow}
                    disabled={busy}
                  >
                    {following ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        A seguir
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Seguir
                      </>
                    )}
                  </Button>
                )}
              </div>

              <h1 className="mt-3 text-xl font-bold">{profile.nome}</h1>
              {profile.bio && (
                <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>
              )}
            </div>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Pontos", value: (profile.pontos_globais || profile.pontos || 0).toLocaleString("pt-PT"), icon: Trophy },
              { label: "Seguidores", value: followCount.toLocaleString("pt-PT"), icon: UserCheck },
              { label: "A seguir", value: profile.following_count.toLocaleString("pt-PT"), icon: UserPlus },
            ].map((s) => (
              <Card key={s.label} className="border-border/60 p-3.5 text-center shadow-card">
                <s.icon className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
                <p className="text-base font-bold leading-none">{s.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Informação académica */}
          {(profile.universidade || profile.curso || profile.ano) && (
            <Card className="border-border/60 p-4 shadow-card">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informação académica
              </h2>
              <div className="space-y-2.5">
                {profile.universidade && (
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-medium">{profile.universidade}</p>
                  </div>
                )}
                {profile.curso && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-medium">{profile.curso}</p>
                  </div>
                )}
                {profile.ano && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-medium">{profile.ano}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default PerfilPublico;
