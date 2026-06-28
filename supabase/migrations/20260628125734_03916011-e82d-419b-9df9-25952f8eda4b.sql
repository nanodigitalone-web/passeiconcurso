-- ============ WEEKLY POINTS ============
create table public.points_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  created_at timestamptz not null default now()
);
grant select on public.points_log to authenticated;
grant all on public.points_log to service_role;
alter table public.points_log enable row level security;
create policy "own points log readable" on public.points_log
  for select to authenticated using (auth.uid() = user_id);
create index points_log_created_idx on public.points_log(created_at);
create index points_log_user_idx on public.points_log(user_id);

create or replace function public.add_points(_delta integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if _delta is null or _delta < 0 or _delta > 100 then raise exception 'invalid_delta'; end if;
  update public.profiles set pontos = pontos + _delta, updated_at = now() where id = auth.uid();
  insert into public.points_log(user_id, delta) values (auth.uid(), _delta);
end; $$;

create or replace function public.get_weekly_ranking()
returns table(id uuid, nome text, avatar_url text, pontos integer, categoria_nome text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.avatar_url, coalesce(sum(l.delta),0)::int as pontos, p.categoria_nome
  from public.profiles p
  join public.points_log l on l.user_id = p.id
  where l.created_at >= date_trunc('week', now())
    and (p.hidden = false or p.id = auth.uid())
  group by p.id, p.nome, p.avatar_url, p.categoria_nome
  having coalesce(sum(l.delta),0) > 0
  order by pontos desc
  limit 50;
$$;

-- ============ FRIEND CODES ============
alter table public.profiles add column friend_code text unique;

create or replace function public.gen_friend_code()
returns text language plpgsql set search_path = public as $$
declare c text; ex boolean;
begin
  loop
    c := upper(substr(md5(random()::text), 1, 6));
    select exists(select 1 from public.profiles where friend_code = c) into ex;
    exit when not ex;
  end loop;
  return c;
end; $$;

create or replace function public.tg_set_friend_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.friend_code is null then new.friend_code := public.gen_friend_code(); end if;
  return new;
end; $$;

create trigger set_friend_code before insert on public.profiles
  for each row execute function public.tg_set_friend_code();

do $$
declare r record;
begin
  for r in select id from public.profiles where friend_code is null loop
    update public.profiles set friend_code = public.gen_friend_code() where id = r.id;
  end loop;
end $$;

create or replace function public.search_users(_q text)
returns table(id uuid, nome text, avatar_url text, categoria_nome text, friend_code text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.avatar_url, p.categoria_nome, p.friend_code
  from public.profiles p
  where p.id <> auth.uid()
    and p.blocked is not true
    and (
      p.nome ilike '%' || _q || '%'
      or p.email ilike '%' || _q || '%'
      or p.friend_code = upper(_q)
    )
  limit 20;
$$;

-- ============ FRIENDSHIPS ============
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique(requester_id, addressee_id)
);
grant select, insert, delete on public.friendships to authenticated;
grant all on public.friendships to service_role;
alter table public.friendships enable row level security;
create policy "see own friendships" on public.friendships
  for select to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "create own requests" on public.friendships
  for insert to authenticated with check (auth.uid() = requester_id);
create policy "delete own friendships" on public.friendships
  for delete to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id);

create or replace function public.send_friend_request(_to uuid)
returns json language plpgsql security definer set search_path = public as $$
declare _me uuid := auth.uid();
begin
  if _me is null then return json_build_object('ok', false, 'error', 'not_authenticated'); end if;
  if _to = _me then return json_build_object('ok', false, 'error', 'self'); end if;
  if exists(select 1 from public.friendships where requester_id = _to and addressee_id = _me) then
    update public.friendships set status = 'accepted' where requester_id = _to and addressee_id = _me;
    return json_build_object('ok', true, 'status', 'accepted');
  end if;
  insert into public.friendships(requester_id, addressee_id, status)
  values (_me, _to, 'pending')
  on conflict (requester_id, addressee_id) do nothing;
  return json_build_object('ok', true, 'status', 'pending');
end; $$;

create or replace function public.add_friend_by_code(_code text)
returns json language plpgsql security definer set search_path = public as $$
declare _to uuid;
begin
  select id into _to from public.profiles where friend_code = upper(_code);
  if _to is null then return json_build_object('ok', false, 'error', 'not_found'); end if;
  return public.send_friend_request(_to);
end; $$;

create or replace function public.respond_friend_request(_id uuid, _accept boolean)
returns json language plpgsql security definer set search_path = public as $$
declare _me uuid := auth.uid();
begin
  if _accept then
    update public.friendships set status = 'accepted'
      where id = _id and addressee_id = _me and status = 'pending';
  else
    delete from public.friendships where id = _id and (addressee_id = _me or requester_id = _me);
  end if;
  return json_build_object('ok', true);
end; $$;

create or replace function public.get_friends()
returns table(friendship_id uuid, friend_id uuid, nome text, avatar_url text,
  categoria_nome text, pontos integer, status text, direction text)
language sql stable security definer set search_path = public as $$
  select f.id,
    case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end,
    p.nome, p.avatar_url, p.categoria_nome, p.pontos, f.status,
    case when f.requester_id = auth.uid() then 'outgoing' else 'incoming' end
  from public.friendships f
  join public.profiles p on p.id = (case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end)
  where f.requester_id = auth.uid() or f.addressee_id = auth.uid()
  order by f.status, p.nome;
$$;

-- ============ BATTLES ============
create table public.battles (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  concurso_id text not null,
  categoria_id text not null,
  question_ids jsonb not null,
  status text not null default 'pending',
  challenger_score int,
  opponent_score int,
  challenger_done boolean not null default false,
  opponent_done boolean not null default false,
  winner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.battles to authenticated;
grant all on public.battles to service_role;
alter table public.battles enable row level security;
create policy "battle participants read" on public.battles
  for select to authenticated using (challenger_id = auth.uid() or opponent_id = auth.uid());
create policy "challenger creates battle" on public.battles
  for insert to authenticated with check (challenger_id = auth.uid());

create or replace function public.submit_battle_result(_battle uuid, _score integer)
returns json language plpgsql security definer set search_path = public as $$
declare b record; _me uuid := auth.uid();
begin
  select * into b from public.battles where id = _battle;
  if b is null then return json_build_object('ok', false, 'error', 'not_found'); end if;
  if _me = b.challenger_id then
    update public.battles set challenger_score = _score, challenger_done = true,
      status = 'active', updated_at = now() where id = _battle;
  elsif _me = b.opponent_id then
    update public.battles set opponent_score = _score, opponent_done = true,
      status = 'active', updated_at = now() where id = _battle;
  else
    return json_build_object('ok', false, 'error', 'not_participant');
  end if;
  update public.battles set status = 'finished',
    winner_id = case when challenger_score > opponent_score then challenger_id
                     when opponent_score > challenger_score then opponent_id else null end,
    updated_at = now()
  where id = _battle and challenger_done and opponent_done;
  return json_build_object('ok', true);
end; $$;

create or replace function public.get_battles()
returns table(id uuid, opponent_id uuid, opponent_nome text, opponent_avatar text,
  concurso_id text, categoria_id text, question_ids jsonb, status text,
  challenger_id uuid, challenger_score int, opponent_score int,
  challenger_done boolean, opponent_done boolean, winner_id uuid, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.id,
    case when b.challenger_id = auth.uid() then b.opponent_id else b.challenger_id end,
    op.nome, op.avatar_url,
    b.concurso_id, b.categoria_id, b.question_ids, b.status,
    b.challenger_id, b.challenger_score, b.opponent_score,
    b.challenger_done, b.opponent_done, b.winner_id, b.created_at
  from public.battles b
  join public.profiles op on op.id = (case when b.challenger_id = auth.uid() then b.opponent_id else b.challenger_id end)
  where b.challenger_id = auth.uid() or b.opponent_id = auth.uid()
  order by b.created_at desc;
$$;