import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, profile, loading, signOut } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <ShieldAlert className="h-14 w-14 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Conta bloqueada</h1>
          <p className="text-muted-foreground mb-6">A sua conta foi bloqueada. Contate o suporte.</p>
          <Button variant="secondary" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }
  return children;
};
