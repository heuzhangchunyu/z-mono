-- mig:up 2026040903 episode_current_stage
ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS current_stage VARCHAR(32) NOT NULL DEFAULT 'script';

UPDATE episodes
SET current_stage = 'script'
WHERE current_stage IS NULL OR current_stage = '';

COMMENT ON COLUMN episodes.current_stage IS '当前剧集阶段: script, subject, keyframes, video-production';

-- mig:down 2026040903 episode_current_stage
ALTER TABLE episodes
DROP COLUMN IF EXISTS current_stage;
