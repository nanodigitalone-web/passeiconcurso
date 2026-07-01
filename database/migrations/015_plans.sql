-- Migration 015: planos e subscrições

-- Planos disponíveis
CREATE TABLE IF NOT EXISTS plans (
  id              text    PRIMARY KEY,
  name            text    NOT NULL,
  price_aoa       integer NOT NULL DEFAULT 0,
  max_disciplines integer NOT NULL DEFAULT 1,
  max_members     integer NOT NULL DEFAULT 1,
  duration_days   integer NOT NULL DEFAULT 30,
  active          boolean NOT NULL DEFAULT true
);

INSERT INTO plans (id, name, price_aoa, max_disciplines, max_members, duration_days) VALUES
  ('free',    'Gratuito', 0,      1,  1, 30),
  ('basico',  'Básico',   1000,   3,  1, 30),
  ('pro',     'Pro',      2000,   5,  1, 30),
  ('pro_max', 'Pro Max',  3000,   10, 1, 30),
  ('familia', 'Família',  10000,  20, 5, 30)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  price_aoa       = EXCLUDED.price_aoa,
  max_disciplines = EXCLUDED.max_disciplines,
  max_members     = EXCLUDED.max_members,
  duration_days   = EXCLUDED.duration_days;

-- Subscrições dos utilizadores
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                 uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id            text     NOT NULL REFERENCES plans(id),
  status             text     NOT NULL DEFAULT 'pending',
  -- pending = submitted comprovativo, waiting admin
  -- active  = approved, disciplines may be chosen
  -- expired = past expires_at
  disciplines        jsonb    NOT NULL DEFAULT '[]',
  disciplines_locked boolean  NOT NULL DEFAULT false,
  expires_at         timestamptz,
  activated_at       timestamptz,
  comprovativo_url   text,
  notes              text,
  activated_by       uuid     REFERENCES users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_user_subscriptions_updated
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user   ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Membros do plano Família
CREATE TABLE IF NOT EXISTS subscription_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  uuid NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  member_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  disciplines      jsonb    NOT NULL DEFAULT '[]',
  disciplines_locked boolean NOT NULL DEFAULT false,
  added_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, member_user_id)
);
CREATE INDEX IF NOT EXISTS idx_sub_members_sub    ON subscription_members(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_members_member ON subscription_members(member_user_id);

-- Vista de compatibilidade: unifica acesso antigo (category_access) e novo (user_subscriptions)
-- Usada em content.ts para verificar se utilizador tem qualquer plano activo.
CREATE OR REPLACE VIEW access_plans AS
  SELECT user_id, expires_at FROM category_access
  UNION ALL
  SELECT user_id, expires_at FROM user_subscriptions WHERE status = 'active';
