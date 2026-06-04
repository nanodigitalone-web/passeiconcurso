CREATE OR REPLACE FUNCTION public.has_category_access(_user uuid, _conc text, _cat text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.is_admin(_user)
    or coalesce((select created_at > now() - interval '2 days' from auth.users where id = _user), false)
    or exists (
      select 1 from public.category_access
      where user_id = _user and concurso_id = _conc and categoria_id = _cat
        and (expires_at is null or expires_at > now())
    );
$function$;