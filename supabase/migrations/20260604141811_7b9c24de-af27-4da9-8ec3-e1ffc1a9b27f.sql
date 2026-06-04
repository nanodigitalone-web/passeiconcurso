-- 1) Stop exposing all profile rows (incl. email) to everyone.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Safe public ranking access (no email / sensitive fields) via SECURITY DEFINER fn.
CREATE OR REPLACE FUNCTION public.get_ranking(_categoria text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  nome text,
  avatar_url text,
  pontos integer,
  categoria_nome text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.nome, p.avatar_url, p.pontos, p.categoria_nome
  FROM public.profiles p
  WHERE p.hidden = false
    AND (_categoria IS NULL OR p.categoria_id = _categoria)
  ORDER BY p.pontos DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.get_ranking(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_ranking(text) TO authenticated;

-- 2) Allow users to delete their own uploaded payment proofs.
CREATE POLICY "Users delete own comprovativos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'comprovativos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);