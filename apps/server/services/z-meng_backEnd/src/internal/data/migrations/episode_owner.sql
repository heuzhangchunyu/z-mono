-- mig:up 2026040803 episode_owner
ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS user_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_episodes_user_id'
  ) THEN
    ALTER TABLE episodes
    ADD CONSTRAINT fk_episodes_user_id
    FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON episodes(user_id);

COMMENT ON COLUMN episodes.user_id IS '所属用户ID';

-- mig:down 2026040803 episode_owner
ALTER TABLE episodes
DROP CONSTRAINT IF EXISTS fk_episodes_user_id;

DROP INDEX IF EXISTS idx_episodes_user_id;

ALTER TABLE episodes
DROP COLUMN IF EXISTS user_id;
