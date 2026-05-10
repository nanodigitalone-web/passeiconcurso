
-- 1. Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.has_role(_user_id, 'admin'::public.app_role) $$;

create policy "Users see own roles" on public.user_roles
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "Admins manage roles" on public.user_roles
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- 2. Seed admins for current users with those emails
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) in ('nanodigitalone@gmail.com','joelarmandomanuel@gmail.com','jamanueljo@gmail.com')
on conflict do nothing;

-- 3. Auto-grant admin on signup if email matches
create or replace function public.handle_new_user_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if lower(coalesce(new.email,'')) in ('nanodigitalone@gmail.com','joelarmandomanuel@gmail.com','jamanueljo@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin
  after insert on auth.users for each row execute function public.handle_new_user_admin();

-- 4. Profiles: blocked / hidden
alter table public.profiles
  add column if not exists blocked boolean not null default false,
  add column if not exists hidden boolean not null default false,
  add column if not exists email text;

-- backfill emails
update public.profiles p set email = u.email
from auth.users u where u.id = p.id and p.email is null;

-- update handle_new_user to also store email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1), 'Candidato'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  ) on conflict (id) do nothing;
  return new;
end $$;

-- Admin policies on profiles
create policy "Admins view all profiles full" on public.profiles
  for select using (public.is_admin(auth.uid()));
create policy "Admins update profiles" on public.profiles
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "Admins delete profiles" on public.profiles
  for delete using (public.is_admin(auth.uid()));

-- 5. Admin access on access_codes & category_access & payment_requests
create policy "Admins read access codes" on public.access_codes
  for select using (public.is_admin(auth.uid()));
create policy "Admins manage access codes" on public.access_codes
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "Admins read category access" on public.category_access
  for select using (public.is_admin(auth.uid()));
create policy "Admins manage category access" on public.category_access
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "Admins read payment requests" on public.payment_requests
  for select using (public.is_admin(auth.uid()));
create policy "Admins update payment requests" on public.payment_requests
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- 6. Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = broadcast
  title text not null,
  body text not null,
  read boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users see their notifications" on public.notifications
  for select using (auth.uid() = user_id or user_id is null or public.is_admin(auth.uid()));
create policy "Users update own notification read" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins create notifications" on public.notifications
  for insert with check (public.is_admin(auth.uid()));
create policy "Admins delete notifications" on public.notifications
  for delete using (public.is_admin(auth.uid()));

-- 7. Generate codes RPC (admin only)
create or replace function public.admin_generate_codes(_conc text, _cat text, _count int)
returns int
language plpgsql security definer set search_path = public
as $$
declare i int := 0; _code text; _new int := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_authorized';
  end if;
  while _new < _count loop
    _code := lpad(floor(random()*1000000)::int::text, 6, '0');
    begin
      insert into public.access_codes (concurso_id, categoria_id, code) values (_conc, _cat, _code);
      _new := _new + 1;
    exception when unique_violation then
      -- skip duplicate
      null;
    end;
    i := i + 1;
    exit when i > _count * 5;
  end loop;
  return _new;
end $$;

-- ensure unique constraint on codes for that RPC retry logic
create unique index if not exists access_codes_unique on public.access_codes(concurso_id, categoria_id, code);
