-- =====================================================================
-- Seed / maintenance data. Run after schema.sql.
--   psql "$DATABASE_URL" -f database/seed.sql
--
-- Admin accounts are granted by email. The backend also auto-grants the
-- admin role on register/login for these same emails (see apps server),
-- so this script only needs to be run if those users already exist.
-- =====================================================================

insert into user_roles (user_id, role)
select u.id, 'admin'::app_role
from users u
where lower(u.email) in (
  'nanodigitalone@gmail.com',
  'joelarmandomanuel@gmail.com',
  'jamanueljo@gmail.com'
)
on conflict (user_id, role) do nothing;
