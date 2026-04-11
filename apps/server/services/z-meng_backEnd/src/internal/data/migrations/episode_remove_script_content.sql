-- mig:up 2026040901 episode_remove_script_content
ALTER TABLE episodes
DROP COLUMN IF EXISTS script_content;

-- mig:down 2026040901 episode_remove_script_content
ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS script_content TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN episodes.script_content IS '剧本内容';
