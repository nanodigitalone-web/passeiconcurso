DROP POLICY IF EXISTS "Users insert own payment request" ON public.payment_requests;

CREATE POLICY "Users insert own payment request"
ON public.payment_requests
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);