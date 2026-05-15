
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz;

ALTER TABLE public.category_access
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.category_access
   SET expires_at = activated_at + interval '4 months'
 WHERE expires_at IS NULL;

ALTER TABLE public.category_access
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '4 months');

CREATE OR REPLACE FUNCTION public.has_category_access(_user uuid, _conc text, _cat text)
 RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  select
    coalesce((select created_at > now() - interval '2 days' from auth.users where id = _user), false)
    or exists (
      select 1 from public.category_access
      where user_id = _user and concurso_id = _conc and categoria_id = _cat
        and (expires_at is null or expires_at > now())
    );
$$;

CREATE OR REPLACE FUNCTION public.activate_access_code(_code text, _conc text, _cat text)
 RETURNS json
 LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare _cid uuid; _uid uuid := auth.uid();
begin
  if _uid is null then return json_build_object('ok', false, 'error', 'not_authenticated'); end if;
  select id into _cid from public.access_codes
   where code = _code and concurso_id = _conc and categoria_id = _cat and status = 'available' for update;
  if _cid is null then return json_build_object('ok', false, 'error', 'invalid_or_used'); end if;
  update public.access_codes set status = 'used', used_by = _uid, used_at = now() where id = _cid;
  insert into public.category_access (user_id, concurso_id, categoria_id, code, expires_at)
  values (_uid, _conc, _cat, _code, now() + interval '4 months')
  on conflict (user_id, concurso_id, categoria_id) do update set expires_at = now() + interval '4 months';
  return json_build_object('ok', true);
end $$;

-- Allow users to read their own comprovativo via signed URL: storage policy
DO $$ BEGIN
  CREATE POLICY "Admins read all comprovativos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'comprovativos' AND public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
