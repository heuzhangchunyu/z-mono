ALTER TABLE episodes
DROP CONSTRAINT IF EXISTS fk_episodes_user_id;

DROP INDEX IF EXISTS idx_episodes_user_id;

ALTER TABLE episodes
DROP COLUMN IF EXISTS user_id;
