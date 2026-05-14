import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Concursos from "./pages/Concursos";
import ConcursoDetail from "./pages/ConcursoDetail";
import CategoriaDetail from "./pages/CategoriaDetail";
import Topicos from "./pages/Topicos";
import Quiz from "./pages/Quiz";
import Resultado from "./pages/Resultado";
import Percurso from "./pages/Percurso";
import Ranking from "./pages/Ranking";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";
import Aprender from "./pages/Aprender";
import AprenderSessao from "./pages/AprenderSessao";
import Acesso from "./pages/Acesso";
import Admin from "./pages/Admin";
import Notificacoes from "./pages/Notificacoes";
import { InstallPrompt } from "./components/InstallPrompt";

const queryClient = new QueryClient();

const P = ({ children }: { children: JSX.Element }) => <ProtectedRoute>{children}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<P><Index /></P>} />
            <Route path="/concursos" element={<P><Concursos /></P>} />
            <Route path="/concursos/:concursoId" element={<P><ConcursoDetail /></P>} />
            <Route path="/concursos/:concursoId/:categoriaId" element={<P><CategoriaDetail /></P>} />
            <Route path="/concursos/:concursoId/:categoriaId/topicos" element={<P><Topicos /></P>} />
            <Route path="/quiz/:concursoId/:categoriaId" element={<P><Quiz /></P>} />
            <Route path="/resultado/:id" element={<P><Resultado /></P>} />
            <Route path="/percurso" element={<P><Percurso /></P>} />
            <Route path="/ranking" element={<P><Ranking /></P>} />
            <Route path="/perfil" element={<P><Perfil /></P>} />
            <Route path="/aprender" element={<P><Aprender /></P>} />
            <Route path="/aprender/sessao/:concursoId/:categoriaId" element={<P><AprenderSessao /></P>} />
            <Route path="/acesso/:concursoId/:categoriaId" element={<P><Acesso /></P>} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/notificacoes" element={<P><Notificacoes /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <InstallPrompt />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
