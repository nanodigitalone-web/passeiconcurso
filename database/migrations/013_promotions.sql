create table if not exists promotions (
  id          uuid primary key default gen_random_uuid(),
  label       text not null default 'Promoção',
  discount_pct int not null default 100 check (discount_pct between 0 and 100),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
