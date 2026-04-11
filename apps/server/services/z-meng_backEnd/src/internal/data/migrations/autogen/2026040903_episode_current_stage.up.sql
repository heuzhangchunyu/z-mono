ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS current_stage VARCHAR(32) NOT NULL DEFAULT 'script';

UPDATE episodes
SET current_stage = 'script'
WHERE current_stage IS NULL OR current_stage = '';

COMMENT ON COLUMN episodes.current_stage IS '当前剧集阶段: script, subject, keyframes, video-production';
