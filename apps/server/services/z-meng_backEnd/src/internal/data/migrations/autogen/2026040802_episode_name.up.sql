ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS episode_name VARCHAR(120);

UPDATE episodes
SET episode_name = CONCAT('剧集 ', script_id)
WHERE episode_name IS NULL;

ALTER TABLE episodes
ALTER COLUMN episode_name SET NOT NULL;

COMMENT ON COLUMN episodes.episode_name IS '剧集名';
