-- Column-level security: users may only update the `read` flag on notifications,
-- not the title/body of their own notification rows.
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;