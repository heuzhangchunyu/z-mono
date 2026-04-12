CREATE TABLE IF NOT EXISTS episode_subjects (
    id BIGSERIAL PRIMARY KEY,
    script_id BIGINT NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'waiting',
    characters_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    scenes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    props_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_episode_subjects_script_id
      FOREIGN KEY (script_id)
      REFERENCES episodes(script_id)
      ON DELETE CASCADE,
    CONSTRAINT chk_episode_subjects_status
      CHECK (status IN ('waiting', 'processing', 'success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_episode_subjects_status ON episode_subjects(status);
CREATE INDEX IF NOT EXISTS idx_episode_subjects_updated_at ON episode_subjects(updated_at);

INSERT INTO episode_subjects (
    script_id,
    status,
    characters_json,
    scenes_json,
    props_json,
    error_message,
    created_at,
    updated_at
)
SELECT
    episodes.script_id,
    'waiting',
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    NULL,
    NOW(),
    NOW()
FROM episodes
WHERE episodes.deleted_at IS NULL
ON CONFLICT (script_id) DO NOTHING;

COMMENT ON TABLE episode_subjects IS '剧集主体提取结果表';
COMMENT ON COLUMN episode_subjects.script_id IS '所属剧集 ID，关联 episodes.script_id';
COMMENT ON COLUMN episode_subjects.status IS '主体提取状态：waiting / processing / success / failed';
COMMENT ON COLUMN episode_subjects.characters_json IS '角色名称列表';
COMMENT ON COLUMN episode_subjects.scenes_json IS '场景名称列表';
COMMENT ON COLUMN episode_subjects.props_json IS '道具名称列表';
