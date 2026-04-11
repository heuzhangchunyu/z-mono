-- mig:up 2026040904 ai_prompt_templates_and_llm_call_logs
CREATE TABLE IF NOT EXISTS prompt_templates (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    template TEXT NOT NULL,
    system_prompt TEXT,
    model VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON prompt_templates(type);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active_type ON prompt_templates(type, is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_deleted_at ON prompt_templates(deleted_at);

COMMENT ON TABLE prompt_templates IS 'AI 提示词模板表';
COMMENT ON COLUMN prompt_templates.type IS '模板类型，例如 script_generation / subject_extraction';
COMMENT ON COLUMN prompt_templates.template IS '用户提示词模板，支持 {key} 与 {{key}} 占位符';
COMMENT ON COLUMN prompt_templates.system_prompt IS '系统提示词';
COMMENT ON COLUMN prompt_templates.model IS '模板默认模型，可为空';

CREATE TABLE IF NOT EXISTS llm_call_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    prompt_template_id BIGINT,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'ai_chat',
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    finish_reason VARCHAR(50),
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_call_logs_user_id ON llm_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_call_logs_prompt_template_id ON llm_call_logs(prompt_template_id);
CREATE INDEX IF NOT EXISTS idx_llm_call_logs_source ON llm_call_logs(source);
CREATE INDEX IF NOT EXISTS idx_llm_call_logs_created_at ON llm_call_logs(created_at);

ALTER TABLE llm_call_logs
    ADD CONSTRAINT fk_llm_call_logs_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

ALTER TABLE llm_call_logs
    ADD CONSTRAINT fk_llm_call_logs_prompt_template
    FOREIGN KEY (prompt_template_id)
    REFERENCES prompt_templates(id)
    ON DELETE SET NULL;

COMMENT ON TABLE llm_call_logs IS 'LLM 调用日志表';
COMMENT ON COLUMN llm_call_logs.user_id IS '发起调用的用户 ID';
COMMENT ON COLUMN llm_call_logs.prompt_template_id IS '命中的提示词模板 ID';
COMMENT ON COLUMN llm_call_logs.provider IS '模型提供商';
COMMENT ON COLUMN llm_call_logs.model IS '实际调用模型名';
COMMENT ON COLUMN llm_call_logs.source IS '调用来源，例如 ai_chat / script_generation';

-- mig:down 2026040904 ai_prompt_templates_and_llm_call_logs
DROP TABLE IF EXISTS llm_call_logs;
DROP TABLE IF EXISTS prompt_templates;
