-- ═══════════════════════════════════════════════════════════════
-- V2__monthly_report_language.sql — AI 월간 리포트 다국어(en/ko) 지원
-- 기존 리포트는 한국어로 생성되었으므로 'ko'로 채운다.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE monthly_reports
    ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'ko';

ALTER TABLE monthly_reports
    DROP CONSTRAINT uq_report_domain_month;

ALTER TABLE monthly_reports
    ADD CONSTRAINT uq_report_domain_month_language UNIQUE (domain, report_month, language);

-- 이후 INSERT는 항상 language를 명시하므로 기본값은 제거한다.
ALTER TABLE monthly_reports
    ALTER COLUMN language DROP DEFAULT;

CREATE INDEX idx_monthly_reports_domain_language
    ON monthly_reports (domain, language);
