CREATE TABLE public.cursos_preparatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concurso_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  logo_url TEXT,
  contacto TEXT,
  link_externo TEXT,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cursos_preparatorios TO authenticated;
GRANT ALL ON public.cursos_preparatorios TO service_role;

ALTER TABLE public.cursos_preparatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active courses"
  ON public.cursos_preparatorios FOR SELECT
  TO authenticated
  USING (ativo = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage courses"
  ON public.cursos_preparatorios FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER set_cursos_preparatorios_updated_at
  BEFORE UPDATE ON public.cursos_preparatorios
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();