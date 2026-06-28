-- ============ COINS / WALLET FEATURE ============

-- 1. Wallet + IBAN columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS moedas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iban text;

-- Protect moedas from direct client updates (extend existing trigger fn)
CREATE OR REPLACE FUNCTION public.tg_protect_profile_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.is_admin(auth.uid()) then
    return new;
  end if;
  new.pontos := old.pontos;
  new.streak := old.streak;
  new.blocked := old.blocked;
  new.hidden := old.hidden;
  new.email := old.email;
  new.moedas := old.moedas;
  return new;
end;
$function$;

-- 2. Coin ledger
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL,            -- topup | convert | gift_sent | gift_received | access_purchase | gift_access | withdrawal
  amount integer NOT NULL,       -- signed (negative = saída)
  descricao text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_transactions TO authenticated;
GRANT ALL ON public.coin_transactions TO service_role;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_coin_tx_select" ON public.coin_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Coin top-up requests (buy coins via IBAN proof)
CREATE TABLE IF NOT EXISTS public.coin_topup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  amount_aoa integer NOT NULL,
  moedas integer NOT NULL,
  comprovativo_url text NOT NULL,
  status text NOT NULL DEFAULT 'awaiting_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.coin_topup_requests TO authenticated;
GRANT ALL ON public.coin_topup_requests TO service_role;
ALTER TABLE public.coin_topup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_topup_select" ON public.coin_topup_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_topup_insert" ON public.coin_topup_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_topup_all" ON public.coin_topup_requests
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_topup_updated BEFORE UPDATE ON public.coin_topup_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. Withdrawal requests (saque -> IBAN)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  moedas integer NOT NULL,
  aoa integer NOT NULL,
  iban text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_wd_select" ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin_wd_all" ON public.withdrawal_requests
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_wd_updated BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ RPCs ============

-- cost of access in coins
CREATE OR REPLACE FUNCTION public.coin_access_cost(_conc text)
 RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ select case when _conc = 'licenciatura-medicina' then 2000 else 1000 end $$;

-- convert points -> coins (1000 pts = 200 moedas)
CREATE OR REPLACE FUNCTION public.convert_points_to_coins(_points integer)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _me uuid := auth.uid(); _cur int; _coins int;
begin
  if _me is null then return json_build_object('ok', false, 'error', 'not_authenticated'); end if;
  if _points is null or _points < 1000 or _points % 1000 <> 0 then
    return json_build_object('ok', false, 'error', 'invalid_amount');
  end if;
  select pontos into _cur from public.profiles where id = _me for update;
  if _cur < _points then return json_build_object('ok', false, 'error', 'insufficient_points'); end if;
  _coins := (_points / 1000) * 200;
  update public.profiles set pontos = pontos - _points, moedas = moedas + _coins, updated_at = now() where id = _me;
  insert into public.coin_transactions(user_id, tipo, amount, descricao)
    values (_me, 'convert', _coins, 'Convers\u00e3o de ' || _points || ' pontos');
  return json_build_object('ok', true, 'moedas', _coins);
end; $$;

-- gift coins to another user
CREATE OR REPLACE FUNCTION public.gift_coins(_to uuid, _amount integer)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _me uuid := auth.uid(); _cur int; _toname text;
begin
  if _me is null then return json_build_object('ok', false, 'error', 'not_authenticated'); end if;
  if _to = _me then return json_build_object('ok', false, 'error', 'self'); end if;
  if _amount is null or _amount <= 0 then return json_build_object('ok', false, 'error', 'invalid_amount'); end if;
  select nome into _toname from public.profiles where id = _to;
  if _toname is null then return json_build_object('ok', false, 'error', 'not_found'); end if;
  select moedas into _cur from public.profiles where id = _me for update;
  if _cur < _amount then return json_build_object('ok', false, 'error', 'insufficient_coins'); end if;
  update public.profiles set moedas = moedas - _amount, updated_at = now() where id = _me;
  update public.profiles set moedas = moedas + _amount, updated_at = now() where id = _to;
  insert into public.coin_transactions(user_id, tipo, amount, descricao, meta)
    values (_me, 'gift_sent', -_amount, 'Enviado para ' || _toname, json_build_object('to', _to));
  insert into public.coin_transactions(user_id, tipo, amount, descricao, meta)
    values (_to, 'gift_received', _amount, 'Recebido de outro utilizador', json_build_object('from', _me));
  insert into public.notifications(user_id, title, body)
    values (_to, 'Recebeste moedas! \ud83e\ude99', 'Um amigo enviou-te ' || _amount || ' moedas.');
  return json_build_object('ok', true);
end; $$;

