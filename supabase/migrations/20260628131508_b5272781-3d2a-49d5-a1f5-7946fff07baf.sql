-- 1. battles: prevent direct updates by participants (handled via SECURITY DEFINER RPC)
DROP POLICY IF EXISTS "No direct update on battles" ON public.battles;
CREATE POLICY "No direct update on battles"
ON public.battles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- 2. notifications: restrict broadcast/own notifications read to authenticated users only
DROP POLICY IF EXISTS "Users see their notifications" ON public.notifications;
CREATE POLICY "Users see their notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR (user_id IS NULL) OR is_admin(auth.uid()));

-- 3. profiles: prevent users from changing protected columns on their own profile
CREATE OR REPLACE FUNCTION public.tg_protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  -- Admins may change anything
  if public.is_admin(auth.uid()) then
    return new;
  end if;
  -- Non-admins cannot modify protected fields on their own profile
  new.pontos := old.pontos;
  new.streak := old.streak;
  new.blocked := old.blocked;
  new.hidden := old.hidden;
  new.email := old.email;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns ON public.profiles;
CREATE TRIGGER protect_profile_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.tg_protect_profile_columns();