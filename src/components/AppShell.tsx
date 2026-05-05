import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { Button } from "@/components/ui/button";

const ROOT_ROUTES = ["/", "/concursos", "/percurso", "/ranking"];

export const AppShell = ({
  children,
  showBack,
}: {
  children: ReactNode;
  showBack?: boolean;
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const auto = !ROOT_ROUTES.includes(pathname);
  const display = showBack ?? auto;

  return (
    <div className="min-h-screen bg-gradient-soft">
      {display && (
        <div className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl items-center px-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
              className="rounded-full"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
};
