CREATE TABLE IF NOT EXISTS schema_migrations
(
    version    BIGINT PRIMARY KEY NOT NULL,
    name       TEXT   NOT NULL DEFAULT '',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema_ddls
(
    version      BIGINT PRIMARY KEY NOT NULL,
    name         TEXT   NOT NULL DEFAULT '',
    up           TEXT   NOT NULL DEFAULT '',
    down         TEXT   NOT NULL DEFAULT '',
    prev_version BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
