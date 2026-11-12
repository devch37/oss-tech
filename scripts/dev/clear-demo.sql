-- 샘플 데이터를 포함해 수집 데이터를 전부 비웁니다 (스키마/flyway 이력은 유지).
TRUNCATE github_repositories, dependency_snapshots, library_usages, active_level_scores, monthly_reports RESTART IDENTITY CASCADE;
