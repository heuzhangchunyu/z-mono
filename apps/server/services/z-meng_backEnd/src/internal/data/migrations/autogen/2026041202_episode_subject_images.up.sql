CREATE TABLE IF NOT EXISTS episode_subject_images (
    id BIGSERIAL PRIMARY KEY,
    subject_item_id BIGINT NOT NULL,
    script_id BIGINT NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    image_url TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    provider VARCHAR(50) NOT NULL DEFAULT 'dashscope',
    model VARCHAR(100) NOT NULL DEFAULT '',
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_episode_subject_images_subject_item_id
      FOREIGN KEY (subject_item_id)
      REFERENCES episode_subject_items(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_episode_subject_images_script_id
      FOREIGN KEY (script_id)
      REFERENCES episodes(script_id)
      ON DELETE CASCADE,
    CONSTRAINT chk_episode_subject_images_status
      CHECK (status IN ('waiting', 'processing', 'success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_episode_subject_images_subject_item_id
  ON episode_subject_images(subject_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_episode_subject_images_script_id
  ON episode_subject_images(script_id);

COMMENT ON TABLE episode_subject_images IS '主体图片生成历史表，每次生图请求对应一条记录';
COMMENT ON COLUMN episode_subject_images.subject_item_id IS '主体 ID，对应 episode_subject_items.id';
COMMENT ON COLUMN episode_subject_images.script_id IS '所属剧集 ID，等同于当前项目里的剧本 ID';
COMMENT ON COLUMN episode_subject_images.prompt IS '本次主体生图要求';
COMMENT ON COLUMN episode_subject_images.image_url IS '本次生成成功后的图片地址';
COMMENT ON COLUMN episode_subject_images.status IS '当前生图状态：waiting / processing / success / failed';
