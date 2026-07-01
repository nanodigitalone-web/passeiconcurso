-- Allow NULL for interesses so we can reset and trigger the re-pick modal.
ALTER TABLE profiles ALTER COLUMN interesses DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN interesses SET DEFAULT NULL;

-- Reset all selections: NULL causes the InteressesModal to reappear on next visit.
UPDATE profiles SET interesses = NULL;
