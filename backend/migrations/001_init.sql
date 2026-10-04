-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- 2. USER SETTINGS (1-1 with users)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
    user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    weekly_target_hours  NUMERIC(4,1) DEFAULT 15.0,
    dsa_sheet_url        TEXT DEFAULT 'https://neetcode.io/practice/practice/neetcode150',
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    color      VARCHAR(20) DEFAULT '#4f46e5',
    position   INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- ============================================================
-- 4. TOPICS (self-referencing for 2-level nesting via parent_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES topics(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    status      VARCHAR(30)  DEFAULT 'NOT_STARTED'
                    CHECK (status IN ('NOT_STARTED','IN_PROGRESS','LEARNED','INTERVIEW_READY')),
    confidence  SMALLINT     DEFAULT 1 CHECK (confidence BETWEEN 1 AND 5),
    notes_md    TEXT,
    position    INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_topics_user_cat ON topics(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent   ON topics(parent_id);

-- ============================================================
-- 5. RESOURCES (up to 3 per topic, enforced in app logic)
-- ============================================================
CREATE TABLE IF NOT EXISTS resources (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL
                    CHECK (type IN ('YOUTUBE_VIDEO','YOUTUBE_PLAYLIST','DEV_BLOG','OFFICIAL_DOCS','OTHER')),
    title       VARCHAR(255) NOT NULL,
    url         TEXT NOT NULL,
    est_minutes INT DEFAULT 30,
    status      VARCHAR(20) DEFAULT 'TODO'
                    CHECK (status IN ('TODO','DOING','DONE')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resources_topic ON resources(topic_id);

-- ============================================================
-- 6. STUDY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS study_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id   UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    logged_on  DATE NOT NULL DEFAULT CURRENT_DATE,
    minutes    INT  NOT NULL CHECK (minutes > 0),
    comment    TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logs_user_date ON study_logs(user_id, logged_on);
CREATE INDEX IF NOT EXISTS idx_logs_topic     ON study_logs(topic_id);

-- ============================================================
-- 7. REVISIONS (spaced repetition schedule)
-- ============================================================
CREATE TABLE IF NOT EXISTS revisions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id   UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    due_on     DATE NOT NULL,
    done_on    DATE,
    confidence SMALLINT CHECK (confidence BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_revisions_due ON revisions(user_id, due_on) WHERE done_on IS NULL;
