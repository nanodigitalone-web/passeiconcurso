import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Concursos from "./pages/Concursos.tsx";
import ConcursoDetail from "./pages/ConcursoDetail.tsx";
import CategoriaDetail from "./pages/CategoriaDetail.tsx";
import Quiz from "./pages/Quiz.tsx";
import Resultado from "./pages/Resultado.tsx";
import Percurso from "./pages/Percurso.tsx";
import Ranking from "./pages/Ranking.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/concursos" element={<Concursos />} />
          <Route path="/concursos/:concursoId" element={<ConcursoDetail />} />
          <Route path="/concursos/:concursoId/:categoriaId" element={<CategoriaDetail />} />
          <Route path="/quiz/:concursoId/:categoriaId" element={<Quiz />} />
          <Route path="/resultado/:id" element={<Resultado />} />
          <Route path="/percurso" element={<Percurso />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
