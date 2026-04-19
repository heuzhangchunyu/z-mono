-- mig:up 2026041901 users
CREATE TABLE IF NOT EXISTS users
(
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash TEXT NOT NULL,
    nickname VARCHAR(100) NOT NULL DEFAULT '',
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'))
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
    ON users ((BTRIM(username)));

INSERT INTO users (username, password_hash, nickname, role, is_active)
SELECT 'demo_admin',
       'scrypt$16384$8$1$ee40cf51d45e6a0e9203c4808252e958$1bc7e79fd91e33906a63667ab21fd963ba1c6462f012600a1fa1830167200874bca542a7c531237446e729389d9f18981d08ad190e58396427848b81eb6a18ea',
       '即梦样式体验账号',
       'admin',
       TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE BTRIM(username) = 'demo_admin'
);

-- mig:down 2026041901 users
DROP INDEX IF EXISTS users_username_unique_idx;
DROP TABLE IF EXISTS users;
