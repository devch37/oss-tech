-- ═══════════════════════════════════════════════════════════════
-- V1__init.sql  —  OSS Tech-Radar 초기 스키마
-- YearMonth 필드는 DATE 타입 (월의 첫째 날, YYYY-MM-01)으로 저장
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. GitHub 레포지토리 ────────────────────────────────────
CREATE TABLE github_repositories
(
    id             BIGSERIAL    PRIMARY KEY,
    owner          VARCHAR(255) NOT NULL,
    name           VARCHAR(255) NOT NULL,
    domain         VARCHAR(100) NOT NULL,
    stars          INT          NOT NULL DEFAULT 0,
    forks          INT          NOT NULL DEFAULT 0,
    language       VARCHAR(100),
    last_pushed_at TIMESTAMP,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_owner_name UNIQUE (owner, name)
);

CREATE INDEX idx_github_repositories_domain
    ON github_repositories (domain);

CREATE INDEX idx_github_repositories_domain_stars
    ON github_repositories (domain, stars DESC);

-- ─── 2. 의존성 파일 스냅샷 ───────────────────────────────────
CREATE TABLE dependency_snapshots
(
    id            BIGSERIAL   PRIMARY KEY,
    repository_id BIGINT      NOT NULL
        REFERENCES github_repositories (id) ON DELETE CASCADE,
    collected_at  TIMESTAMP   NOT NULL,
    file_type     VARCHAR(20) NOT NULL,   -- GRADLE_KTS / GRADLE / MAVEN / NPM / PIP
    raw_content   TEXT        NOT NULL
);

CREATE INDEX idx_dependency_snapshots_repository_id
    ON dependency_snapshots (repository_id);

-- ─── 3. 라이브러리 월별 사용 집계 ───────────────────────────
CREATE TABLE library_usages
(
    id               BIGSERIAL        PRIMARY KEY,
    library_name     VARCHAR(500)     NOT NULL,
    domain           VARCHAR(100)     NOT NULL,
    collected_month  DATE             NOT NULL, -- 월의 첫째 날 (YYYY-MM-01)
    usage_count      INT              NOT NULL DEFAULT 0,
    prev_month_count INT              NOT NULL DEFAULT 0,
    growth_rate      DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    CONSTRAINT uq_library_domain_month UNIQUE (library_name, domain, collected_month)
);

CREATE INDEX idx_library_usages_domain_month
    ON library_usages (domain, collected_month);

CREATE INDEX idx_library_usages_name_domain
    ON library_usages (library_name, domain);

-- ─── 4. Active Level 지수 ────────────────────────────────────
CREATE TABLE active_level_scores
(
    id                BIGSERIAL        PRIMARY KEY,
    repository_id     BIGINT           NOT NULL
        REFERENCES github_repositories (id) ON DELETE CASCADE,
    score             DOUBLE PRECISION NOT NULL,
    commits_30d       INT              NOT NULL DEFAULT 0,
    prs_merged_30d    INT              NOT NULL DEFAULT 0,
    issues_closed_30d INT              NOT NULL DEFAULT 0,
    calculated_at     TIMESTAMP        NOT NULL
);

CREATE INDEX idx_active_level_scores_repository_id
    ON active_level_scores (repository_id);

CREATE INDEX idx_active_level_scores_calculated_at
    ON active_level_scores (calculated_at DESC);

-- ─── 5. AI 월간 리포트 ───────────────────────────────────────
CREATE TABLE monthly_reports
(
    id           BIGSERIAL    PRIMARY KEY,
    domain       VARCHAR(100) NOT NULL,
    report_month DATE         NOT NULL, -- 월의 첫째 날 (YYYY-MM-01)
    content      TEXT         NOT NULL,
    generated_at TIMESTAMP    NOT NULL,
    CONSTRAINT uq_report_domain_month UNIQUE (domain, report_month)
);

CREATE INDEX idx_monthly_reports_domain
    ON monthly_reports (domain);
