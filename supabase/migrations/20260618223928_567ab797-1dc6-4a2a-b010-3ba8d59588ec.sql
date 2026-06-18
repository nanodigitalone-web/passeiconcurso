-- 1. Column-level security on profiles: prevent users from self-editing
-- sensitive fields (pontos, streak, blocked, hidden, email).
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (nome, avatar_url, bio, concurso_id, categoria_id, categoria_nome, last_seen, updated_at)
  ON public.profiles TO authenticated;

-- 2. Server-validated points award (clients can no longer set pontos directly).
CREATE OR REPLACE FUNCTION public.add_points(_delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if _delta is null or _delta < 0 or _delta > 100 then
    raise exception 'invalid_delta';
  end if;
  update public.profiles
    set pontos = pontos + _delta, updated_at = now()
    where id = auth.uid();
end;
$$;

GRANT EXECUTE ON FUNCTION public.add_points(integer) TO authenticated;

-- 3. Protect the push-notify cron trigger with a shared secret header.
select cron.unschedule('push-inactive-users');
select cron.schedule(
  'push-inactive-users',
  '0 */8 * * *',
  $$
  select net.http_post(
    url:='https://kqtwvxmyexrbhbxexrgu.supabase.co/functions/v1/push-notify',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "3f617b629c71d5a01aa3610dfab96efbd373a0e65126f85f"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);