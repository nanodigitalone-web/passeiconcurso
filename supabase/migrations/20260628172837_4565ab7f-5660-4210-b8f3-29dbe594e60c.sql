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
    values (_me, 'convert', _coins, 'Conversão de ' || _points || ' pontos');
  return json_build_object('ok', true, 'moedas', _coins);
end; $$;

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
    values (_to, 'Recebeste moedas! 🪙', 'Um amigo enviou-te ' || _amount || ' moedas.');
  return json_build_object('ok', true);
end; $$;

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
    values (_to, 'Ganhaste acesso! 🎁', 'Um amigo desbloqueou um acesso completo para ti.');
  return json_build_object('ok', true);
end; $$;