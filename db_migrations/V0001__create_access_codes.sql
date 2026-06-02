CREATE TABLE access_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(128),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

INSERT INTO access_codes (code, label) VALUES
    ('demo-access-2024', 'Демо код'),
    ('steam-parser-pro', 'Основной код');
