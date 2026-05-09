-- Fix search_path on trigger function
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end $$;

-- Lock down SECURITY DEFINER fns: only authenticated users may call
revoke all on function public.has_category_access(uuid, text, text) from public, anon;
grant execute on function public.has_category_access(uuid, text, text) to authenticated;

revoke all on function public.activate_access_code(text, text, text) from public, anon;
grant execute on function public.activate_access_code(text, text, text) to authenticated;

-- Explicit deny policies on access_codes (clarify intent for linter)
create policy "No direct read on access_codes"
  on public.access_codes for select to authenticated using (false);
create policy "No direct write on access_codes"
  on public.access_codes for all to authenticated using (false) with check (false);
