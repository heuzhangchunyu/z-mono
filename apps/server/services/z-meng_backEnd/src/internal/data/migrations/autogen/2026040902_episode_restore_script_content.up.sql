ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS script_content TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN episodes.script_content IS '剧本内容';