-- internal: grant access (used by purchase + gift)
CREATE OR REPLACE FUNCTION public.coin_grant_access(_user uuid, _conc text, _cat text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
begin
  insert into public.category_access(user_id, concurso_id, categoria_id, code, expires_at)
  values (_user, _conc, _cat, 'COIN' || substr(md5(random()::text),1,6), now() + interval '4 months')
  on conflict (user_id, concurso_id, categoria_id) do update set expires_at = now() + interval '4 months';
end; $$;

-- buy access for self with coins
CREATE OR REPLACE FUNCTION public.purchase_access_with_coins(_conc text, _cat text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _me uuid := auth.uid(); _cur int; _cost int;
begin
  if _me is null then return json_build_object('ok', false, 'error', 'not_authenticated'); end if;
  _cost := public.coin_access_cost(_conc);
  select moedas into _cur from public.profiles where id = _me for update;
  if _cur < _cost then return json_build_object('ok', false, 'error', 'insufficient_coins'); end if;
  update public.profiles set moedas = moedas - _cost, updated_at = now() where id = _me;
  perform public.coin_grant_access(_me, _conc, _cat);
  insert into public.coin_transactions(user_id, tipo, amount, descricao, meta)
    values (_me, 'access_purchase', -_cost, 'Acesso desbloqueado com moedas', json_build_object('conc', _conc, 'cat', _cat));
  return json_build_object('ok', true);
end; $$;

-- gift access to a friend with coins
CREATE OR REPLACE FUNCTION public.gift_access_with_coins(_to uuid, _conc text, _cat text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _me uuid := auth.uid(); _cur int; _cost int; _toname text;
begin
  if _me is null then return json_build_object('ok', false, 'error', 'not_authenticated'); end if;
  if _to = _me then return json_build_object('ok', false, 'error', 'self'); end if;
  select nome into _toname from public.profiles where id = _to;
  if _toname is null then return json_build_object('ok', false, 'error', 'not_found'); end if;
  _cost := public.coin_access_cost(_conc);
  select moedas into _cur from public.profiles where id = _me for update;
  if _cur < _cost then return json_build_object('ok', false, 'error', 'insufficient_coins'); end if;
  update public.profiles set moedas = moedas - _cost, updated_at = now() where id = _me;
  perform public.coin_grant_access(_to, _conc, _cat);
  insert into public.coin_transactions(user_id, tipo, amount, descricao, meta)
    values (_me, 'gift_access', -_cost, 'Acesso oferecido a ' || _toname, json_build_object('to', _to, 'conc', _conc, 'cat', _cat));
  insert into public.notifications(user_id, title, body)
    values (_to, 'Ganhaste acesso! \ud83c\udf81', 'Um amigo desbloqueou um acesso completo para ti.');
  return json_build_object('ok', true);
end; $$;

-- request withdrawal (min 2000 moedas = 2000 AOA)
CREATE OR REPLACE FUNCTION public.request_withdrawal(_moedas integer, _iban text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _me uuid := auth.uid(); _cur int; _email text;
begin
  if _me is null then return json_build_object('ok', false, 'error', 'not_authenticated'); end if;
  if _moedas is null or _moedas < 2000 then return json_build_object('ok', false, 'error', 'min_2000'); end if;
  if _iban is null or length(trim(_iban)) < 10 then return json_build_object('ok', false, 'error', 'invalid_iban'); end if;
  select moedas, email into _cur, _email from public.profiles where id = _me for update;
  if _cur < _moedas then return json_build_object('ok', false, 'error', 'insufficient_coins'); end if;
  update public.profiles set moedas = moedas - _moedas, iban = trim(_iban), updated_at = now() where id = _me;
  insert into public.withdrawal_requests(user_id, email, moedas, aoa, iban)
    values (_me, _email, _moedas, _moedas, trim(_iban));
  insert into public.coin_transactions(user_id, tipo, amount, descricao)
    values (_me, 'withdrawal', -_moedas, 'Pedido de saque (' || _moedas || ' AOA)');
  return json_build_object('ok', true);
end; $$;

-- admin: credit coins (used to approve top-up)
CREATE OR REPLACE FUNCTION public.admin_credit_coins(_user uuid, _amount integer, _desc text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_authorized'; end if;
  if _amount is null or _amount = 0 then return json_build_object('ok', false, 'error', 'invalid_amount'); end if;
  update public.profiles set moedas = moedas + _amount, updated_at = now() where id = _user;
  insert into public.coin_transactions(user_id, tipo, amount, descricao)
    values (_user, 'topup', _amount, coalesce(_desc, 'Carregamento de moedas'));
  return json_build_object('ok', true);
end; $$;