-- =========================================================
-- Paid access: codes, payment requests, category access
-- =========================================================

-- Status enums
do $$ begin
  create type public.access_code_status as enum ('available','used','revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_request_status as enum ('pending','awaiting_review','approved','rejected');
exception when duplicate_object then null; end $$;

-- ACCESS CODES (admin-managed; 6-digit numeric, unique per category)
create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  concurso_id text not null,
  categoria_id text not null,
  code text not null check (code ~ '^[0-9]{6}$'),
  status public.access_code_status not null default 'available',
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists access_codes_unique_per_cat
  on public.access_codes (concurso_id, categoria_id, code);
create index if not exists access_codes_status_idx
  on public.access_codes (concurso_id, categoria_id, status);

alter table public.access_codes enable row level security;
-- No public policies => regular users cannot read codes directly. Activation uses SECURITY DEFINER fn.

-- CATEGORY ACCESS (per-user paid access record)
create table if not exists public.category_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concurso_id text not null,
  categoria_id text not null,
  code text,
  activated_at timestamptz not null default now(),
  unique (user_id, concurso_id, categoria_id)
);
alter table public.category_access enable row level security;

create policy "Users see own access"
  on public.category_access for select
  using (auth.uid() = user_id);

-- PAYMENT REQUESTS
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  concurso_id text not null,
  categoria_id text not null,
  categoria_nome text,
  comprovativo_url text,
  status public.payment_request_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payment_requests enable row level security;

create policy "Users insert own payment request"
  on public.payment_requests for insert
  with check (auth.uid() = user_id);

create policy "Users see own payment requests"
  on public.payment_requests for select
  using (auth.uid() = user_id);

create policy "Users update own payment request"
  on public.payment_requests for update
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_pr_updated on public.payment_requests;
create trigger trg_pr_updated before update on public.payment_requests
  for each row execute function public.tg_set_updated_at();

-- =========================================================
-- Helper functions
-- =========================================================

-- Returns true if the user is in the 2-day free trial OR has paid access
create or replace function public.has_category_access(_user uuid, _conc text, _cat text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    coalesce((select created_at > now() - interval '2 days' from auth.users where id = _user), false)
    or exists (
      select 1 from public.category_access
      where user_id = _user and concurso_id = _conc and categoria_id = _cat
    );
$$;

-- Activate a 6-digit code for the current user
create or replace function public.activate_access_code(_code text, _conc text, _cat text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  _cid uuid;
  _uid uuid := auth.uid();
begin
  if _uid is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select id into _cid
  from public.access_codes
  where code = _code
    and concurso_id = _conc
    and categoria_id = _cat
    and status = 'available'
  for update;

  if _cid is null then
    return json_build_object('ok', false, 'error', 'invalid_or_used');
  end if;

  update public.access_codes
     set status = 'used', used_by = _uid, used_at = now()
   where id = _cid;

  insert into public.category_access (user_id, concurso_id, categoria_id, code)
  values (_uid, _conc, _cat, _code)
  on conflict (user_id, concurso_id, categoria_id) do nothing;

  return json_build_object('ok', true);
end $$;

-- =========================================================
-- Storage bucket for transfer receipts (private)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('comprovativos', 'comprovativos', false)
on conflict (id) do nothing;

create policy "Users upload own comprovativos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovativos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own comprovativos"
  on storage.objects for select to authenticated
  using (bucket_id = 'comprovativos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own comprovativos"
  on storage.objects for update to authenticated
  using (bucket_id = 'comprovativos' and (storage.foldername(name))[1] = auth.uid()::text);
