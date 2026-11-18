-- 하나의 레포가 여러 topic(예: frontend + mobile)에 걸려 있으면 도메인마다 따로 집계해야 한다.
-- 기존에는 (owner, name) 이 유일해서 나중에 크롤링한 도메인이 레포를 가져가 버렸다.
ALTER TABLE github_repositories DROP CONSTRAINT uq_owner_name;
ALTER TABLE github_repositories ADD CONSTRAINT uq_owner_name_domain UNIQUE (owner, name, domain);
