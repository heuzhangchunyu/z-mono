-- mig:up 2026040902 episode_restore_script_content
ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS script_content TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN episodes.script_content IS '剧本内容';

-- mig:down 2026040902 episode_restore_script_content
ALTER TABLE episodes
DROP COLUMN IF EXISTS script_content;
