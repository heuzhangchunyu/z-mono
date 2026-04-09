CREATE TABLE IF NOT EXISTS episodes (
    script_id      BIGSERIAL    PRIMARY KEY,
    script_content TEXT         NOT NULL,
    style          VARCHAR(20)  NOT NULL,
    aspect_ratio   VARCHAR(10)  NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_episodes_deleted_at ON episodes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_episodes_style ON episodes(style);

COMMENT ON TABLE episodes IS 'z-meng 剧集创作表';
COMMENT ON COLUMN episodes.script_id IS '剧本ID';
COMMENT ON COLUMN episodes.script_content IS '剧本内容';
COMMENT ON COLUMN episodes.style IS '创作风格: 动漫, 真人';
COMMENT ON COLUMN episodes.aspect_ratio IS '画面比例: 16:9, 9:16, 1:1';
