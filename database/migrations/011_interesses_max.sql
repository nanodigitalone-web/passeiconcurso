-- 011: interesses_max — plan tier for interests (0=free/5, 10=básico, 30=pro)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interesses_max int NOT NULL DEFAULT 0;
