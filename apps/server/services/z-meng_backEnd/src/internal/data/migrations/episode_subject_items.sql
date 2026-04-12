-- mig:up 2026041201 episode_subject_items
CREATE TABLE IF NOT EXISTS episode_subject_items (
    id BIGSERIAL PRIMARY KEY,
    script_id BIGINT NOT NULL,
    subject_type VARCHAR(20) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_episode_subject_items_script_id
      FOREIGN KEY (script_id)
      REFERENCES episodes(script_id)
      ON DELETE CASCADE,
    CONSTRAINT chk_episode_subject_items_type
      CHECK (subject_type IN ('character', 'scene', 'prop'))
);

CREATE INDEX IF NOT EXISTS idx_episode_subject_items_script_id ON episode_subject_items(script_id);
CREATE INDEX IF NOT EXISTS idx_episode_subject_items_type ON episode_subject_items(subject_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_episode_subject_items_unique_name
  ON episode_subject_items(script_id, subject_type, subject_name);

INSERT INTO episode_subject_items (
    script_id,
    subject_type,
    subject_name,
    created_at,
    updated_at
)
SELECT
    subjects.script_id,
    'character',
    character_name.value,
    NOW(),
    NOW()
FROM episode_subjects AS subjects
CROSS JOIN LATERAL jsonb_array_elements_text(subjects.characters_json) AS character_name(value)
ON CONFLICT (script_id, subject_type, subject_name) DO NOTHING;

INSERT INTO episode_subject_items (
    script_id,
    subject_type,
    subject_name,
    created_at,
    updated_at
)
SELECT
    subjects.script_id,
    'scene',
    scene_name.value,
    NOW(),
    NOW()
FROM episode_subjects AS subjects
CROSS JOIN LATERAL jsonb_array_elements_text(subjects.scenes_json) AS scene_name(value)
ON CONFLICT (script_id, subject_type, subject_name) DO NOTHING;

INSERT INTO episode_subject_items (
    script_id,
    subject_type,
    subject_name,
    created_at,
    updated_at
)
SELECT
    subjects.script_id,
    'prop',
    prop_name.value,
    NOW(),
    NOW()
FROM episode_subjects AS subjects
CROSS JOIN LATERAL jsonb_array_elements_text(subjects.props_json) AS prop_name(value)
ON CONFLICT (script_id, subject_type, subject_name) DO NOTHING;

COMMENT ON TABLE episode_subject_items IS '剧集主体明细表，每个主体一条记录';
COMMENT ON COLUMN episode_subject_items.script_id IS '所属剧集 ID，等同于当前项目里的剧本 ID';
COMMENT ON COLUMN episode_subject_items.subject_type IS '主体类型：character / scene / prop';
COMMENT ON COLUMN episode_subject_items.subject_name IS '主体名称';

-- mig:down 2026041201 episode_subject_items
DROP TABLE IF EXISTS episode_subject_items;
