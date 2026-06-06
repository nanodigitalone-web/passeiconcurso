CREATE OR REPLACE FUNCTION public.get_ranking(_categoria text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, nome text, avatar_url text, pontos integer, categoria_nome text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.nome, p.avatar_url, p.pontos, p.categoria_nome
  FROM public.profiles p
  WHERE (p.hidden = false OR p.id = auth.uid())
    AND (_categoria IS NULL OR p.categoria_id = _categoria)
  ORDER BY p.pontos DESC
  LIMIT 100;
$function$;