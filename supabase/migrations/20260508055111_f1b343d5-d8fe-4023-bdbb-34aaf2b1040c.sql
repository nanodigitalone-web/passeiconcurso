ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS concurso_id text,
ADD COLUMN IF NOT EXISTS categoria_id text,
ADD COLUMN IF NOT EXISTS categoria_nome text;