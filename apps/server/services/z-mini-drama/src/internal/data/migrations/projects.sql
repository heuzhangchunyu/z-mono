-- mig:up 2026042001 projects
CREATE TABLE IF NOT EXISTS projects
(
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    aspect_ratio VARCHAR(20),
    global_art_style TEXT,
    visual_asset_description JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT projects_status_check CHECK (status IN ('draft', 'in_progress', 'completed'))
);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_deleted_at_idx ON projects(deleted_at);

-- mig:down 2026042001 projects
DROP INDEX IF EXISTS projects_deleted_at_idx;
DROP INDEX IF EXISTS projects_status_idx;
DROP TABLE IF EXISTS projects CASCADE;

-- mig:up 2026042002 user_projects
CREATE TABLE IF NOT EXISTS user_projects
(
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_id),
    CONSTRAINT fk_user_projects_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_projects_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS user_projects_user_id_idx ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS user_projects_project_id_idx ON user_projects(project_id);

-- mig:down 2026042002 user_projects
DROP INDEX IF EXISTS user_projects_project_id_idx;
DROP INDEX IF EXISTS user_projects_user_id_idx;
DROP TABLE IF EXISTS user_projects CASCADE;
